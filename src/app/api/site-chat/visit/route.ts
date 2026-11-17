import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimited, clientIp } from "@/lib/rate-limit";
import { chatTenantFromRequest } from "@/lib/site-chat/config";

/**
 * Visitor heartbeat from the chat widget (every ~20s and on route change),
 * for "Online now" and the visitor stats in the chat inbox. No PII: session
 * id, path, title, referrer host, country.
 *
 *   POST { sessionId, pageId, path, title?, referrer?, firstSeen?, visits?, seconds }
 *     -> { chat: boolean }  (true once a team member started a chat with this
 *        session from the inbox: the widget then opens it)
 */
const str = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : null);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const tenantId = await chatTenantFromRequest(req);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const sessionId = str(b.sessionId, 64);
  const pageId = typeof b.pageId === "string" && UUID.test(b.pageId) ? b.pageId : null;
  const path = str(b.path, 300);
  if (!tenantId || !sessionId || !pageId || !path) return NextResponse.json({ chat: false });
  if (rateLimited(`site-visit:${clientIp(req)}`, 60, 10 * 60_000)) return NextResponse.json({ chat: false });

  const admin = await createAdminClient();
  const now = new Date();
  const seconds = Math.min(Math.max(Math.round(Number(b.seconds) || 0), 0), 6 * 3600);
  const title = str(b.title, 200);
  let referrer: string | null = null;
  try { referrer = b.referrer ? new URL(String(b.referrer)).host.slice(0, 120) || null : null; } catch { /* bad url */ }
  const fs = typeof b.firstSeen === "number" && b.firstSeen > 1.5e12 && b.firstSeen <= now.getTime() ? new Date(b.firstSeen).toISOString() : now.toISOString();

  // Page row: insert on first beat, then only its seconds move.
  const { data: upd } = await admin.from("site_visitor_pages").update({ seconds }).eq("id", pageId).eq("tenant_id", tenantId).eq("session_id", sessionId).select("id");
  let newPage = false;
  if (!upd?.length) newPage = !(await admin.from("site_visitor_pages").insert({ id: pageId, tenant_id: tenantId, session_id: sessionId, path, title, seconds })).error;

  const { data: v } = await admin.from("site_visitors").select("pages_count, seconds, last_seen, conversation_id").eq("tenant_id", tenantId).eq("session_id", sessionId).maybeSingle();
  if (!v) {
    await admin.from("site_visitors").insert({
      tenant_id: tenantId, session_id: sessionId, first_seen: fs, visits_count: Math.min(Math.max(Math.round(Number(b.visits) || 1), 1), 100000),
      country: req.headers.get("x-vercel-ip-country"), referrer, current_path: path, current_title: title, pages_count: newPage ? 1 : 0,
    });
    return NextResponse.json({ chat: false });
  }
  // Time on site: wall time since the last beat, capped so a sleeping tab does not count.
  const gap = Math.min(Math.max((now.getTime() - new Date(v.last_seen as string).getTime()) / 1000, 0), 40);
  await admin.from("site_visitors").update({
    last_seen: now.toISOString(), current_path: path, current_title: title,
    pages_count: Number(v.pages_count) + (newPage ? 1 : 0), seconds: Number(v.seconds) + Math.round(gap),
  }).eq("tenant_id", tenantId).eq("session_id", sessionId);
  return NextResponse.json({ chat: !!v.conversation_id }, { headers: { "Cache-Control": "no-store" } });
}

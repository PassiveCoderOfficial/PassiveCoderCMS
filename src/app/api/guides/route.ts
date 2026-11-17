import { NextRequest, NextResponse } from "next/server";
import { apiUser, getApiCaller } from "@/lib/auth/api-caller";
import { createAdminClient } from "@/lib/supabase/server";

const EVENTS = new Set(["prompt_seen", "started", "finished", "closed"]);

/**
 * Show Me guides (web dashboard and app; cookie or Bearer).
 *   GET  -> { promptSeen }: has this person dismissed the first-login prompt?
 *   POST { guide, event, step? }
 */
export async function GET(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  const { count } = await admin.from("guide_events").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("event", "prompt_seen");
  return NextResponse.json({ promptSeen: (count ?? 0) > 0 }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const user = await apiUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { guide?: unknown; event?: unknown; step?: unknown };
  if (typeof b.guide !== "string" || !/^[a-z_-]{1,40}$/.test(b.guide) || typeof b.event !== "string" || !EVENTS.has(b.event)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const caller = await getApiCaller(req).catch(() => null);
  const admin = await createAdminClient();
  await admin.from("guide_events").insert({
    user_id: user.id, tenant_id: caller?.tenantId ?? null, guide: b.guide, event: b.event,
    step: typeof b.step === "number" ? b.step : null,
  });
  return NextResponse.json({ ok: true });
}

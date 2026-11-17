import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveInboxCaller } from "@/lib/site-chat/inbox-caller";
import { isSuperAdmin } from "@/lib/super-admin";
import { banSender, blockValue, restoreEntry, unblock, type BanSourceType } from "@/lib/spam/ban";
import type { BlockKind } from "@/lib/spam/rules";

/**
 * Spam folder and ban list for the caller's site (web dashboard and app; cookie
 * or Bearer). Viewers can read nothing here and change nothing.
 *
 *   GET ?view=spam | blocks
 *   POST { action: "ban", from: { type, id }, ban_ip?, ip_days?, scope?, reason? }
 *        { action: "block", kind, value, scope?, days?, reason? }
 *        { action: "unblock", id }
 *        { action: "restore", id } | { action: "delete", id } | { action: "clear" }
 *
 * Clients see their own site's rules and global rules they made themselves;
 * global rules carry other sites' customers, so only super admins and staff see all.
 */
async function isPlatform(admin: Awaited<ReturnType<typeof createAdminClient>>, userId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;
  const { data: staff } = await admin.from("pc_staff").select("status").eq("user_id", userId).maybeSingle();
  return staff?.status === "active";
}

const SOURCES: readonly BanSourceType[] = ["chat", "submission", "contact", "spam"];
const KINDS: readonly BlockKind[] = ["email", "phone", "ip"];

export async function GET(req: NextRequest) {
  const caller = await resolveInboxCaller(req);
  if (!caller?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (caller.role === "viewer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = await createAdminClient();
  const platform = await isPlatform(admin, caller.userId);
  const headers = { "Cache-Control": "private, no-store" };
  if (req.nextUrl.searchParams.get("view") === "blocks") {
    const cols = "id, tenant_id, kind, value, effect, reason, created_at, expires_at, hits, last_hit_at";
    const base = () => admin.from("contact_blocks").select(cols).order("created_at", { ascending: false }).limit(300);
    const [{ data: site }, { data: global }] = await Promise.all([
      base().eq("tenant_id", caller.tenantId),
      platform ? base().is("tenant_id", null) : base().is("tenant_id", null).eq("created_by", caller.userId),
    ]);
    return NextResponse.json({ platform, blocks: [...(site ?? []), ...(global ?? [])] }, { headers });
  }
  const { data, count } = await admin.from("spam_entries")
    .select("id, source, reason, sender_email, sender_phone, ip, data, meta, created_at", { count: "exact" })
    .eq("tenant_id", caller.tenantId).order("created_at", { ascending: false }).limit(200);
  return NextResponse.json({ platform, entries: data ?? [], total: count ?? 0 }, { headers });
}

export async function POST(req: NextRequest) {
  const caller = await resolveInboxCaller(req);
  if (!caller?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (caller.role === "viewer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = await createAdminClient();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const tenantId = caller.tenantId;
  const userId = caller.userId;
  const reason = typeof b.reason === "string" ? b.reason.trim().slice(0, 200) || null : null;
  const scope = b.scope === "all" ? "all" as const : "site" as const;
  const id = typeof b.id === "string" ? b.id : "";

  const done = (r: { ok: true; ipSkipped: boolean } | { ok: false; error: string }) =>
    r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: r.error === "Forbidden" ? 403 : r.error === "Not found" ? 404 : 400 });

  switch (b.action) {
    case "ban": {
      const from = b.from as { type?: BanSourceType; id?: string } | undefined;
      if (!from?.id || !from.type || !SOURCES.includes(from.type)) return NextResponse.json({ error: "from required" }, { status: 400 });
      return done(await banSender(admin, {
        tenantId, userId, platform: await isPlatform(admin, userId), from: { type: from.type, id: from.id },
        banIp: b.ban_ip === true, ipDays: typeof b.ip_days === "number" ? b.ip_days : undefined, scope, reason,
      }));
    }
    case "block": {
      if (!KINDS.includes(b.kind as BlockKind) || typeof b.value !== "string") return NextResponse.json({ error: "kind and value required" }, { status: 400 });
      return done(await blockValue(admin, {
        tenantId, userId, platform: await isPlatform(admin, userId), kind: b.kind as BlockKind, value: b.value,
        scope, days: typeof b.days === "number" ? b.days : undefined, reason,
      }));
    }
    case "unblock":
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      return done(await unblock(admin, { tenantId, userId, platform: await isPlatform(admin, userId), id }));
    case "restore":
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      return done(await restoreEntry(admin, { tenantId, userId, id }));
    case "delete":
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      await admin.from("spam_entries").delete().eq("tenant_id", tenantId).eq("id", id);
      return NextResponse.json({ ok: true });
    case "clear":
      await admin.from("spam_entries").delete().eq("tenant_id", tenantId);
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

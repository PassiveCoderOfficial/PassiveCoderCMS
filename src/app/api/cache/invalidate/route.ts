import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { invalidateSites } from "@/lib/supabase/public-cache";

/*
 * POST /api/cache/invalidate { tenantIds: string[] }
 *
 * Most dashboard editors save from the browser straight to Supabase, which
 * the server never sees, so the browser client calls this after a content
 * write to expire the public-site cache (lib/supabase/client.ts). Only sites
 * the signed-in user is a member of (or any site, for super admins); an
 * empty list (a write that did not say which site) expires the user's own
 * sites.
 */
const lastCall = new Map<string, number>();

export async function POST(req: NextRequest) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // A burst of saves (autosave, bulk edits) needs one expiry, not fifty.
  const now = Date.now();
  if (now - (lastCall.get(user.id) ?? 0) < 1000) return NextResponse.json({ ok: true, throttled: true });
  lastCall.set(user.id, now);

  const body = await req.json().catch(() => ({})) as { tenantIds?: unknown };
  const asked = Array.isArray(body.tenantIds) ? body.tenantIds.filter((x): x is string => typeof x === "string").slice(0, 20) : [];

  const admin = await createAdminClient();
  const [{ data: sa }, { data: memberships }] = await Promise.all([
    admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    admin.from("tenant_members").select("tenant_id").eq("user_id", user.id),
  ]);
  const mine = new Set((memberships ?? []).map((m) => m.tenant_id as string));
  const ids = asked.length ? asked.filter((id) => sa || mine.has(id)) : [...mine];
  if (ids.length) invalidateSites(ids);
  return NextResponse.json({ ok: true, expired: ids.length });
}

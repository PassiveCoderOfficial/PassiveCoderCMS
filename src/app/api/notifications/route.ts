import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller, apiSupabase } from "@/lib/auth/api-caller";
import { OWNER_EVENTS } from "@/lib/push/notify-owners";

/**
 * Dashboard notification settings for the signed-in person on this site:
 * which events they want, and whether this browser is subscribed.
 * (tenant from getApiCaller, not a header: the dashboard also runs on the
 * root domain, where the proxy sets no tenant header.)
 */
async function ctx() {
  const supabase = await apiSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const tenantId = (await getApiCaller())?.tenantId ?? null;
  if (!tenantId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  return { user, tenantId, admin: await createAdminClient() } as const;
}

export async function GET(req: Request) {
  const c = await ctx();
  if ("error" in c) return c.error;
  const endpoint = new URL(req.url).searchParams.get("endpoint");
  const [{ data: prefs }, { count }, { data: mine }] = await Promise.all([
    c.admin.from("notification_prefs").select("events").eq("tenant_id", c.tenantId).eq("user_id", c.user.id).maybeSingle(),
    c.admin.from("web_push_subscriptions").select("endpoint", { count: "exact", head: true }).eq("tenant_id", c.tenantId).eq("user_id", c.user.id),
    endpoint ? c.admin.from("web_push_subscriptions").select("endpoint").eq("endpoint", endpoint).eq("user_id", c.user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const events = (prefs?.events ?? {}) as Record<string, boolean>;
  return NextResponse.json({
    events: Object.fromEntries(OWNER_EVENTS.map((e) => [e.key, events[e.key] !== false])),
    devices: count ?? 0,
    thisDevice: !!mine,
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  });
}

/** {subscription} saves this device; {events} saves the switches. */
export async function POST(req: Request) {
  const c = await ctx();
  if ("error" in c) return c.error;
  const b = await req.json().catch(() => ({})) as { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }; events?: Record<string, boolean> };
  if (b.subscription) {
    const s = b.subscription;
    if (!s.endpoint || !s.keys?.p256dh || !s.keys?.auth) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    const { error } = await c.admin.from("web_push_subscriptions").upsert(
      { tenant_id: c.tenantId, user_id: c.user.id, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth },
      { onConflict: "endpoint" },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (b.events) {
    const clean = Object.fromEntries(OWNER_EVENTS.map((e) => [e.key, b.events![e.key] !== false]));
    await c.admin.from("notification_prefs").upsert({ tenant_id: c.tenantId, user_id: c.user.id, events: clean, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,user_id" });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const c = await ctx();
  if ("error" in c) return c.error;
  const endpoint = new URL(req.url).searchParams.get("endpoint");
  if (endpoint) await c.admin.from("web_push_subscriptions").delete().eq("user_id", c.user.id).eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}

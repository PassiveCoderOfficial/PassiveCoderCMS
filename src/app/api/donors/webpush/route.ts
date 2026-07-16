import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getDonorSession } from "@/lib/donors/auth";

/** Save this browser's push subscription against the logged-in donor. */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const me = await getDonorSession(tenantId);
  if (!me) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const { endpoint, keys } = await req.json().catch(() => ({}));
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  await supabase.from("donor_web_push").upsert({
    tenant_id: tenantId,
    donor_id: me.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });

  return NextResponse.json({ ok: true });
}

/** Drop a subscription (logout, or the donor turns notifications off). */
export async function DELETE(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const endpoint = new URL(req.url).searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 });

  const supabase = await createAdminClient();
  await supabase.from("donor_web_push").delete()
    .eq("tenant_id", tenantId).eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}

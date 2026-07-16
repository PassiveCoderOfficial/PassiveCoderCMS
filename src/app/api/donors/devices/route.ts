import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getDonorSession } from "@/lib/donors/auth";

/**
 * Register (or refresh) this install's Expo push token. Called on app launch
 * and after login, so a device that changes hands re-points at the new donor.
 */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const { expo_token, platform } = await req.json().catch(() => ({}));
  if (!expo_token || typeof expo_token !== "string") {
    return NextResponse.json({ error: "expo_token required" }, { status: 400 });
  }

  const me = await getDonorSession(tenantId);
  const supabase = await createAdminClient();

  await supabase.from("donor_devices").upsert({
    tenant_id: tenantId,
    donor_id: me?.id ?? null,
    expo_token,
    platform: ["android", "ios", "web"].includes(platform) ? platform : null,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: "expo_token" });

  return NextResponse.json({ ok: true });
}

/** Unregister on logout so the device stops getting that donor's pushes. */
export async function DELETE(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const token = new URL(req.url).searchParams.get("expo_token");
  if (!token) return NextResponse.json({ error: "expo_token required" }, { status: 400 });

  const supabase = await createAdminClient();
  await supabase.from("donor_devices").delete()
    .eq("tenant_id", tenantId).eq("expo_token", token);
  return NextResponse.json({ ok: true });
}

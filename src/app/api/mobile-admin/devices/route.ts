import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyBearerUser } from "@/lib/auth/verify-bearer";

/**
 * Register (or refresh) this device's Expo push token against the logged-in
 * admin/staff/tenant user. Mobile-only (Bearer JWT) — the web admin panel has
 * no equivalent, it's not an installed app with a push token.
 */
export async function POST(req: NextRequest) {
  const caller = await verifyBearerUser(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { expo_token, platform } = await req.json().catch(() => ({}));
  if (!expo_token || typeof expo_token !== "string") {
    return NextResponse.json({ error: "expo_token required" }, { status: 400 });
  }

  const admin = await createAdminClient();
  await admin.from("admin_app_devices").upsert({
    user_id: caller.userId,
    expo_token,
    platform: ["android", "ios"].includes(platform) ? platform : null,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: "expo_token" });

  return NextResponse.json({ ok: true });
}

/** Unregister on logout so a shared/reset device stops getting this user's pushes. */
export async function DELETE(req: NextRequest) {
  const caller = await verifyBearerUser(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = new URL(req.url).searchParams.get("expo_token");
  if (!token) return NextResponse.json({ error: "expo_token required" }, { status: 400 });

  const admin = await createAdminClient();
  await admin.from("admin_app_devices").delete()
    .eq("user_id", caller.userId).eq("expo_token", token);
  return NextResponse.json({ ok: true });
}

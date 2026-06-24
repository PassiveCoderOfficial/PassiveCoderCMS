import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { enmProvision, type ENMTier } from "@/lib/enm";

// Internal-only route — called server-side when PC subscription changes.
// Also accepts PARTNER_SECRET header so super-admin tooling can call it.
export async function POST(req: NextRequest) {
  // Allow internal server calls (no secret) OR external calls with secret
  const secret = req.headers.get("x-partner-secret");
  const isInternal = req.headers.get("x-internal-call") === "1";
  if (!isInternal && secret !== process.env.PARTNER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tenantId: string; tier: ENMTier };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenantId, tier } = body;
  if (!tenantId || !["free", "pro"].includes(tier)) {
    return NextResponse.json({ error: "Missing tenantId or invalid tier" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Get tenant + owner email
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, enm_user_id, owner_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Get owner email from auth.users via profiles
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", tenant.owner_id)
    .maybeSingle();

  if (!profile?.email) return NextResponse.json({ error: "Owner email not found" }, { status: 404 });

  try {
    const enmUserId = await enmProvision({
      email: profile.email,
      name: profile.full_name ?? undefined,
      pcTenantId: tenantId,
      tier,
    });

    await admin
      .from("tenants")
      .update({ enm_user_id: enmUserId, enm_tier: tier })
      .eq("id", tenantId);

    return NextResponse.json({ ok: true, enmUserId, tier });
  } catch (err) {
    console.error("[ENM sync] error", err);
    return NextResponse.json({ error: "ENM sync failed" }, { status: 502 });
  }
}

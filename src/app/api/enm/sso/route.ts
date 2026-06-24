import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { enmProvision, enmSSOToken, enmSSOUrl, type ENMTier } from "@/lib/enm";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();

  // Get tenant + subscription for this user
  const { data: membership } = await admin
    .from("tenant_members")
    .select("tenant_id, tenants(id, name, enm_user_id, enm_tier, slug)")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "No tenant found" }, { status: 404 });
  }

  const tenant = (Array.isArray(membership.tenants) ? membership.tenants[0] : membership.tenants) as {
    id: string; name: string; enm_user_id: number | null; enm_tier: string; slug: string;
  } | null;

  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Determine tier from active subscription
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan_id, status")
    .eq("tenant_id", tenant.id)
    .in("status", ["active", "trial"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const tier: ENMTier = sub?.plan_id === "pro" ? "pro" : "free";

  // Provision or sync ENM account
  let enmUserId = tenant.enm_user_id;
  try {
    enmUserId = await enmProvision({
      email: user.email!,
      name: user.user_metadata?.full_name ?? undefined,
      pcTenantId: tenant.id,
      tier,
    });

    // Persist enm_user_id + enm_tier back to tenant row
    await admin
      .from("tenants")
      .update({ enm_user_id: enmUserId, enm_tier: tier })
      .eq("id", tenant.id);
  } catch (err) {
    console.error("[ENM SSO] provision error", err);
    if (!enmUserId) {
      return NextResponse.json({ error: "Failed to provision ENM account" }, { status: 502 });
    }
    // If provision failed but we already have an ID, proceed with SSO anyway
  }

  // Get short-lived SSO token
  let ssoToken: string;
  try {
    ssoToken = await enmSSOToken(enmUserId!);
  } catch (err) {
    console.error("[ENM SSO] token error", err);
    return NextResponse.json({ error: "Failed to issue SSO token" }, { status: 502 });
  }

  return NextResponse.redirect(enmSSOUrl(ssoToken, "/dashboard"));
}

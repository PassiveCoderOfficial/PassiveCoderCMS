import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "Missing tenant_id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = await createAdminClient();
  const { data: sa } = await adminClient.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!sa) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Resolve the email of an admin/owner user for this tenant.
  async function resolveTargetEmail(): Promise<string | null> {
    // Owner via tenant_members
    const { data: owner } = await adminClient
      .from("tenant_members")
      .select("profiles(email)")
      .eq("tenant_id", tenantId)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
    const ownerEmail = (Array.isArray(owner?.profiles) ? owner?.profiles[0] : owner?.profiles) as { email: string } | null;
    if (ownerEmail?.email) return ownerEmail.email;

    // Any admin/editor via tenant_members
    const { data: anyAdmin } = await adminClient
      .from("tenant_members")
      .select("profiles(email)")
      .eq("tenant_id", tenantId)
      .in("role", ["admin", "editor"])
      .limit(1)
      .maybeSingle();
    const adminEmail = (Array.isArray(anyAdmin?.profiles) ? anyAdmin?.profiles[0] : anyAdmin?.profiles) as { email: string } | null;
    if (adminEmail?.email) return adminEmail.email;

    // Fallback: tenants.owner_id → auth email
    const { data: tenant } = await adminClient.from("tenants").select("owner_id").eq("id", tenantId).maybeSingle();
    if (tenant?.owner_id) {
      const { data: authUser } = await adminClient.auth.admin.getUserById(tenant.owner_id);
      if (authUser?.user?.email) return authUser.user.email;
    }
    return null;
  }

  const email = await resolveTargetEmail();
  if (!email) return NextResponse.json({ error: "No admin user found for this tenant" }, { status: 404 });

  // Resolve target tenant slug so we redirect to the correct subdomain
  const { data: tenantRow } = await adminClient.from("tenants").select("slug, custom_domain").eq("id", tenantId).maybeSingle();
  const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
  const proto = ROOT.includes("localhost") ? "http" : "https";
  const targetOrigin = tenantRow?.custom_domain
    ? `${proto}://${tenantRow.custom_domain}`
    : tenantRow?.slug
      ? `${proto}://${tenantRow.slug}.${ROOT}`
      : new URL(req.url).origin;

  // Generate a magic-link token. We cannot use verifyOtp here because the
  // session cookie must be written on the TARGET subdomain, not this one.
  // Instead redirect the browser to a handoff endpoint on the target subdomain
  // that calls verifyOtp there, so cookies land on the right domain.
  const { data: link, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${targetOrigin}/dashboard` },
  });
  if (linkErr || !link?.properties?.hashed_token) {
    return NextResponse.json({ error: linkErr?.message ?? "Failed to generate session" }, { status: 500 });
  }

  // Send browser to target subdomain's /api/auth/impersonate-verify which calls
  // verifyOtp there so the session cookie is scoped to that subdomain.
  const verifyUrl = new URL(`${targetOrigin}/api/auth/impersonate-verify`);
  verifyUrl.searchParams.set("token_hash", link.properties.hashed_token);
  verifyUrl.searchParams.set("next", "/dashboard");
  return NextResponse.redirect(verifyUrl.toString());
}

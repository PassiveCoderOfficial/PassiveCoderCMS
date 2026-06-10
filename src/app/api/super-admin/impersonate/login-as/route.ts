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

  // Generate a magic-link token and exchange it server-side so the SSR
  // cookie session is replaced with the target user's session (PKCE/SSR flow).
  // Redirecting straight to the GoTrue action_link uses the implicit flow
  // (tokens in URL hash) which @supabase/ssr cannot read → session never switches.
  const { data: link, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkErr || !link?.properties?.hashed_token) {
    return NextResponse.json({ error: linkErr?.message ?? "Failed to generate session" }, { status: 500 });
  }

  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (verifyErr) {
    return NextResponse.json({ error: verifyErr.message }, { status: 500 });
  }

  // verifyOtp wrote the new session cookies via the SSR cookie adapter.
  return NextResponse.redirect(new URL("/dashboard", req.url));
}

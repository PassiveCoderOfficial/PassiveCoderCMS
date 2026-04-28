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

  const origin = new URL(req.url).origin;

  async function generateMagicLink(email: string) {
    const { data: link, error } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${origin}/dashboard` },
    });
    if (error) return { error: error.message };
    return { url: link.properties.action_link };
  }

  // Try owner role first
  const { data: owner } = await adminClient
    .from("tenant_members")
    .select("user_id, profiles(email)")
    .eq("tenant_id", tenantId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  if (owner) {
    const profileRow = (Array.isArray(owner.profiles) ? owner.profiles[0] : owner.profiles) as { email: string } | null;
    if (profileRow?.email) {
      const result = await generateMagicLink(profileRow.email);
      if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.redirect(result.url!);
    }
  }

  // Try any admin
  const { data: anyAdmin } = await adminClient
    .from("tenant_members")
    .select("user_id, profiles(email)")
    .eq("tenant_id", tenantId)
    .in("role", ["admin", "editor"])
    .limit(1)
    .maybeSingle();

  if (anyAdmin) {
    const profileRow = (Array.isArray(anyAdmin.profiles) ? anyAdmin.profiles[0] : anyAdmin.profiles) as { email: string } | null;
    if (profileRow?.email) {
      const result = await generateMagicLink(profileRow.email);
      if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.redirect(result.url!);
    }
  }

  // Fallback: tenant.owner_id → look up email directly from auth
  const { data: tenant } = await adminClient.from("tenants").select("owner_id").eq("id", tenantId).maybeSingle();
  if (tenant?.owner_id) {
    const { data: authUser } = await adminClient.auth.admin.getUserById(tenant.owner_id);
    const email = authUser?.user?.email;
    if (email) {
      const result = await generateMagicLink(email);
      if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.redirect(result.url!);
    }
  }

  return NextResponse.json({ error: "No admin user found for this tenant" }, { status: 404 });
}

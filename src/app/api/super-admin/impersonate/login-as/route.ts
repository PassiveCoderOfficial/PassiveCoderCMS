import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Generate a magic link to log in as a specific tenant's admin user
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

  // Find the owner/admin of this tenant
  const { data: member } = await adminClient
    .from("tenant_members")
    .select("user_id, profiles(email)")
    .eq("tenant_id", tenantId)
    .eq("role", "owner")
    .limit(1)
    .single();

  if (!member) {
    // Fall back to any admin
    const { data: anyAdmin } = await adminClient
      .from("tenant_members")
      .select("user_id, profiles(email)")
      .eq("tenant_id", tenantId)
      .eq("role", "admin")
      .limit(1)
      .single();
    if (!anyAdmin) return NextResponse.json({ error: "No admin user found for this tenant" }, { status: 404 });
    const profileRow = (Array.isArray(anyAdmin.profiles) ? anyAdmin.profiles[0] : anyAdmin.profiles) as { email: string } | null;
    if (!profileRow?.email) return NextResponse.json({ error: "No email on admin user" }, { status: 404 });
    const { data: link, error } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: profileRow.email,
      options: { redirectTo: `${new URL(req.url).origin}/dashboard` },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.redirect(link.properties.action_link);
  }

  const profileRow = (Array.isArray(member.profiles) ? member.profiles[0] : member.profiles) as { email: string } | null;
  if (!profileRow?.email) return NextResponse.json({ error: "No email on owner" }, { status: 404 });

  const { data: link, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: profileRow.email,
    options: { redirectTo: `${new URL(req.url).origin}/dashboard` },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.redirect(link.properties.action_link);
}

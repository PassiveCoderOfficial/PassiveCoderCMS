import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = await createAdminClient();
  const { data: sa } = await adminClient.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!sa) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const tenantId = searchParams.get("tenant_id");

  let tenant = null;
  if (slug) {
    const { data } = await adminClient.from("tenants").select("*").eq("slug", slug).maybeSingle();
    tenant = data;
  } else if (tenantId) {
    const { data } = await adminClient.from("tenants").select("*").eq("id", tenantId).maybeSingle();
    tenant = data;
  }

  let members = null;
  const id = tenant?.id ?? tenantId;
  if (id) {
    const { data } = await adminClient
      .from("tenant_members")
      .select("user_id, role, profiles(email, full_name)")
      .eq("tenant_id", id);
    members = data;
  }

  return NextResponse.json({
    ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    CMS_MODE: process.env.NEXT_PUBLIC_CMS_MODE,
    tenant,
    members,
  });
}

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentTenantId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!data?.tenant_id) {
    // Check if super admin — redirect to super-admin panel instead of error
    const adminClient = await createAdminClient();
    const { data: sa } = await adminClient
      .from("super_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .single();
    if (sa) redirect("/super-admin");
    redirect("/login?error=no_tenant");
  }

  return data.tenant_id;
}

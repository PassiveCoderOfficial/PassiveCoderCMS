import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentTenantId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = await createAdminClient();

  // Check super_admins table first — SA manages their own root tenant via owner_id
  const { data: sa } = await adminClient
    .from("super_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sa) {
    // Find the tenant owned by this SA user
    const { data: ownedTenant } = await adminClient
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (ownedTenant?.id) return ownedTenant.id;

    // SA has no owned tenant yet — redirect to create one
    redirect("/onboarding");
  }

  // Regular user — resolve via tenant_members
  const { data } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!data?.tenant_id) redirect("/login?error=no_tenant");

  return data.tenant_id;
}

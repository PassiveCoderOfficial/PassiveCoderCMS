import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const SA_VIEWING_COOKIE = "sa_viewing_tenant";

export async function getCurrentTenantId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = await createAdminClient();

  // Check if SA is impersonating a tenant
  const { data: sa } = await adminClient
    .from("super_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sa) {
    // SA impersonating a specific tenant via cookie
    const cookieStore = await cookies();
    const viewing = cookieStore.get(SA_VIEWING_COOKIE)?.value;
    if (viewing) return viewing;

    // SA managing their own root tenant
    const { data: ownedTenant } = await adminClient
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (ownedTenant?.id) return ownedTenant.id;
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

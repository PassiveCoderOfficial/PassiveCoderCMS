import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

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
    // SA on a tenant subdomain — use the injected tenant id directly
    const reqHeaders = await headers();
    const subdomainTenantId = reqHeaders.get("x-tenant-id");
    if (subdomainTenantId) return subdomainTenantId;

    // SA impersonating a specific tenant via cookie
    const cookieStore = await cookies();
    const viewing = cookieStore.get(SA_VIEWING_COOKIE)?.value;
    if (viewing) return viewing;

    // SA on root domain — use their own first tenant
    const { data: ownedTenant } = await adminClient
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (ownedTenant?.id) return ownedTenant.id;
    redirect("/super-admin");
  }

  // Regular user — subdomain context takes priority
  const reqHeaders = await headers();
  const subdomainTenantId = reqHeaders.get("x-tenant-id");
  if (subdomainTenantId) {
    // Accept if user is a member of this tenant
    const { data: membership } = await adminClient
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("tenant_id", subdomainTenantId)
      .maybeSingle();
    if (membership) return subdomainTenantId;

    // Also accept if user is the owner (owner_id may exist without tenant_members row)
    const { data: owned } = await adminClient
      .from("tenants")
      .select("id")
      .eq("id", subdomainTenantId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (owned) return subdomainTenantId;
  }

  // Regular user — resolve via tenant_members primary flag
  const { data } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  if (data?.tenant_id) return data.tenant_id;

  // Fallback: any membership
  const { data: any } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!any?.tenant_id) redirect("/login?error=no_tenant");

  return any.tenant_id;
}

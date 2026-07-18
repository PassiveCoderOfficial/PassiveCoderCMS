import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

export const SA_VIEWING_COOKIE = "sa_viewing_tenant";
export const AGENT_VIEWING_COOKIE = "agent_viewing_tenant";

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

  // Agent viewing a tenant's dashboard under their own session (no credential
  // swap) — only valid if the cookie's tenant matches one this agent is
  // actually assigned/referred to, re-checked here (not just at cookie-set
  // time) so a stale cookie can't outlive the assignment.
  const { data: agentRow } = await adminClient.from("agents").select("id").eq("user_id", user.id).maybeSingle();
  if (agentRow) {
    const cookieStore = await cookies();
    const viewingTenantId = cookieStore.get(AGENT_VIEWING_COOKIE)?.value;
    if (viewingTenantId) {
      const { data: tenant } = await adminClient
        .from("tenants")
        .select("id")
        .eq("id", viewingTenantId)
        .or(`assigned_agent_id.eq.${agentRow.id},referred_by_agent_id.eq.${agentRow.id}`)
        .maybeSingle();
      if (tenant) return viewingTenantId;
    }
    redirect("/agent");
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

    // No access to this subdomain's tenant — do NOT silently fall through to
    // the user's own tenant (that serves their data under someone else's
    // domain, which is confusing even if not a data leak). Send them home.
    const { data: ownTenant } = await adminClient
      .from("tenant_members")
      .select("tenant_id, is_primary, tenants(slug)")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false })
      .limit(1)
      .maybeSingle();
    const ownSlug = ownTenant
      ? (Array.isArray(ownTenant.tenants) ? ownTenant.tenants[0] : ownTenant.tenants)?.slug
      : undefined;
    if (ownSlug) {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
      const proto = rootDomain.includes("localhost") ? "http" : "https";
      redirect(`${proto}://${ownSlug}.${rootDomain}/dashboard`);
    }
    redirect("/login?error=unauthorized");
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

  if (!any?.tenant_id) {
    // Agent users have no tenant membership — send them to the agent portal
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role === "agent") redirect("/agent");
    redirect("/login?error=no_tenant");
  }

  return any.tenant_id;
}

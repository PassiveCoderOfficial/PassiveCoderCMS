import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";
import { SA_VIEWING_COOKIE } from "./current";

/**
 * Resolve tenant ID for API routes (null instead of redirect on failure).
 * Mirrors getCurrentTenantId: subdomain header first, then SA impersonation
 * cookie / owned tenant, then membership (primary, then any).
 */
export async function apiTenantId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminClient = await createAdminClient();

  const { data: sa } = await adminClient
    .from("super_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const reqHeaders = await headers();
  const subdomainTenantId = reqHeaders.get("x-tenant-id");

  if (sa) {
    // SA on a tenant subdomain — trust the injected tenant id
    if (subdomainTenantId) return subdomainTenantId;

    // SA impersonating via cookie
    const cookieStore = await cookies();
    const viewing = cookieStore.get(SA_VIEWING_COOKIE)?.value;
    if (viewing) return viewing;

    // SA on root domain — own first tenant
    const { data: owned } = await adminClient
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return owned?.id ?? null;
  }

  // Regular user — subdomain context wins if they're a member or the owner
  if (subdomainTenantId) {
    const { data: membership } = await adminClient
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("tenant_id", subdomainTenantId)
      .maybeSingle();
    if (membership) return subdomainTenantId;

    const { data: owned } = await adminClient
      .from("tenants")
      .select("id")
      .eq("id", subdomainTenantId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (owned) return subdomainTenantId;
  }

  // Primary membership, then any membership
  const { data: primary } = await adminClient
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();
  if (primary?.tenant_id) return primary.tenant_id;

  const { data: any } = await adminClient
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  return any?.tenant_id ?? null;
}

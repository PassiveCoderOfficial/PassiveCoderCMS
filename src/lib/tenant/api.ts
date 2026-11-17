import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { staffSites } from "@/lib/staff";
import { SA_VIEWING_COOKIE, STAFF_VIEWING_COOKIE } from "./current";

export type ResolvedTenant = {
  tenantId: string | null;
  /** The caller's role on that tenant when the lookup already knows it
   *  (undefined = not looked up, e.g. a super admin's impersonated site). */
  role?: string | null;
};

/**
 * Cookie-session tenant resolution, shared by apiTenantId() and
 * getApiCaller(): subdomain header first, then SA impersonation cookie /
 * owned tenant, then membership (primary, then any).
 */
export async function resolveSessionTenant(
  admin: SupabaseClient,
  userId: string,
  isSA: boolean,
  hostTenantId: string | null,
  viewingTenantId: string | null,
  staffViewingTenantId: string | null = null,
): Promise<ResolvedTenant> {
  if (isSA) {
    // SA on a tenant subdomain — trust the injected tenant id
    if (hostTenantId) return { tenantId: hostTenantId };
    // SA impersonating via cookie
    if (viewingTenantId) return { tenantId: viewingTenantId };
    // SA on root domain — own first tenant
    const { data: owned } = await admin
      .from("tenants")
      .select("id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return owned?.id ? { tenantId: owned.id, role: "owner" } : { tenantId: null };
  }

  // Regular user — subdomain context wins if they're a member or the owner
  if (hostTenantId) {
    const { data: membership } = await admin
      .from("tenant_members")
      .select("tenant_id, role")
      .eq("user_id", userId)
      .eq("tenant_id", hostTenantId)
      .maybeSingle();
    if (membership) return { tenantId: hostTenantId, role: (membership.role as string) ?? null };

    const { data: owned } = await admin
      .from("tenants")
      .select("id")
      .eq("id", hostTenantId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (owned) return { tenantId: hostTenantId, role: "owner" };
  }

  // Staff working on a client's site, same rule as getCurrentTenantId(). The
  // host wins over the cookie, which only applies on the root domain.
  const staffTarget = hostTenantId ?? staffViewingTenantId;
  if (staffTarget) {
    const { data: staff } = await admin.from("pc_staff").select("id, status").eq("user_id", userId).maybeSingle();
    if (staff) {
      const { data: allowed } = await staffSites(admin.from("tenants").select("id").eq("id", staffTarget), staff, userId).maybeSingle();
      if (allowed) return { tenantId: staffTarget };
    }
  }

  // The request names a site this user has no access to. Falling back to their
  // own site here would apply the action to the wrong site.
  if (hostTenantId) return { tenantId: null };

  return membershipFallbackTenant(admin, userId);
}

/** Primary membership, then any membership. */
export async function membershipFallbackTenant(admin: SupabaseClient, userId: string): Promise<ResolvedTenant> {
  const { data: primary } = await admin
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();
  if (primary?.tenant_id) return { tenantId: primary.tenant_id, role: (primary.role as string) ?? null };

  const { data: any } = await admin
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return any?.tenant_id ? { tenantId: any.tenant_id, role: (any.role as string) ?? null } : { tenantId: null };
}

/**
 * Resolve tenant ID for API routes (null instead of redirect on failure).
 * Cookie session only. New code should use getApiCaller() from
 * "@/lib/auth/api-caller", which also accepts the mobile app's Bearer token.
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
  const cookieStore = await cookies();
  const { tenantId } = await resolveSessionTenant(
    adminClient,
    user.id,
    !!sa,
    reqHeaders.get("x-tenant-id"),
    cookieStore.get(SA_VIEWING_COOKIE)?.value ?? null,
    cookieStore.get(STAFF_VIEWING_COOKIE)?.value ?? null,
  );
  return tenantId;
}

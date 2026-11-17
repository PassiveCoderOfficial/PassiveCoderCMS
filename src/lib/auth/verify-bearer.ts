import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin, isManager } from "@/lib/super-admin";

/**
 * Native/mobile clients can't use httpOnly session cookies (@supabase/ssr).
 * They send `Authorization: Bearer <supabase_access_token>` instead — the
 * raw access token from supabase-js's signInWithPassword(), not an API key.
 * Verify it server-side against the service role client (no cookies needed).
 */
export async function verifyBearerUser(req: Request): Promise<{ userId: string } | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  const admin = await createAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;

  return { userId: data.user.id };
}

/** Bearer equivalent of requireSuperAdmin() — re-checks super_admins server-side,
 *  never trusts a client-claimed role. */
export async function verifyBearerSuperAdminUser(req: Request): Promise<{ userId: string } | null> {
  const caller = await verifyBearerUser(req);
  if (!caller) return null;
  const ok = await isSuperAdmin(caller.userId);
  return ok ? caller : null;
}

/** Bearer equivalent of requireManagerOrSuperAdmin() — true super admins pass,
 *  and so do pc_staff managers (is_manager=true), matching the web SA panel's
 *  entry gate exactly. Regular (non-manager) staff do NOT pass this. */
export async function verifyBearerManagerOrSuperAdminUser(req: Request): Promise<{ userId: string; isSA: boolean } | null> {
  const caller = await verifyBearerUser(req);
  if (!caller) return null;
  if (await isSuperAdmin(caller.userId)) return { userId: caller.userId, isSA: true };
  if (await isManager(caller.userId)) return { userId: caller.userId, isSA: false };
  return null;
}

/**
 * Bearer equivalent of tenant membership/ownership checks used by apiTenantId().
 * Pass requireEditor to exclude 'viewer' role members (mirrors is_tenant_editor()).
 */
export async function verifyBearerTenantMember(
  req: Request,
  tenantId: string,
  opts: { requireEditor?: boolean } = {},
): Promise<{ userId: string } | null> {
  const caller = await verifyBearerUser(req);
  if (!caller) return null;

  const admin = await createAdminClient();

  if (await isSuperAdmin(caller.userId)) return caller;

  const { data: owned } = await admin
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .eq("owner_id", caller.userId)
    .maybeSingle();
  if (owned) return caller;

  const { data: membership } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", caller.userId)
    .maybeSingle();
  if (!membership) return null;
  if (opts.requireEditor && membership.role === "viewer") return null;

  return caller;
}

/**
 * Web (cookie session) OR mobile (Bearer token) check that the caller may
 * manage `tenantId` — member/owner of that tenant, or super admin. Used by
 * domain connect/disconnect/purchase routes, which serve both clients.
 */
export async function callerCanManageTenant(req: Request, tenantId: string): Promise<boolean> {
  // Web: cookie session first.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    if (await isSuperAdmin(user.id)) return true;

    const admin = await createAdminClient();
    const { data: owned } = await admin
      .from("tenants")
      .select("id")
      .eq("id", tenantId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (owned) return true;

    const { data: membership } = await admin
      .from("tenant_members")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (membership) return true;

    return false;
  }

  // Mobile: no cookie session, fall back to Bearer token.
  const caller = await verifyBearerTenantMember(req, tenantId);
  return !!caller;
}

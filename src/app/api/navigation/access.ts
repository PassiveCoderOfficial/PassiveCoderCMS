/**
 * Who may change this site's menus: a signed-in member with edit access to
 * the current site (web cookie), or the mobile app (Bearer + X-Tenant-Id).
 * Shared by the Navigation API routes.
 */
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { checkTenantEditAccess } from "@/modules/tenant/can-edit";
import { getApiCaller } from "@/lib/auth/api-caller";

export async function requireTenantAccess() {
  // Mobile app: Bearer token + X-Tenant-Id (membership verified by
  // getApiCaller), then the same edit-access check. Web keeps its cookie path.
  const caller = await getApiCaller();
  if (caller?.via === "bearer") {
    const admin = await createAdminClient();
    const access = await checkTenantEditAccess(admin, caller.tenantId, caller.userId);
    return access.allowed ? { tenantId: caller.tenantId, admin, userId: caller.userId } : null;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;

  const admin = await createAdminClient();
  const access = await checkTenantEditAccess(admin, tenantId, user.id);
  if (!access.allowed) return null;

  return { tenantId, admin, userId: user.id };
}

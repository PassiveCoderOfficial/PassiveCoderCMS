import type { SupabaseClient } from "@supabase/supabase-js";
import { isSuperAdmin } from "@/lib/super-admin";

/**
 * May this user hand `tenantId` over to someone else?
 *
 *   - super admins: any site
 *   - tenant owner/admin: their own site
 *   - staff: only sites assigned to or referred by them, i.e. ones they built
 *
 * Shared by the transfer endpoint and the email-existence check so the latter
 * can't become a user-enumeration oracle open to anyone with a login.
 */
export async function canTransferTenant(
  admin: SupabaseClient,
  userId: string,
  tenantId: string,
): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;

  const { data: membership } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (membership && ["owner", "admin"].includes(membership.role as string)) return true;

  // Owner recorded only on the tenant row — several creation flows write
  // owner_id without a members row, and that person owns the site.
  const { data: ownedTenant } = await admin
    .from("tenants").select("id").eq("id", tenantId).eq("owner_id", userId).maybeSingle();
  if (ownedTenant) return true;

  const { data: staffRow } = await admin
    .from("pc_staff").select("id").eq("user_id", userId).maybeSingle();
  if (!staffRow) return false;

  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .or(`assigned_staff_id.eq.${staffRow.id},referred_by_staff_id.eq.${staffRow.id}`)
    .maybeSingle();

  return !!tenant;
}

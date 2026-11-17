import type { SupabaseClient } from "@supabase/supabase-js";
import { isManager, isSuperAdmin } from "@/lib/super-admin";
import { ROOT_TENANT_SLUG } from "@/lib/flags";

/** Why this user may transfer a site. A manager is always "manager", even on a site they are also a member of, so their limits and audit row always apply. */
export type TransferAuthority = "super_admin" | "manager" | "member" | "staff";

/**
 * Why may this user hand `tenantId` over to someone else, if at all?
 *
 *   - super admins: any site
 *   - Staff Managers: any site but the root site (see transfer-rules.ts)
 *   - a site's owner: that site
 *   - active staff: only sites assigned to or referred by them, i.e. ones they built
 *
 * A site admin may not. Active staff can add an admin to any site, and resellers are
 * admins on their clients' sites, so counting admins here let them take the site
 * from its owner.
 */
export async function transferAuthority(
  admin: SupabaseClient,
  userId: string,
  tenantId: string,
): Promise<TransferAuthority | null> {
  if (await isSuperAdmin(userId)) return "super_admin";
  if (await isManager(userId)) return "manager";

  const { data: membership } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (membership?.role === "owner") return "member";

  // Owner recorded only on the tenant row — several creation flows write
  // owner_id without a members row, and that person owns the site.
  const { data: ownedTenant } = await admin
    .from("tenants").select("id").eq("id", tenantId).eq("owner_id", userId).maybeSingle();
  if (ownedTenant) return "member";

  const { data: staffRow } = await admin
    .from("pc_staff").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (!staffRow) return null;

  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .or(`assigned_staff_id.eq.${staffRow.id},referred_by_staff_id.eq.${staffRow.id}`)
    .maybeSingle();

  return tenant ? "staff" : null;
}

/**
 * May this user hand `tenantId` over to someone else? Used by the email-existence
 * check, so it can't become a user-enumeration oracle open to anyone with a login.
 */
export async function canTransferTenant(
  admin: SupabaseClient,
  userId: string,
  tenantId: string,
): Promise<boolean> {
  const authority = await transferAuthority(admin, userId, tenantId);
  if (!authority) return false;
  if (authority === "super_admin") return true;
  const { data: t } = await admin.from("tenants").select("slug").eq("id", tenantId).maybeSingle();
  return t?.slug !== ROOT_TENANT_SLUG;
}

/** Overwriting an existing account's password in a transfer: super admins and staff, within transfer-rules.ts. */
export const canResetPasswordInTransfer = (authority: TransferAuthority | null): boolean =>
  authority === "super_admin" || authority === "manager" || authority === "staff";

/**
 * Can this user edit `tenantId`'s content?
 *
 * Four kinds of access, in the order they're cheapest to check:
 *   - super admin — platform-wide
 *   - tenant_members row with an editing role
 *   - tenants.owner_id — site creation doesn't always write a members row
 *   - staff assignment — a site built for a client by staff has no owner and
 *     no members at all until the client is handed their account, so
 *     assigned_staff_id / referred_by_staff_id is its only link to a person
 *
 * The last two are why this exists: several routes checked membership alone
 * and 403'd on staff-built and owner-only sites, which is every site during
 * the period staff are actually building it.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const EDIT_ROLES = ["owner", "admin", "editor"];

export type TenantAccess =
  | { allowed: true; reason: "super_admin" | "member" | "owner" | "staff" }
  | { allowed: false; reason: "no_access" | "role"; role?: string };

export async function checkTenantEditAccess(
  admin: SupabaseClient,
  tenantId: string,
  userId: string,
  roles: string[] = EDIT_ROLES,
): Promise<TenantAccess> {
  const { data: sa } = await admin
    .from("super_admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (sa) return { allowed: true, reason: "super_admin" };

  // Read through the admin client: tenant_members' RLS only exposes the
  // caller's own rows, so an RLS miss would otherwise be indistinguishable
  // from genuinely not being a member.
  const { data: membership } = await admin
    .from("tenant_members").select("role").eq("tenant_id", tenantId).eq("user_id", userId).maybeSingle();
  if (membership) {
    const role = membership.role as string;
    return roles.includes(role)
      ? { allowed: true, reason: "member" }
      : { allowed: false, reason: "role", role };
  }

  const { data: staffRow } = await admin
    .from("pc_staff").select("id").eq("user_id", userId).maybeSingle();

  const orFilter = [
    `owner_id.eq.${userId}`,
    ...(staffRow
      ? [`assigned_staff_id.eq.${staffRow.id}`, `referred_by_staff_id.eq.${staffRow.id}`]
      : []),
  ].join(",");

  const { data: allowed } = await admin
    .from("tenants").select("owner_id").eq("id", tenantId).or(orFilter).maybeSingle();

  if (!allowed) return { allowed: false, reason: "no_access" };
  return { allowed: true, reason: allowed.owner_id === userId ? "owner" : "staff" };
}

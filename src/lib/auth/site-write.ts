import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { apiUserId } from "@/lib/auth/api-caller";
import { siteAccess } from "@/lib/mcp/auth";

/**
 * True when the signed-in user may change things on this site (owner, admin,
 * editor, assigned staff, super admin). View-only members get false. Use in
 * dashboard API writes that otherwise only checked membership. Works for the
 * web cookie session and the mobile app's Bearer token.
 */
export async function canWriteSite(tenantId: string): Promise<boolean> {
  const userId = await apiUserId();
  if (!userId) return false;
  return (await siteAccess(await createAdminClient(), userId, tenantId)) === "write";
}

/**
 * True when the signed-in user is a member of this site whose role is NOT in
 * `allowed`, and is neither a super admin nor active Passive Coder staff.
 * Default: refuses view-only members ("viewer") only.
 *
 * For routes that already decided the caller may act on the site (membership,
 * ownership recorded only in tenants.owner_id, staff "manage as") but never
 * looked at the role: it refuses the listed members and changes nothing for
 * anyone else (an owner known only from tenants.owner_id has no member row
 * and passes). Works for the web cookie session and the mobile Bearer token.
 */
export async function lacksSiteRole(tenantId: string, allowed: readonly string[] = ["owner", "admin", "editor"]): Promise<boolean> {
  const userId = await apiUserId();
  if (!userId) return false;
  const admin = await createAdminClient();
  const { data: member } = await admin.from("tenant_members").select("role").eq("user_id", userId).eq("tenant_id", tenantId).maybeSingle();
  if (!member || allowed.includes(member.role as string)) return false;
  const [{ data: sa }, { data: staff }] = await Promise.all([
    admin.from("super_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    admin.from("pc_staff").select("id").eq("user_id", userId).eq("status", "active").maybeSingle(),
  ]);
  return !sa && !staff;
}

/** View-only member (role "viewer"), not staff or super admin. */
export async function isViewOnlyMember(tenantId: string): Promise<boolean> {
  return lacksSiteRole(tenantId);
}

/** Member below admin (editor or viewer), not staff or super admin: for
 *  site-level settings only the owner or an admin may change. */
export async function isBelowSiteAdmin(tenantId: string): Promise<boolean> {
  return lacksSiteRole(tenantId, ["owner", "admin"]);
}

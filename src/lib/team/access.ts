import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { staffSites } from "@/lib/staff";

/**
 * Who can manage a site's team: its owner and admins, super admins, and the
 * active Passive Coder staff (every site). Editors and authors
 * can see the team but not change it.
 */
export async function teamAccess() {
  // Web cookie session or mobile Bearer + X-Tenant-Id.
  const caller = await getApiCaller();
  if (!caller) return null;
  const { user, tenantId } = caller;
  const admin = await createAdminClient();
  const [{ data: sa }, { data: me }, { data: staff }] = await Promise.all([
    admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    admin.from("tenant_members").select("role").eq("tenant_id", tenantId).eq("user_id", user.id).maybeSingle(),
    admin.from("pc_staff").select("id, status").eq("user_id", user.id).eq("status", "active").maybeSingle(),
  ]);
  let manage = !!sa || ["owner", "admin"].includes((me?.role as string) ?? "");
  // Active Passive Coder staff who can reach this site (all sites for a Staff
  // Manager). Staff run handovers, so they may set any site user's password.
  let staffOnSite = false;
  if (staff) {
    const { data: t } = await staffSites(admin.from("tenants").select("id").eq("id", tenantId), staff).maybeSingle();
    staffOnSite = !!t;
    if (staffOnSite) manage = true;
  }
  if (!manage && !me) return null;
  return { admin, userId: user.id, tenantId, manage, superAdmin: !!sa, staff: staffOnSite };
}

export type TeamAccess = NonNullable<Awaited<ReturnType<typeof teamAccess>>>;

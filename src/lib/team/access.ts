import "server-only";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/**
 * Who can manage a site's team: its owner and admins, super admins, and the
 * staff member assigned to (or who referred) the site. Editors and authors
 * can see the team but not change it.
 */
export async function teamAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tenantId = await apiTenantId();
  if (!user || !tenantId) return null;
  const admin = await createAdminClient();
  const [{ data: sa }, { data: me }, { data: staff }] = await Promise.all([
    admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    admin.from("tenant_members").select("role").eq("tenant_id", tenantId).eq("user_id", user.id).maybeSingle(),
    admin.from("pc_staff").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle(),
  ]);
  let manage = !!sa || ["owner", "admin"].includes((me?.role as string) ?? "");
  if (!manage && staff) {
    const { data: t } = await admin.from("tenants").select("id").eq("id", tenantId)
      .or(`assigned_staff_id.eq.${staff.id},referred_by_staff_id.eq.${staff.id}`).maybeSingle();
    manage = !!t;
  }
  if (!manage && !me) return null;
  return { admin, userId: user.id, tenantId, manage };
}

export type TeamAccess = NonNullable<Awaited<ReturnType<typeof teamAccess>>>;

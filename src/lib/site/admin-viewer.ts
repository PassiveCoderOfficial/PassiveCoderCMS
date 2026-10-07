import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * True when the signed-in visitor can edit this tenant's site (super admin, or
 * owner / admin / editor member). Drives the floating "edit this page" widget
 * on both the (site) pages and tenant homepages, which render in (marketing).
 */
export async function isTenantAdminViewer(tenantId: string | null): Promise<boolean> {
  if (!tenantId) return false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const admin = await createAdminClient();
  const [{ data: sa }, { data: membership }] = await Promise.all([
    admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    admin.from("tenant_members").select("role").eq("user_id", user.id).eq("tenant_id", tenantId)
      .in("role", ["owner", "admin", "editor"]).maybeSingle(),
  ]);
  return !!sa || !!membership;
}

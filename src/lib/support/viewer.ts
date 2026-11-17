import { createAdminClient, createClient } from "@/lib/supabase/server";
import { canReport, supportRole } from "@/lib/support/reports";

/**
 * Report button (camera/?) on a site: shown to anyone who can edit it
 * (owner/admin/editor, assigned staff, super admins). `team` = our staff or
 * a super admin, who can also file internal notes.
 */
export async function supportCaptureFor(tenantId: string | null): Promise<{ show: boolean; team: boolean }> {
  if (!tenantId) return { show: false, team: false };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { show: false, team: false };
  const admin = await createAdminClient();
  const [ok, role] = await Promise.all([canReport(admin, user.id, tenantId), supportRole(admin, user.id)]);
  return { show: ok, team: ok && (role.superAdmin || !!role.staffId) };
}

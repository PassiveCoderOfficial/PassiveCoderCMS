import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin, isManager } from "@/lib/super-admin";

/** Demo builder access: active pc_staff, super admins and managers.
 *  `sa` = may see/manage every demo, not just their own. */
export async function demoCaller() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = await createAdminClient();
  const { data: staff } = await admin
    .from("pc_staff").select("id,status").eq("user_id", user.id).maybeSingle();
  const sa = (await isSuperAdmin(user.id)) || (await isManager(user.id));
  if (!sa && staff?.status !== "active") return null;
  return { user, admin, staffId: staff?.status === "active" ? (staff.id as string) : null, sa };
}

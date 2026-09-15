import { createAdminClient } from "@/lib/supabase/server";

/** Which of the OTHER admin-style portals (super-admin, staff, vendor) a
 *  given user can also reach, besides whichever one they're currently in.
 *  Additive only — each portal's own layout keeps its own auth/redirect
 *  logic untouched; this just answers "should I show a link over there"
 *  for the shell footer/topbar, so a user wearing multiple hats (e.g. a
 *  pc_staff member who's also an approved vendor) can cross over without
 *  knowing the URL. Never used to grant access — only to decide whether to
 *  show a link; the destination layout still re-checks on its own. */
export async function crossPortalAccess(userId: string): Promise<{
  superAdmin: boolean;
  staff: boolean;
  vendor: boolean;
}> {
  const admin = await createAdminClient();
  const [{ data: sa }, { data: staffRow }, { data: vendorRow }] = await Promise.all([
    admin.from("super_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    admin.from("pc_staff").select("id").eq("user_id", userId).eq("status", "active").maybeSingle(),
    // A person can sell on multiple tenant stores — only existence matters
    // here, so cap at 1 row rather than requiring exactly one.
    admin.from("vendors").select("id").eq("user_id", userId).eq("status", "approved").limit(1).maybeSingle(),
  ]);
  return {
    superAdmin: !!sa,
    staff: !!staffRow,
    vendor: !!vendorRow,
  };
}

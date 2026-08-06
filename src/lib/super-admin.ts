import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function isSuperAdmin(userId: string): Promise<boolean> {
  // Try admin client first, fall back to user-context client (RLS: users can read own row)
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("super_admins")
      .select("user_id")
      .eq("user_id", userId)
      .single();
    if (data) return true;
  } catch {}

  const supabase = await createClient();
  const { data } = await supabase
    .from("super_admins")
    .select("user_id")
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function requireSuperAdmin() {
  const supabase = await createClient();
  // getSession() reads from cookie — no network call, always fast.
  // We verify the user is actually in super_admins (service-role DB check)
  // so spoofing the cookie doesn't help an attacker.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    // Fallback: try network call in case session cookie is missing but token is valid
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const ok = await isSuperAdmin(user.id);
    return ok ? user : null;
  }
  const ok = await isSuperAdmin(session.user.id);
  return ok ? session.user : null;
}

/** Manager = a pc_staff row with is_manager = true. Gets SA-panel access
 *  minus the ability to grant/revoke/view Super Admin accounts — that
 *  section is hidden entirely for managers, not just read-only. */
export async function isManager(userId: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("pc_staff")
    .select("id")
    .eq("user_id", userId)
    .eq("is_manager", true)
    .eq("status", "active")
    .maybeSingle();
  return !!data;
}

/** SA panel entry gate: true super admins pass, and so do managers — the
 *  panel itself renders differently for managers (SA-account section
 *  hidden), but they get in. Returns { user, isSA } so callers can tell
 *  which; isSA=false + truthy user means "manager, not full SA". */
export async function requireManagerOrSuperAdmin(): Promise<{ user: Awaited<ReturnType<typeof requireSuperAdmin>>; isSA: boolean } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (await isSuperAdmin(user.id)) return { user, isSA: true };
  if (await isManager(user.id)) return { user, isSA: false };
  return null;
}

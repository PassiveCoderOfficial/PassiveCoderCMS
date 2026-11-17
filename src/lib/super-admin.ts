import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiUser } from "@/lib/auth/api-caller";

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
  // apiUser(): the cookie session (getUser(), verified with Supabase Auth,
  // never the unverified getSession()) on the web, or a verified Bearer
  // token from the mobile app (2026-10-23, M4).
  const user = await apiUser();
  if (!user) return null;
  const ok = await isSuperAdmin(user.id);
  return ok ? user : null;
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

/** Super admin or Staff Manager: everything in the panel except Super Admin
 *  accounts and immediate site deletion, which stay on isSuperAdmin. */
export async function isPanelAdmin(userId: string): Promise<boolean> {
  return (await isSuperAdmin(userId)) || (await isManager(userId));
}

export async function requirePanelAdmin() {
  const user = await apiUser();
  if (!user) return null;
  return (await isPanelAdmin(user.id)) ? user : null;
}

/** A Staff Manager may not delete, deactivate or reset a super admin's account. */
export async function canActOnUser(callerId: string, targetId: string): Promise<boolean> {
  return (await isSuperAdmin(callerId)) || !(await isSuperAdmin(targetId));
}

/** SA panel entry gate: true super admins pass, and so do managers — the
 *  panel itself renders differently for managers (SA-account section
 *  hidden), but they get in. Returns { user, isSA } so callers can tell
 *  which; isSA=false + truthy user means "manager, not full SA". */
export async function requireManagerOrSuperAdmin(): Promise<{ user: Awaited<ReturnType<typeof requireSuperAdmin>>; isSA: boolean } | null> {
  const user = await apiUser();
  if (!user) return null;

  if (await isSuperAdmin(user.id)) return { user, isSA: true };
  if (await isManager(user.id)) return { user, isSA: false };
  return null;
}

"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Customer-facing auth actions — deliberately separate from
 * (auth)/login/actions.ts, which is staff/admin login into the CMS
 * dashboard. Same Supabase auth.users table underneath (shared infra), but a
 * different audience and a different redirect: a customer signing in here
 * lands back on the tenant's own storefront, never the dashboard or
 * super-admin panel. Nothing here grants dashboard/staff access — that's
 * gated separately by tenant_members / super_admins membership rows, which a
 * plain customer signup never creates.
 */
export async function customerLoginAction(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function customerSignupAction(email: string, password: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function customerLogoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

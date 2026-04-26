import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("super_admins")
    .select("user_id")
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function requireSuperAdmin() {
  // Use SSR client for session, admin client for the privilege check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const ok = await isSuperAdmin(user.id);
  return ok ? user : null;
}

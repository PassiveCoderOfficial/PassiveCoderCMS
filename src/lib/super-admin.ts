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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const ok = await isSuperAdmin(user.id);
  return ok ? user : null;
}

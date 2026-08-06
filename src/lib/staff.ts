import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function getStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = await createAdminClient();
  const { data } = await admin.from("pc_staff").select("*").eq("user_id", user.id).single();
  return data ?? null;
}

export async function requireStaff() {
  const staff = await getStaff();
  return staff;
}

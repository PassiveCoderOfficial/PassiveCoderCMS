import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function getAgent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = await createAdminClient();
  const { data } = await admin.from("agents").select("*").eq("user_id", user.id).single();
  return data ?? null;
}

export async function requireAgent() {
  const agent = await getAgent();
  return agent;
}

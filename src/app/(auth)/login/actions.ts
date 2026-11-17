"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function loginAction(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message, redirect: null };
  }

  // Detect super admin — redirect to SA panel instead of tenant dashboard
  if (data.user) {
    const admin = await createAdminClient();
    const { data: sa } = await admin
      .from("super_admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (sa) return { error: null, redirect: "/super-admin" };
  }

  return { error: null, redirect: null };
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentTenantId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!data?.tenant_id) redirect("/login?error=no_tenant");
  return data.tenant_id;
}

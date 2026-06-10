import { createClient } from "@/lib/supabase/client";

/**
 * Resolve the current user's tenant id from the browser. Uses the primary
 * tenant_members row (falling back to any membership). For client-side dashboard
 * pages on the apex domain this is the tenant the user manages. Server
 * components should use getCurrentTenantId() from "@/lib/tenant/current" instead,
 * which also honours subdomain + super-admin impersonation context.
 */
export async function getClientTenantId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("tenant_members")
    .select("tenant_id, is_primary")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.tenant_id ?? null;
}

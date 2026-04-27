import { createClient } from "@/lib/supabase/server";

/**
 * Resolve tenant ID for API routes.
 * Regular users: tenant_members lookup.
 * Super admins: first tenant owned by user.
 */
export async function apiTenantId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();
  if (membership?.tenant_id) return membership.tenant_id;

  // SA fallback: find tenant by owner_id
  const { data: owned } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  return owned?.id ?? null;
}

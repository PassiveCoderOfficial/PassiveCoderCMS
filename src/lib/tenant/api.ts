import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { SA_VIEWING_COOKIE } from "./current";

/**
 * Resolve tenant ID for API routes.
 * SA impersonating: uses sa_viewing_tenant cookie.
 * SA own site: first tenant owned by user.
 * Regular users: tenant_members lookup.
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

  // SA fallback: check impersonation cookie first, then owned tenant
  const cookieStore = await cookies();
  const viewing = cookieStore.get(SA_VIEWING_COOKIE)?.value;
  if (viewing) return viewing;

  const { data: owned } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  return owned?.id ?? null;
}

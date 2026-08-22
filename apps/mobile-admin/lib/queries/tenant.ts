import { supabase } from "../supabase";
import type { Tenant } from "../types";

export async function getTenant(tenantId: string): Promise<Tenant> {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, name, owner_id, plan, status, custom_domain, domain_status, trial_ends_at")
    .eq("id", tenantId)
    .single();
  if (error) throw error;
  return data as Tenant;
}

export async function updateTenantName(tenantId: string, name: string): Promise<void> {
  const { error } = await supabase.from("tenants").update({ name }).eq("id", tenantId);
  if (error) throw error;
}

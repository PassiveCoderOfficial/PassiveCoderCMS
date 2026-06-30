import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import DomainSettingsClient from "./domain-client";

export const metadata = { title: "Domain Settings" };

export default async function DomainSettingsPage() {
  const tenantId = await getCurrentTenantId();

  const supabase = await createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id,slug,custom_domain,domain_status")
    .eq("id", tenantId)
    .single();

  // Latest domain order to restore the chosen DNS method on reload.
  let savedDnsType: "nameserver" | "arecord" | null = null;
  if (tenant?.custom_domain) {
    const { data: order } = await supabase
      .from("domain_orders")
      .select("dns_type")
      .eq("tenant_id", tenantId)
      .eq("domain", tenant.custom_domain)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const dt = order?.dns_type;
    if (dt === "nameserver" || dt === "arecord") savedDnsType = dt;
    else if (dt === "automatic") savedDnsType = "nameserver";
  }

  return <DomainSettingsClient tenant={tenant} savedDnsType={savedDnsType} />;
}

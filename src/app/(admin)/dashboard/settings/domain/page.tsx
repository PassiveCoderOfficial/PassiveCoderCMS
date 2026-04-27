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

  return <DomainSettingsClient tenant={tenant} />;
}

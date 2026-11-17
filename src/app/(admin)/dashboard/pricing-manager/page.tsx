import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import PricingManagerClient from "./pricing-manager-client";

export const metadata = { title: "Pricing — Dashboard" };

export default async function PricingManagerPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  const { data: tables } = await supabase
    .from("pricing_tables")
    .select("*, pricing_packages(*)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return <PricingManagerClient initialTables={tables ?? []} />;
}

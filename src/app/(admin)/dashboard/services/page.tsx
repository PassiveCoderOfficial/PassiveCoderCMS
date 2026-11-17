import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import ServicesManager from "@/components/admin/services-manager";

export const metadata = { title: "Services — Dashboard" };

export default async function ServicesPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("service_groups")
    .select("*, service_items(*)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  // Embedded rows come back unordered.
  for (const g of groups ?? []) g.service_items?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);

  return <ServicesManager initialGroups={groups ?? []} />;
}

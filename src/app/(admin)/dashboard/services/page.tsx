import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import ServicesClient from "./services-client";

export const metadata = { title: "Services — Dashboard" };

export default async function ServicesPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("service_groups")
    .select("*, service_items(*)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return <ServicesClient initialGroups={groups ?? []} />;
}

import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import SlidersClient from "./sliders-client";

export const metadata = { title: "Sliders — Dashboard" };

export default async function SlidersPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("slider_groups")
    .select("*, slider_slides(*)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return <SlidersClient initialGroups={groups ?? []} />;
}

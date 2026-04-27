import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import FeaturesClient from "./features-client";

export const metadata = { title: "Features — Dashboard" };

export default async function FeaturesPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("feature_groups")
    .select("*, feature_items(*)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return <FeaturesClient initialGroups={groups ?? []} />;
}

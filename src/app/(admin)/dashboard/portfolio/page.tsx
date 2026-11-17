import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import PortfolioClient from "./portfolio-client";

export const metadata = { title: "Portfolio — Dashboard" };

export default async function PortfolioPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("portfolio_groups")
    .select("*, portfolio_items(*)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  return <PortfolioClient initialGroups={groups ?? []} />;
}

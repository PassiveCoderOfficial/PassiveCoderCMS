import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { LeadsClient } from "./leads-client";

export const metadata = { title: "Property Leads — Dashboard" };

export default async function LeadsPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const { data } = await supabase.from("re_leads").select("*, property:re_properties(title, slug)").eq("tenant_id", tid).order("created_at", { ascending: false }).limit(500);
  return <LeadsClient initial={data ?? []} />;
}

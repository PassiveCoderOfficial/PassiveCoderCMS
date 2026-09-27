import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { CommunitiesManager } from "@/components/admin/real-estate/managers";

export const metadata = { title: "Communities — Dashboard" };

export default async function CommunitiesPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const { data } = await supabase.from("re_communities").select("*").eq("tenant_id", tid).order("sort_order");
  return <CommunitiesManager initial={data ?? []} />;
}

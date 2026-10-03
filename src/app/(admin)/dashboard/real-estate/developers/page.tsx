import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { DevelopersManager } from "@/components/admin/real-estate/managers";

export const metadata = { title: "Developers — Dashboard" };

export default async function DevelopersPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const { data } = await supabase.from("re_developers").select("*").eq("tenant_id", tid).order("sort_order");
  return <div className="p-6"><DevelopersManager initial={data ?? []} /></div>;
}

import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { withDefaults } from "@/lib/results/fields";
import { ResultsSettingsClient } from "./settings-client";

export const metadata = { title: "Results Settings — Dashboard" };

export default async function ResultsSettingsPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const [{ data }, { count }] = await Promise.all([
    supabase.from("results_settings").select("*").eq("tenant_id", tid).maybeSingle(),
    supabase.from("results").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
  ]);
  return <ResultsSettingsClient initial={withDefaults(data)} total={count ?? 0} />;
}

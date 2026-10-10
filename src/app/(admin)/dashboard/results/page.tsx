import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { ResultsManager } from "@/components/admin/results/managers";

export const metadata = { title: "Results — Dashboard" };

export default async function ResultsPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const [{ data: rows }, { data: courses }] = await Promise.all([
    supabase.from("results").select("*, course:results_courses(name, slug, page_url)").eq("tenant_id", tid).order("created_at", { ascending: false }).limit(10000),
    supabase.from("results_courses").select("id, name").eq("tenant_id", tid).order("sort_order").order("name"),
  ]);
  return (
    <div className="p-6">
      <ResultsManager initial={rows ?? []} courses={courses ?? []} />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { CoursesManager } from "@/components/admin/results/managers";

export const metadata = { title: "Courses — Dashboard" };

export default async function CoursesPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();
  const { data } = await supabase.from("results_courses").select("*").eq("tenant_id", tid).order("sort_order").order("name");
  return (
    <div className="p-6">
      <CoursesManager initial={data ?? []} />
    </div>
  );
}

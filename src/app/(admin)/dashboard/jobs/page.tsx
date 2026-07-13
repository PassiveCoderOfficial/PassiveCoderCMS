import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import JobsClient from "./jobs-client";

export const metadata = { title: "Jobs — Dashboard" };

export default async function JobsPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const [{ data: jobs }, { data: staff }] = await Promise.all([
    supabase.from("jobs").select("*, staff(id, name, phone)")
      .eq("tenant_id", tid)
      .order("scheduled_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("staff").select("*").eq("tenant_id", tid).order("created_at"),
  ]);

  return <JobsClient initialJobs={jobs ?? []} initialStaff={staff ?? []} />;
}

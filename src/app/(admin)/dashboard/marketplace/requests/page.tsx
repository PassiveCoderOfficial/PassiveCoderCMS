import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import RequestsClient from "./requests-client";

export const metadata = { title: "Service Requests — Dashboard" };

export default async function ServiceRequestsPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const [{ data: requests }, { data: vendors }] = await Promise.all([
    supabase.from("service_requests")
      .select("*, service_subcategories(id, name), vendors:claimed_by_vendor_id(id, name, phone)")
      .eq("tenant_id", tid)
      .order("urgency", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("vendors").select("id, name, phone").eq("tenant_id", tid).eq("status", "approved").order("name"),
  ]);

  return <RequestsClient initialRequests={requests ?? []} vendors={vendors ?? []} />;
}

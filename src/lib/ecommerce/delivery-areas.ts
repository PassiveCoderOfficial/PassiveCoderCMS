import { createAdminClient } from "@/lib/supabase/server";

/** The store's delivery areas (from its shipping rates), for area pickers. */
export async function deliveryAreas(tenantId: string): Promise<string[]> {
  const admin = await createAdminClient();
  const { data } = await admin.from("shipping_rates").select("areas").eq("tenant_id", tenantId).order("sort_order");
  return [...new Set((data ?? []).flatMap((r) => (r.areas ?? []) as string[]))];
}

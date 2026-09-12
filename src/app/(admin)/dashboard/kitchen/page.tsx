import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import KitchenClient from "./kitchen-client";

export const metadata = { title: "Kitchen — Dashboard" };

/**
 * Kitchen order pipeline (docs/business/06-restaurant-vertical.md phase 3).
 * Reads every order with a non-null kitchen_status — seeded by both the
 * web dine-in/pickup checkout (phase 2) and POS dine-in/pickup sales —
 * regardless of which branch it came from; the client groups by branch and
 * status so a multi-branch tenant sees one board per location.
 *
 * Renders an empty state rather than nothing when a tenant has no branches
 * yet — the restaurant vertical isn't set up, not broken.
 */
export default async function KitchenPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const [{ data: branches }, { data: orders }, { data: tables }] = await Promise.all([
    supabase.from("restaurant_branches").select("id, name").eq("tenant_id", tid).eq("is_active", true),
    supabase.from("orders")
      .select("id, order_number, items, branch_id, table_id, kitchen_status, fulfillment_type, customer_name, created_at, restaurant_tables(table_number)")
      .eq("tenant_id", tid)
      .not("kitchen_status", "is", null)
      .not("kitchen_status", "eq", "completed")
      .order("created_at", { ascending: true }),
    // Table occupancy: every active table, joined against branch (RLS on
    // restaurant_branches is tenant-scoped, restaurant_tables' own read
    // policy is not — filtering branches to this tenant here is what keeps
    // this query tenant-scoped, not an assumption about the table policy).
    supabase.from("restaurant_tables")
      .select("id, table_number, branch_id, restaurant_branches!inner(tenant_id)")
      .eq("is_active", true)
      .eq("restaurant_branches.tenant_id", tid),
  ]);

  // occupied = has a live (non-completed) kitchen order sitting on it right now.
  const occupiedTableIds = new Set((orders ?? []).map(o => o.table_id).filter(Boolean));

  return (
    <KitchenClient
      branches={branches ?? []}
      orders={orders ?? []}
      tables={(tables ?? []).map(t => ({ id: t.id, table_number: t.table_number, branch_id: t.branch_id, occupied: occupiedTableIds.has(t.id) }))}
    />
  );
}

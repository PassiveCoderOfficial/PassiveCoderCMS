import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import PosClient from "./pos-client";

export const metadata = { title: "POS — Dashboard" };

export default async function PosPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const [{ data: products }, { data: settings }, { data: branches }] = await Promise.all([
    supabase.from("products")
      .select("id, name, sku, price, stock_quantity, track_inventory, status")
      .eq("tenant_id", tid).eq("status", "active").order("name"),
    supabase.from("site_settings").select("currency").eq("tenant_id", tid).maybeSingle(),
    // Empty for any tenant that hasn't set up the restaurant vertical — the
    // branch/table picker below only renders when this is non-empty, so a
    // plain retail POS looks exactly as it did before this query existed.
    supabase.from("restaurant_branches")
      .select("id, name, restaurant_tables(id, table_number, is_active)")
      .eq("tenant_id", tid).eq("is_active", true).order("name"),
  ]);

  // Every explicit 86 across every branch — small table, cheap to load in
  // full and let the client filter by whichever branch is selected, rather
  // than a second round trip on every branch switch.
  const branchIds = (branches ?? []).map(b => b.id);
  const { data: availability } = branchIds.length
    ? await supabase.from("branch_product_availability").select("branch_id, product_id, in_stock").in("branch_id", branchIds)
    : { data: [] as { branch_id: string; product_id: string; in_stock: boolean }[] };

  return (
    <PosClient
      products={products ?? []}
      currency={settings?.currency || "USD"}
      branches={branches ?? []}
      availability={availability ?? []}
    />
  );
}

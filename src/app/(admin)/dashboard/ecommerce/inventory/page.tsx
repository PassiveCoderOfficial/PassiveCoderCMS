import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import InventoryClient from "./inventory-client";

export const metadata = { title: "Inventory — Dashboard" };

export default async function InventoryPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const { data: products } = await supabase.from("products")
    .select("id, name, sku, status, price, track_inventory, stock_quantity, low_stock_threshold, images")
    .eq("tenant_id", tid)
    .order("name");

  return <InventoryClient initialProducts={products ?? []} />;
}

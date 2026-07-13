import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import PosClient from "./pos-client";

export const metadata = { title: "POS — Dashboard" };

export default async function PosPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const [{ data: products }, { data: settings }] = await Promise.all([
    supabase.from("products")
      .select("id, name, sku, price, stock_quantity, track_inventory, status")
      .eq("tenant_id", tid).eq("status", "active").order("name"),
    supabase.from("site_settings").select("currency").eq("tenant_id", tid).maybeSingle(),
  ]);

  return <PosClient products={products ?? []} currency={settings?.currency || "USD"} />;
}

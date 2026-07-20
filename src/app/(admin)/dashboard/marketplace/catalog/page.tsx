import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import CatalogClient from "./catalog-client";

export const metadata = { title: "Service Catalog — Dashboard" };

export default async function CatalogPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("service_categories")
    .select("*, service_subcategories(*)")
    .eq("tenant_id", tid)
    .order("sort_order");

  return <CatalogClient initialCategories={categories ?? []} />;
}

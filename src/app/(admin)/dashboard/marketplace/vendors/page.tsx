import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import VendorsClient from "./vendors-client";

export const metadata = { title: "Vendors — Dashboard" };

export default async function VendorsPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createClient();

  const [{ data: vendors }, { data: categories }] = await Promise.all([
    supabase.from("vendors").select("*").eq("tenant_id", tid).order("created_at", { ascending: false }),
    supabase.from("service_categories").select("*, service_subcategories(*)").eq("tenant_id", tid).order("sort_order"),
  ]);

  return <VendorsClient initialVendors={vendors ?? []} categories={categories ?? []} />;
}

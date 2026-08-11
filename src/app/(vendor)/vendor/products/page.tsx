import { createAdminClient } from "@/lib/supabase/server";
import { currentVendor } from "@/lib/marketplace-ecom/vendor-auth";
import VendorProductsClient from "./products-client";

export const metadata = { title: "My Products — Seller Centre" };

export default async function VendorProductsPage() {
  const vendor = await currentVendor();
  if (!vendor) return null;

  const admin = await createAdminClient();
  const { data: categories } = await admin
    .from("categories")
    .select("id, name")
    .eq("tenant_id", vendor.tenant_id)
    .order("order_index");

  return <VendorProductsClient categories={categories ?? []} />;
}

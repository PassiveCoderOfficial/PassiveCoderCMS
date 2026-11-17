import { getCurrentTenantId } from "@/lib/tenant/current";
import { createAdminClient } from "@/lib/supabase/server";
import ProductsClient from "./products-client";
import { adminProductCreationOff } from "./marketplace-guard";

export const metadata = { title: "Products — Dashboard" };

/**
 * Products list. On a marketplace the store can't add products itself (the
 * Add buttons are hidden and /new, /bulk-upload redirect back here with
 * ?note=sellers_add) and each row shows which seller listed it.
 */
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ note?: string; seller?: string }> }) {
  const sp = await searchParams;
  const tid = await getCurrentTenantId();
  const marketplace = await adminProductCreationOff(tid);
  let sellers: { id: string; name: string; status: string }[] = [];
  if (marketplace) {
    const admin = await createAdminClient();
    const { data } = await admin.from("vendors").select("id, name, status")
      .eq("tenant_id", tid).contains("capabilities", ["ecommerce"]).order("name");
    sellers = data ?? [];
  }
  return (
    <ProductsClient
      marketplace={marketplace}
      sellers={sellers}
      note={sp.note === "sellers_add" ? "Sellers add products from the Seller Centre. You can review, edit and moderate them here." : null}
      initialSeller={sp.seller ?? ""}
    />
  );
}

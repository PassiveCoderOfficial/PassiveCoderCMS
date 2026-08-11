import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import SingleVendorCheckout from "./single-vendor-checkout";
import MarketplaceCheckoutClient from "../marketplace-checkout/checkout-client";

export const metadata = { title: "Checkout" };

/**
 * Checkout entry point.
 *
 * A multi-vendor tenant needs the marketplace flow — it splits the basket per
 * seller, charges delivery per parcel and creates sub-orders. Routing on the
 * tenant here rather than in the cart drawer means every path to checkout
 * (drawer, cart page, direct link) lands on the right one.
 */
export default async function CheckoutPage() {
  const tenantId = (await headers()).get("x-tenant-id");

  if (tenantId) {
    const admin = await createAdminClient();
    const { count } = await admin
      .from("vendors")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "approved")
      .contains("capabilities", ["ecommerce"]);
    if ((count ?? 0) > 0) return <MarketplaceCheckoutClient />;
  }

  return <SingleVendorCheckout />;
}

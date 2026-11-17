import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import SingleVendorCheckout, { type ShippingRateOption } from "./single-vendor-checkout";
import MarketplaceCheckoutClient from "@/modules/registry/marketplace/checkout-client";
import { loadFoodCheckout } from "@/modules/registry/food-delivery/server";

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

  // Delivery zones are optional: a tenant with no shipping_rates rows keeps
  // the old free-delivery checkout untouched. Tax comes from Shop > Settings
  // (the server recomputes it when the order is placed).
  let shippingRates: ShippingRateOption[] = [];
  let tax = { rate: 0, inclusive: false };
  if (tenantId) {
    const admin = await createAdminClient();
    const [{ data }, { data: taxCfg }] = await Promise.all([
      admin
        .from("shipping_rates")
        .select("id, name, rate, free_above, eta_days, is_default")
        .eq("tenant_id", tenantId)
        .order("sort_order"),
      admin.from("ecommerce_settings").select("tax_rate, tax_inclusive").eq("tenant_id", tenantId).maybeSingle(),
    ]);
    tax = { rate: Number(taxCfg?.tax_rate) || 0, inclusive: !!taxCfg?.tax_inclusive };
    shippingRates = (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      rate: Number(r.rate),
      free_above: r.free_above === null ? null : Number(r.free_above),
      eta_days: r.eta_days,
      is_default: r.is_default,
    }));
  }

  // Restaurants: delivery map pin, and the zone for food programme restaurants.
  const food = await loadFoodCheckout(tenantId);

  return <SingleVendorCheckout shippingRates={shippingRates} tax={tax} food={food} />;
}

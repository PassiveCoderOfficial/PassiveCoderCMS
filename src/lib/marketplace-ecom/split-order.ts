import { createAdminClient } from "@/lib/supabase/server";
import type { CartItem } from "@/types/cms";

/** Money is stored as numeric(12,2). Every derived figure goes through this so
 *  a stray float never lands in the ledger and leaves a vendor balance that
 *  can't be reconciled to the cent. */
export const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface CheckoutItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
}

export interface ShippingRate {
  id: string;
  name: string;
  rate: number;
  free_above: number | null;
  cod_fee_pct: number;
  areas: string[];
  is_default: boolean;
}

export interface VendorGroup {
  vendor_id: string;
  vendor_name: string;
  commission_rate: number;
  items: CartItem[];
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  commission_amount: number;
  vendor_earning: number;
}

export interface SplitResult {
  groups: VendorGroup[];
  subtotal: number;
  shipping_total: number;
  discount_total: number;
  grand_total: number;
}

interface PricedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: unknown;
  vendor_id: string | null;
  stock_quantity: number;
  track_inventory: boolean;
  status: string;
  approval_status: string;
  vendors: { id: string; name: string; commission_rate: number; status: string } | null;
}

/** Resolve the shipping rate for a delivery area. Falls back to the tenant's
 *  default rate when the area isn't explicitly listed — an unknown upazila
 *  should still be quotable rather than blocking checkout. */
export function rateForArea(rates: ShippingRate[], area: string | null | undefined): ShippingRate | null {
  if (!rates.length) return null;
  if (area) {
    const needle = area.trim().toLowerCase();
    const hit = rates.find((r) => r.areas.some((a) => a.toLowerCase() === needle));
    if (hit) return hit;
  }
  return rates.find((r) => r.is_default) ?? rates[0];
}

/**
 * Turn a cart into per-vendor groups with server-priced money.
 *
 * Prices, commission rates and vendor identity are read from the database and
 * never from the client payload — the browser only ever sends product ids and
 * quantities. Shipping is charged once per vendor because each vendor ships
 * their own parcel direct to the customer.
 */
export async function splitCart(
  tenantId: string,
  items: CheckoutItem[],
  area?: string | null,
): Promise<{ result: SplitResult; products: PricedProduct[]; rate: ShippingRate | null }> {
  if (!items.length) throw new Error("Cart is empty");

  const admin = await createAdminClient();
  const productIds = [...new Set(items.map((i) => i.product_id))];

  const { data: rows, error } = await admin
    .from("products")
    .select(
      "id, name, slug, price, images, vendor_id, stock_quantity, track_inventory, status, approval_status, vendors(id, name, commission_rate, status)",
    )
    .eq("tenant_id", tenantId)
    .in("id", productIds);
  if (error) throw new Error(error.message);

  const products = (rows ?? []) as unknown as PricedProduct[];
  const byId = new Map(products.map((p) => [p.id, p]));

  const { data: rateRows } = await admin
    .from("shipping_rates")
    .select("id, name, rate, free_above, cod_fee_pct, areas, is_default")
    .eq("tenant_id", tenantId)
    .order("sort_order");
  const rates = (rateRows ?? []) as ShippingRate[];
  const rate = rateForArea(rates, area);

  const groups = new Map<string, VendorGroup>();

  for (const line of items) {
    const p = byId.get(line.product_id);
    if (!p) throw new Error(`Product unavailable: ${line.product_id}`);
    if (p.status !== "active") throw new Error(`${p.name} is no longer available`);
    if (p.vendor_id && p.approval_status !== "approved") {
      throw new Error(`${p.name} is not approved for sale`);
    }
    const qty = Math.max(1, Math.floor(line.quantity));
    if (p.track_inventory && p.stock_quantity < qty) {
      throw new Error(`${p.name} has only ${p.stock_quantity} left in stock`);
    }
    if (!p.vendor_id || !p.vendors) throw new Error(`${p.name} has no seller assigned`);
    if (p.vendors.status !== "approved") throw new Error(`Seller for ${p.name} is not active`);

    let g = groups.get(p.vendor_id);
    if (!g) {
      g = {
        vendor_id: p.vendor_id,
        vendor_name: p.vendors.name,
        // Snapshot the rate now; a later change to the vendor's commission
        // must not rewrite the economics of an order already placed.
        commission_rate: Number(p.vendors.commission_rate ?? 0),
        items: [],
        subtotal: 0,
        shipping_cost: 0,
        discount: 0,
        total: 0,
        commission_amount: 0,
        vendor_earning: 0,
      };
      groups.set(p.vendor_id, g);
    }

    const price = money(Number(p.price));
    const image = Array.isArray(p.images) ? (p.images[0] as string | undefined) : undefined;
    g.items.push({
      id: `${p.id}${line.variant_id ? `:${line.variant_id}` : ""}`,
      product_id: p.id,
      variant_id: line.variant_id,
      name: p.name,
      slug: p.slug,
      price,
      quantity: qty,
      image,
    });
    g.subtotal = money(g.subtotal + price * qty);
  }

  for (const g of groups.values()) {
    // Each vendor parcel is charged separately, and each qualifies for free
    // shipping on its own subtotal — a 300tk buy from one vendor doesn't ride
    // free on a 2500tk buy from another.
    const base = rate?.rate ?? 0;
    const freeAbove = rate?.free_above ?? null;
    g.shipping_cost = freeAbove != null && g.subtotal >= freeAbove ? 0 : money(base);
    g.total = money(g.subtotal + g.shipping_cost - g.discount);
    // Commission is charged on goods only, never on the delivery charge.
    g.commission_amount = money((g.subtotal - g.discount) * (g.commission_rate / 100));
    g.vendor_earning = money(g.subtotal - g.discount - g.commission_amount);
  }

  const list = [...groups.values()];
  const result: SplitResult = {
    groups: list,
    subtotal: money(list.reduce((s, g) => s + g.subtotal, 0)),
    shipping_total: money(list.reduce((s, g) => s + g.shipping_cost, 0)),
    discount_total: money(list.reduce((s, g) => s + g.discount, 0)),
    grand_total: money(list.reduce((s, g) => s + g.total, 0)),
  };

  return { result, products, rate };
}

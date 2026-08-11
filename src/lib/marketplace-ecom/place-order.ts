import { createAdminClient } from "@/lib/supabase/server";
import { splitCart, money, type CheckoutItem } from "./split-order";

export interface CheckoutAddress {
  name: string;
  phone: string;
  email?: string;
  address: string;
  area?: string;
  city?: string;
  note?: string;
}

export interface PlaceOrderInput {
  tenantId: string;
  items: CheckoutItem[];
  address: CheckoutAddress;
  paymentMethod: "cod" | "bkash";
  customerId?: string | null;
  notes?: string;
}

export interface PlaceOrderResult {
  order_id: string;
  order_number: string;
  total: number;
  sub_orders: { id: string; sub_order_number: string; vendor_name: string; total: number }[];
}

/**
 * Place a multi-vendor order: one `orders` row as the customer-facing payment
 * envelope, plus one `sub_orders` row per vendor as the unit of fulfilment.
 *
 * All figures are recomputed server-side from `splitCart` — the client's
 * posted prices are never trusted. Nothing is written to the vendor ledger
 * here; money posts on delivery (see `postSaleOnDelivery`), because under COD
 * the cash isn't collected until the courier hands it over.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const { tenantId, items, address, paymentMethod, customerId, notes } = input;

  if (!address?.phone?.trim()) throw new Error("Phone number is required");
  if (!address?.name?.trim()) throw new Error("Name is required");
  if (!address?.address?.trim()) throw new Error("Delivery address is required");

  const { result, products, rate } = await splitCart(tenantId, items, address.area);
  if (!result.groups.length) throw new Error("Cart is empty");

  const admin = await createAdminClient();
  const orderNumber = `SK-${Date.now().toString(36).toUpperCase()}`;
  const isCod = paymentMethod === "cod";

  const shippingAddress = {
    name: address.name.trim(),
    phone: address.phone.trim(),
    email: address.email?.trim() || null,
    address: address.address.trim(),
    area: address.area?.trim() || null,
    city: address.city?.trim() || null,
    note: address.note?.trim() || null,
  };

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      tenant_id: tenantId,
      order_number: orderNumber,
      customer_id: customerId ?? null,
      customer_email: address.email?.trim() || `${address.phone.trim()}@nomail.local`,
      customer_name: address.name.trim(),
      status: "pending",
      // COD is unpaid until the courier remits; bKash is confirmed by its
      // own callback, so neither method starts life as paid.
      payment_status: "pending",
      payment_method: paymentMethod,
      items: result.groups.flatMap((g) => g.items),
      billing_address: shippingAddress,
      shipping_address: shippingAddress,
      subtotal: result.subtotal,
      discount: result.discount_total,
      shipping_cost: result.shipping_total,
      tax: 0,
      total: result.grand_total,
      notes: notes?.trim() || null,
    })
    .select("id, order_number")
    .single();

  if (orderErr || !order) throw new Error(orderErr?.message ?? "Could not create order");

  const subRows = result.groups.map((g) => ({
    tenant_id: tenantId,
    order_id: order.id,
    vendor_id: g.vendor_id,
    sub_order_number: `${orderNumber}-${g.vendor_id.slice(0, 4).toUpperCase()}`,
    status: "pending" as const,
    items: g.items,
    subtotal: g.subtotal,
    shipping_cost: g.shipping_cost,
    discount: g.discount,
    total: g.total,
    commission_rate: g.commission_rate,
    commission_amount: g.commission_amount,
    vendor_earning: g.vendor_earning,
    cod_amount: isCod ? g.total : 0,
    cod_collected: false,
  }));

  const { data: subs, error: subErr } = await admin
    .from("sub_orders")
    .insert(subRows)
    .select("id, sub_order_number, vendor_id, total");

  if (subErr) {
    // Without sub-orders the parent order is unfulfillable — no vendor would
    // ever see it. Roll it back rather than leaving an orphan in the list.
    await admin.from("orders").delete().eq("id", order.id);
    throw new Error(`Could not create vendor orders: ${subErr.message}`);
  }

  // Reserve stock once the order is committed.
  for (const g of result.groups) {
    for (const item of g.items) {
      const p = products.find((x) => x.id === item.product_id);
      if (!p?.track_inventory) continue;
      await admin
        .from("products")
        .update({
          stock_quantity: Math.max(0, (p.stock_quantity ?? 0) - item.quantity),
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);
    }
  }

  const nameByVendor = new Map(result.groups.map((g) => [g.vendor_id, g.vendor_name]));

  return {
    order_id: order.id,
    order_number: order.order_number,
    total: money(result.grand_total),
    sub_orders: (subs ?? []).map((s) => ({
      id: s.id,
      sub_order_number: s.sub_order_number,
      vendor_name: nameByVendor.get(s.vendor_id) ?? "Seller",
      total: Number(s.total),
    })),
  };
}

export { rateForArea } from "./split-order";

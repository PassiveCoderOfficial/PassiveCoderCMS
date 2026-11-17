import "server-only";
import type { createAdminClient } from "@/lib/supabase/server";
import { postSaleOnDelivery } from "@/modules/registry/marketplace/on-delivered";
import { afterDelivered } from "@/modules/registry/marketplace/on-delivered";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

/** Fulfilment moves forward only. Letting a parcel walk back from
 *  `delivered` would unpost ledger money already counted toward a payout. */
export const FLOW: Record<string, string[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["packed", "shipped", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: [],
  cancelled: [],
  returned: [],
};

export const SUB_FIELDS =
  "id, tenant_id, order_id, vendor_id, sub_order_number, status, subtotal, discount, commission_amount, cod_amount, items, money_holder, courier, courier_account_id, awaiting_payment";

export interface SubForTransition {
  id: string;
  tenant_id: string;
  order_id: string;
  vendor_id: string;
  sub_order_number: string;
  status: string;
  subtotal: number | string;
  discount: number | string | null;
  commission_amount: number | string;
  cod_amount: number | string;
  items: unknown;
  money_holder?: string | null;
  /** Online order not paid yet: the seller must not act on it. */
  awaiting_payment?: boolean | null;
}

/**
 * Move a sub-order to `to` (if FLOW allows, unless `force` for courier
 * events that skip steps, e.g. accepted -> delivered) and run the side
 * effects: delivered posts the ledger exactly once and marks COD collected;
 * cancelled/returned put the stock back. `extra` is merged into the update.
 * Returns the error text, or null.
 */
export async function transitionSubOrder(
  admin: Admin,
  sub: SubForTransition,
  to: string | null,
  opts: { origin: string; extra?: Record<string, unknown>; cancelReason?: string | null; force?: boolean },
): Promise<string | null> {
  const patch: Record<string, unknown> = { ...(opts.extra ?? {}) };
  const moving = !!to && to !== sub.status;
  if (moving && sub.awaiting_payment) return "This order is waiting for the customer's online payment";
  if (moving) {
    if (!opts.force && !FLOW[sub.status]?.includes(to!)) return `Cannot move order from ${sub.status} to ${to}`;
    if (["delivered", "cancelled", "returned"].includes(sub.status)) return `This order is already ${sub.status}`;
    const now = new Date().toISOString();
    patch.status = to;
    if (to === "accepted") patch.accepted_at = now;
    if (to === "shipped") patch.shipped_at = now;
    if (to === "delivered") {
      patch.delivered_at = now;
      if (Number(sub.cod_amount) > 0) patch.cod_collected = true;
    }
    if (to === "cancelled") patch.cancel_reason = opts.cancelReason || null;
  }
  if (!Object.keys(patch).length) return null;

  // Guard on the old status so two webhooks racing can't both deliver.
  let q = admin.from("sub_orders").update(patch).eq("id", sub.id);
  if (moving) q = q.eq("status", sub.status);
  const { data: rows, error } = await q.select("id");
  if (error) return error.message;
  if (moving && !rows?.length) return null; // someone else moved it first

  if (moving && to === "delivered") {
    const { data: rate } = await admin
      .from("shipping_rates")
      .select("cod_fee_pct")
      .eq("tenant_id", sub.tenant_id)
      .eq("is_default", true)
      .maybeSingle();
    // Extra fields (money_holder) ride along for ledger versions that read them.
    const ledgerSub = {
      id: sub.id,
      vendor_id: sub.vendor_id,
      sub_order_number: sub.sub_order_number,
      subtotal: Number(sub.subtotal),
      discount: Number(sub.discount ?? 0),
      commission_amount: Number(sub.commission_amount),
      cod_amount: Number(sub.cod_amount),
      // undefined lets the ledger read it from the row.
      money_holder: (sub.money_holder ?? undefined) as "platform" | "vendor" | null | undefined,
    };
    await postSaleOnDelivery(admin, sub.tenant_id, ledgerSub, Number(rate?.cod_fee_pct ?? 0));
    await afterDelivered(admin, sub, opts.origin);
  }

  // A cancelled or returned parcel's items never reached the buyer.
  if (moving && (to === "cancelled" || to === "returned")) {
    const items = (sub.items ?? []) as { product_id: string; variant_id?: string; quantity: number }[];
    for (const item of items) {
      if (item.variant_id) {
        const { data: v } = await admin.from("product_variants").select("stock_quantity").eq("id", item.variant_id).maybeSingle();
        if (v) await admin.from("product_variants").update({ stock_quantity: (v.stock_quantity ?? 0) + item.quantity }).eq("id", item.variant_id);
        continue;
      }
      const { data: p } = await admin.from("products").select("id, stock_quantity, track_inventory").eq("id", item.product_id).maybeSingle();
      if (!p?.track_inventory) continue;
      await admin.from("products").update({ stock_quantity: (p.stock_quantity ?? 0) + item.quantity }).eq("id", p.id);
    }
  }
  return null;
}

export function requestOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

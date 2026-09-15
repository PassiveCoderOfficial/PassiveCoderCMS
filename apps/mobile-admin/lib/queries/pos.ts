// POS ring-up — the ONE restaurant-vertical write that genuinely needs the
// server route (cms/src/app/api/ecommerce/pos), not a direct Supabase
// write: it decrements stock, posts an accounting transaction, and
// optionally upserts a CRM contact — real side effects that must run
// server-side, not be reproduced client-side.

import { apiFetch } from "../api";
import { supabase } from "../supabase";

export interface CartLine {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

/** Local-only grouping id for a split bill's sub-orders — not a security
 *  token, just needs to be unique enough to tie N orders together in
 *  Orders history (matches split_group_id's actual use on the web).
 *  global.crypto.randomUUID isn't reliably present in the Hermes/RN
 *  runtime across Expo SDK versions, so this avoids depending on it. */
function localGroupId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface PosCheckoutResult {
  ok: boolean;
  orderId?: string;
  orderNumber?: string;
  total?: number;
  error?: string;
}

export interface PosProduct {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number | null;
  track_inventory: boolean;
}

export async function getProducts(tenantId: string): Promise<PosProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, price, stock_quantity, track_inventory")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function ringUpSale(
  tenantId: string,
  input: {
    items: CartLine[];
    discount: number;
    payment_method: string;
    customer_name?: string;
    customer_phone?: string;
    branch_id?: string;
    table_id?: string;
    split_group_id?: string;
    split_label?: string;
  },
): Promise<PosCheckoutResult> {
  const res = await apiFetch<{ orderId: string; orderNumber: string; total: number; error?: string }>(
    "/api/ecommerce/pos",
    { method: "POST", body: input, tenantId },
  );
  if (!res.ok) return { ok: false, error: res.data.error ?? `Sale failed (${res.status})` };
  return { ok: true, orderId: res.data.orderId, orderNumber: res.data.orderNumber, total: res.data.total };
}

export interface SplitSeat { items: CartLine[]; discount: number }

export interface SplitCheckoutResult {
  ok: boolean;
  seatsCharged: number;
  lastOrderNumber?: string;
  lastTotal?: number;
  error?: string;
}

/** Same "one order per non-empty seat" flow as the web's checkoutSplit —
 *  fires sequentially (not parallel) so a mid-split failure is reported
 *  against a known "N seats already went through" count, not an ambiguous
 *  partial-success race. */
export async function ringUpSplitSale(
  tenantId: string,
  seats: SplitSeat[],
  common: { payment_method: string; customer_name?: string; branch_id?: string; table_id?: string },
): Promise<SplitCheckoutResult> {
  const nonEmpty = seats.filter((s) => s.items.length > 0);
  if (nonEmpty.length < 2) return { ok: false, seatsCharged: 0, error: "Assign items to at least 2 seats to split the bill." };

  const groupId = localGroupId();
  let lastOrderNumber: string | undefined;
  let lastTotal: number | undefined;

  for (let i = 0; i < nonEmpty.length; i++) {
    const seat = nonEmpty[i];
    const res = await ringUpSale(tenantId, {
      ...common,
      items: seat.items,
      discount: seat.discount,
      split_group_id: groupId,
      split_label: `Seat ${i + 1} of ${nonEmpty.length}`,
    });
    if (!res.ok) return { ok: false, seatsCharged: i, error: res.error ?? "One of the split bills failed to save — check Orders before re-ringing anything, some seats may have already gone through." };
    lastOrderNumber = res.orderNumber;
    lastTotal = res.total;
  }

  return { ok: true, seatsCharged: nonEmpty.length, lastOrderNumber, lastTotal };
}

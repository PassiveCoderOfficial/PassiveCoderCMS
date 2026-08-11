import type { SupabaseClient } from "@supabase/supabase-js";
import { money } from "./split-order";

export interface EligibleSubOrder {
  id: string;
  sub_order_number: string;
  subtotal: number;
  discount: number;
  commission_amount: number;
  vendor_earning: number;
  delivered_at: string;
}

export interface PayableTotals {
  gross: number;
  commission: number;
  /** Other ledger debits tied to these orders — COD collection fees, refunds,
   *  adjustments. Positive number representing an amount withheld. */
  deductions: number;
  net: number;
}

/**
 * What a vendor is actually owed for a set of delivered sub-orders.
 *
 * Derived from the ledger rather than from `sub_orders.vendor_earning`, because
 * vendor_earning only knows about subtotal minus commission. Real deductions —
 * COD collection fees above all — are posted to the ledger on delivery, and a
 * payout built from vendor_earning alone overpays by exactly those fees,
 * leaving the vendor with a permanent negative balance that no later payout
 * ever clears.
 */
export async function payableForSubOrders(
  db: SupabaseClient,
  subOrders: EligibleSubOrder[],
): Promise<PayableTotals> {
  const gross = money(
    subOrders.reduce((s, r) => s + Number(r.subtotal) - Number(r.discount ?? 0), 0),
  );
  const commission = money(subOrders.reduce((s, r) => s + Number(r.commission_amount), 0));

  if (!subOrders.length) return { gross: 0, commission: 0, deductions: 0, net: 0 };

  const { data: entries } = await db
    .from("vendor_ledger")
    .select("type, amount, sub_order_id")
    .in(
      "sub_order_id",
      subOrders.map((s) => s.id),
    );

  // `sale` and `commission` are already represented by gross/commission above;
  // everything else posted against these orders is an additional deduction.
  const deductions = money(
    (entries ?? [])
      .filter((e) => e.type !== "sale" && e.type !== "commission" && e.type !== "payout")
      .reduce((s, e) => s + Number(e.amount), 0),
  );

  return {
    gross,
    commission,
    deductions: money(Math.abs(deductions)),
    net: money(gross - commission + deductions),
  };
}

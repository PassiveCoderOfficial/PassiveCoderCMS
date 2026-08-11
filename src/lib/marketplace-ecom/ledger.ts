import type { SupabaseClient } from "@supabase/supabase-js";
import { money } from "./split-order";

export type LedgerType =
  | "sale"
  | "commission"
  | "cod_fee"
  | "refund"
  | "return"
  | "adjustment"
  | "payout";

export interface LedgerEntry {
  type: LedgerType;
  amount: number; // signed — credits positive, debits negative
  sub_order_id?: string | null;
  payout_id?: string | null;
  note?: string;
}

/** Current balance owed to a vendor, taken from the newest ledger row.
 *  balance_after is carried forward rather than re-summed on every read so a
 *  vendor's balance stays O(1) to fetch as their history grows.
 *
 *  Ordered by `seq`, not `created_at`: a sale and its commission are inserted
 *  in one statement and share a timestamp to the microsecond, so ordering by
 *  time alone can return the pre-commission row and overstate the balance. */
export async function vendorBalance(
  db: SupabaseClient,
  vendorId: string,
): Promise<number> {
  const { data } = await db
    .from("vendor_ledger")
    .select("balance_after")
    .eq("vendor_id", vendorId)
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();
  return Number(data?.balance_after ?? 0);
}

/**
 * Append entries to a vendor's ledger, carrying the running balance forward.
 *
 * Written with the service role only. Entries are appended in the order given
 * so a sale and its commission land as an auditable pair rather than a single
 * net figure — "what did we charge this vendor and why" has to stay answerable
 * months later when a payout is disputed.
 */
export async function appendLedger(
  db: SupabaseClient,
  tenantId: string,
  vendorId: string,
  entries: LedgerEntry[],
): Promise<number> {
  if (!entries.length) return vendorBalance(db, vendorId);

  let balance = await vendorBalance(db, vendorId);
  const rows = entries.map((e) => {
    balance = money(balance + e.amount);
    return {
      tenant_id: tenantId,
      vendor_id: vendorId,
      sub_order_id: e.sub_order_id ?? null,
      payout_id: e.payout_id ?? null,
      type: e.type,
      amount: money(e.amount),
      balance_after: balance,
      note: e.note ?? null,
    };
  });

  const { error } = await db.from("vendor_ledger").insert(rows);
  if (error) throw new Error(`Ledger write failed: ${error.message}`);
  return balance;
}

/**
 * Post the money events for a delivered sub-order.
 *
 * Deliberately runs on delivery, not on order placement: under COD nothing is
 * actually collected until the courier hands over the cash, so crediting a
 * vendor at checkout would show them a balance for parcels that may still be
 * refused at the door. Cancelled and returned parcels therefore never reach
 * the ledger at all.
 */
export async function postSaleOnDelivery(
  db: SupabaseClient,
  tenantId: string,
  sub: {
    id: string;
    vendor_id: string;
    sub_order_number: string;
    subtotal: number;
    discount: number;
    commission_amount: number;
    cod_amount: number;
  },
  codFeePct = 0,
): Promise<number> {
  const { data: existing } = await db
    .from("vendor_ledger")
    .select("id")
    .eq("sub_order_id", sub.id)
    .eq("type", "sale")
    .maybeSingle();
  // Status can be re-saved by staff; the sale must post exactly once.
  if (existing) return vendorBalance(db, sub.vendor_id);

  const entries: LedgerEntry[] = [
    {
      type: "sale",
      amount: money(sub.subtotal - sub.discount),
      sub_order_id: sub.id,
      note: `Sale ${sub.sub_order_number}`,
    },
    {
      type: "commission",
      amount: -money(sub.commission_amount),
      sub_order_id: sub.id,
      note: `Platform commission ${sub.sub_order_number}`,
    },
  ];

  // COD carries a courier collection fee the platform pays and passes on.
  if (sub.cod_amount > 0 && codFeePct > 0) {
    entries.push({
      type: "cod_fee",
      amount: -money(sub.cod_amount * (codFeePct / 100)),
      sub_order_id: sub.id,
      note: `COD collection fee ${sub.sub_order_number}`,
    });
  }

  return appendLedger(db, tenantId, sub.vendor_id, entries);
}

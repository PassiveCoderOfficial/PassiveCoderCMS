import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { teamAccess } from "@/lib/team/access";
import { appendLedger } from "@/lib/marketplace-ecom/ledger";
import { money } from "@/lib/marketplace-ecom/split-order";
import { payableForSubOrders, type EligibleSubOrder } from "@/lib/marketplace-ecom/payout-math";

export async function GET(req: NextRequest) {
  // Seller payouts and bKash numbers: site owner/admin (or super admin / assigned staff) only.
  const access = await teamAccess();
  if (!access?.manage) return NextResponse.json({ error: "Only the site owner or an admin can manage payouts." }, { status: 403 });
  const tenantId = access.tenantId;

  const { searchParams } = new URL(req.url);
  const admin = await createAdminClient();

  // ?preview=1 — what is currently payable, without writing anything.
  if (searchParams.get("preview")) {
    const { data: vendors } = await admin
      .from("vendors")
      .select("id, name, bkash_number, payout_hold_days")
      .eq("tenant_id", tenantId)
      .contains("capabilities", ["ecommerce"])
      .eq("status", "approved");

    const preview = [];
    for (const v of vendors ?? []) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (v.payout_hold_days ?? 7));

      // Only delivered parcels past the return-window hold, not already
      // attached to a payout, are eligible.
      const { data: subs } = await admin
        .from("sub_orders")
        .select("id, sub_order_number, subtotal, discount, commission_amount, vendor_earning, delivered_at")
        .eq("tenant_id", tenantId)
        .eq("vendor_id", v.id)
        .eq("status", "delivered")
        .is("payout_id", null)
        .lte("delivered_at", cutoff.toISOString());

      const rows = (subs ?? []) as EligibleSubOrder[];
      if (!rows.length) continue;
      const totals = await payableForSubOrders(admin, rows);
      preview.push({
        vendor_id: v.id,
        vendor_name: v.name,
        bkash_number: v.bkash_number,
        hold_days: v.payout_hold_days ?? 7,
        sub_order_count: rows.length,
        ...totals,
        sub_orders: rows.map((r) => r.sub_order_number),
      });
    }
    return NextResponse.json(preview);
  }

  const { data, error } = await admin
    .from("vendor_payouts")
    .select("*, vendors(name, bkash_number)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

/** Create a payout for one vendor covering their eligible delivered orders. */
export async function POST(req: NextRequest) {
  // Seller payouts and bKash numbers: site owner/admin (or super admin / assigned staff) only.
  const access = await teamAccess();
  if (!access?.manage) return NextResponse.json({ error: "Only the site owner or an admin can manage payouts." }, { status: 403 });
  const tenantId = access.tenantId;

  const body = await req.json();
  const vendorId = body.vendor_id;
  if (!vendorId) return NextResponse.json({ error: "vendor_id required" }, { status: 400 });

  const admin = await createAdminClient();
  const { data: vendor } = await admin
    .from("vendors")
    .select("id, name, payout_hold_days")
    .eq("id", vendorId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (vendor.payout_hold_days ?? 7));

  const { data: subs } = await admin
    .from("sub_orders")
    .select("id, subtotal, discount, commission_amount, vendor_earning, delivered_at")
    .eq("tenant_id", tenantId)
    .eq("vendor_id", vendorId)
    .eq("status", "delivered")
    .is("payout_id", null)
    .lte("delivered_at", cutoff.toISOString());

  const rows = subs ?? [];
  if (!rows.length) {
    return NextResponse.json({ error: "Nothing eligible to pay out yet" }, { status: 400 });
  }

  const { gross, commission, deductions, net } = await payableForSubOrders(
    admin,
    rows as EligibleSubOrder[],
  );
  const dates = rows.map((r) => new Date(r.delivered_at as string).getTime());

  const { data: payout, error } = await admin
    .from("vendor_payouts")
    .insert({
      tenant_id: tenantId,
      vendor_id: vendorId,
      period_start: new Date(Math.min(...dates)).toISOString().slice(0, 10),
      period_end: new Date(Math.max(...dates)).toISOString().slice(0, 10),
      gross,
      commission,
      // COD fees and any other ledger debits raised against these orders.
      adjustments: -deductions,
      net,
      method: body.method === "bank" ? "bank" : "bkash",
      status: "pending",
      notes: body.notes?.trim() || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Claim the sub-orders, but only ones still unclaimed. Two payout runs at
  // the same moment both read the same eligible orders; whichever claims
  // second gets fewer rows back, so its payout is withdrawn instead of
  // paying the seller twice.
  const { data: claimed } = await admin
    .from("sub_orders")
    .update({ payout_id: payout.id })
    .in("id", rows.map((r) => r.id))
    .is("payout_id", null)
    .select("id");
  if ((claimed?.length ?? 0) !== rows.length) {
    await admin.from("sub_orders").update({ payout_id: null }).eq("payout_id", payout.id);
    await admin.from("vendor_payouts").delete().eq("id", payout.id);
    return NextResponse.json({ error: "Another payout for this seller was created at the same time. Refresh and check." }, { status: 409 });
  }

  return NextResponse.json({ ...payout, sub_order_count: rows.length });
}

/** Mark a payout paid — this is the point the money actually leaves. */
export async function PATCH(req: NextRequest) {
  // Seller payouts and bKash numbers: site owner/admin (or super admin / assigned staff) only.
  const access = await teamAccess();
  if (!access?.manage) return NextResponse.json({ error: "Only the site owner or an admin can manage payouts." }, { status: 403 });
  const tenantId = access.tenantId;

  const { id, status, reference, notes } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = await createAdminClient();
  const { data: payout } = await admin
    .from("vendor_payouts")
    .select("id, tenant_id, vendor_id, net, status")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!payout) return NextResponse.json({ error: "Payout not found" }, { status: 404 });

  // Allowed moves: pending -> paid, pending -> failed. A failed payout has
  // released its orders to the next run, so it can never become paid; a paid
  // one can't be undone here (money has left).
  if (status && status !== payout.status) {
    if (!["paid", "failed"].includes(status)) return NextResponse.json({ error: "Status must be paid or failed" }, { status: 400 });
    if (payout.status !== "pending") return NextResponse.json({ error: `This payout is already ${payout.status}.` }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (reference !== undefined) patch.reference = reference || null;
  if (notes !== undefined) patch.notes = notes || null;
  const transition = status && status !== payout.status ? status : null;
  if (transition) patch.status = transition;
  if (transition === "paid") patch.paid_at = new Date().toISOString();

  // Conditional on the status we read, so two "mark paid" clicks at once
  // can't both post the ledger debit.
  let q = admin.from("vendor_payouts").update(patch).eq("id", id).eq("tenant_id", tenantId);
  if (transition) q = q.eq("status", payout.status);
  const { data, error } = await q.select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "This payout was just changed by someone else. Refresh and check." }, { status: 409 });

  if (transition === "paid") {
    await appendLedger(admin, tenantId, payout.vendor_id, [
      {
        type: "payout",
        amount: -money(Number(payout.net)),
        payout_id: payout.id,
        note: `Payout ${reference || payout.id.slice(0, 8)}`,
      },
    ]);
  }

  // Releasing a failed payout lets its orders be picked up by the next run.
  if (transition === "failed") {
    await admin.from("sub_orders").update({ payout_id: null }).eq("payout_id", id);
  }

  return NextResponse.json(data);
}

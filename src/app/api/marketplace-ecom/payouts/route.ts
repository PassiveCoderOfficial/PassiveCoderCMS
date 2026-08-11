import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { appendLedger } from "@/lib/marketplace-ecom/ledger";
import { money } from "@/lib/marketplace-ecom/split-order";
import { payableForSubOrders, type EligibleSubOrder } from "@/lib/marketplace-ecom/payout-math";

export async function GET(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // Claim the sub-orders so a second run can never pay them twice.
  await admin
    .from("sub_orders")
    .update({ payout_id: payout.id })
    .in("id", rows.map((r) => r.id));

  return NextResponse.json({ ...payout, sub_order_count: rows.length });
}

/** Mark a payout paid — this is the point the money actually leaves. */
export async function PATCH(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const patch: Record<string, unknown> = {};
  if (reference !== undefined) patch.reference = reference || null;
  if (notes !== undefined) patch.notes = notes || null;
  if (status) patch.status = status;
  if (status === "paid") patch.paid_at = new Date().toISOString();

  const { data, error } = await admin
    .from("vendor_payouts")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // The debit posts only on the transition into `paid`, so re-saving a
  // reference number on an already-paid payout can't double-debit.
  if (status === "paid" && payout.status !== "paid") {
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
  if (status === "failed") {
    await admin.from("sub_orders").update({ payout_id: null }).eq("payout_id", id);
  }

  return NextResponse.json(data);
}

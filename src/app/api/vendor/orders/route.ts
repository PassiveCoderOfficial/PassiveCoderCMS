import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentVendor } from "@/lib/marketplace-ecom/vendor-auth";
import { postSaleOnDelivery } from "@/lib/marketplace-ecom/ledger";

/** Fulfilment moves forward only. Letting a vendor walk a parcel back from
 *  `delivered` would unpost ledger money that has already been counted
 *  toward a payout. */
const FLOW: Record<string, string[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: [],
  cancelled: [],
  returned: [],
};

export async function GET(req: NextRequest) {
  const vendor = await currentVendor();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const admin = await createAdminClient();
  let query = admin
    .from("sub_orders")
    .select(
      "id, sub_order_number, status, items, subtotal, shipping_cost, total, commission_amount, vendor_earning, cod_amount, cod_collected, courier, tracking_number, created_at, delivered_at, orders(order_number, shipping_address, payment_method)",
    )
    .eq("vendor_id", vendor.vendor_id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const vendor = await currentVendor();
  if (!vendor) return NextResponse.json({ error: "Not a vendor" }, { status: 403 });

  const body = await req.json();
  const { id, status, courier, tracking_number, cancel_reason } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = await createAdminClient();
  const { data: sub } = await admin
    .from("sub_orders")
    .select(
      "id, tenant_id, vendor_id, sub_order_number, status, subtotal, discount, commission_amount, cod_amount, items",
    )
    .eq("id", id)
    .eq("vendor_id", vendor.vendor_id)
    .maybeSingle();
  if (!sub) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (courier !== undefined) patch.courier = courier || null;
  if (tracking_number !== undefined) patch.tracking_number = tracking_number || null;

  if (status && status !== sub.status) {
    if (!FLOW[sub.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot move order from ${sub.status} to ${status}` },
        { status: 400 },
      );
    }
    patch.status = status;
    if (status === "accepted") patch.accepted_at = new Date().toISOString();
    if (status === "shipped") patch.shipped_at = new Date().toISOString();
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    if (status === "cancelled") patch.cancel_reason = cancel_reason || null;
  }

  if (!Object.keys(patch).length) return NextResponse.json({ ok: true });

  const { data: updated, error } = await admin
    .from("sub_orders")
    .update(patch)
    .eq("id", id)
    .eq("vendor_id", vendor.vendor_id)
    .select("id, status")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (patch.status === "delivered") {
    const { data: rate } = await admin
      .from("shipping_rates")
      .select("cod_fee_pct")
      .eq("tenant_id", sub.tenant_id)
      .eq("is_default", true)
      .maybeSingle();
    await postSaleOnDelivery(
      admin,
      sub.tenant_id,
      {
        id: sub.id,
        vendor_id: sub.vendor_id,
        sub_order_number: sub.sub_order_number,
        subtotal: Number(sub.subtotal),
        discount: Number(sub.discount ?? 0),
        commission_amount: Number(sub.commission_amount),
        cod_amount: Number(sub.cod_amount),
      },
      Number(rate?.cod_fee_pct ?? 0),
    );
  }

  // Returning stock on a cancelled parcel keeps the catalogue honest — the
  // items never left the vendor.
  if (patch.status === "cancelled" || patch.status === "returned") {
    const items = (sub.items ?? []) as { product_id: string; quantity: number }[];
    for (const item of items) {
      const { data: p } = await admin
        .from("products")
        .select("id, stock_quantity, track_inventory")
        .eq("id", item.product_id)
        .maybeSingle();
      if (!p?.track_inventory) continue;
      await admin
        .from("products")
        .update({ stock_quantity: (p.stock_quantity ?? 0) + item.quantity })
        .eq("id", p.id);
    }
  }

  return NextResponse.json(updated);
}

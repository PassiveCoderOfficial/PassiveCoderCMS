import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

const VALID_STATUS = ["assigned", "picked_up", "delivered"];

/**
 * Assign a rider to a delivery order (sets rider_id + delivery_status
 * 'assigned'), or advance an already-assigned order's delivery_status.
 * One route for both since assigning implicitly starts the status
 * pipeline — a caller never needs to set rider_id without a status.
 */
export async function POST(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { order_id, rider_id, delivery_status } = await req.json();
  if (!order_id) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const admin = await createAdminClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (rider_id !== undefined) {
    if (rider_id) {
      // The rider must belong to the same branch as the order — a rider
      // from one branch shouldn't be assignable to another branch's
      // delivery, since riders are scoped per-branch (locked decision).
      const { data: order } = await admin.from("orders").select("branch_id").eq("id", order_id).eq("tenant_id", tenantId).maybeSingle();
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      const { data: rider } = await admin.from("restaurant_riders").select("id").eq("id", rider_id).eq("branch_id", order.branch_id).maybeSingle();
      if (!rider) return NextResponse.json({ error: "Rider not found for this branch" }, { status: 400 });
    }
    patch.rider_id = rider_id || null;
    patch.delivery_status = rider_id ? "assigned" : null;
  }

  if (delivery_status !== undefined) {
    if (!VALID_STATUS.includes(delivery_status)) {
      return NextResponse.json({ error: "Invalid delivery_status" }, { status: 400 });
    }
    patch.delivery_status = delivery_status;
  }

  const { data, error } = await admin
    .from("orders")
    .update(patch)
    .eq("id", order_id)
    .eq("tenant_id", tenantId)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

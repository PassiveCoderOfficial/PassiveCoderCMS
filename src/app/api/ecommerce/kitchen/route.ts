import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { requireModule } from "@/lib/modules/resolve-modules";

// Fulfillment-aware vocabulary (migration 092, docs/business/06-restaurant-vertical.md):
// dine-in ends at "served", pickup ends at "picked_up", delivery hands off to
// delivery_status at "ready_to_pick" and is marked "completed" once that
// reaches "delivered" — see TERMINAL below for which of these end the order.
const VALID = ["pending", "cooking", "ready", "served", "ready_to_pick", "picked_up", "completed"];

// Terminal kitchen_status values per fulfillment type — an order in one of
// these no longer belongs on the live kitchen board.
const TERMINAL = ["served", "picked_up", "completed"];

/**
 * Poll target for the kitchen board — same shape and filter as the server
 * page's initial load, so the client can just diff two identically-shaped
 * arrays to notice a new order rather than reconciling different fields.
 */
export async function GET() {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireModule(tenantId, "pos"))) {
    return NextResponse.json({ error: "Kitchen is not available on your plan" }, { status: 403 });
  }

  const admin = await createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, items, branch_id, table_id, kitchen_status, fulfillment_type, customer_name, created_at, rider_id, delivery_status, restaurant_tables(table_number)")
    .eq("tenant_id", tenantId)
    .not("kitchen_status", "is", null)
    .not("kitchen_status", "in", `(${TERMINAL.join(",")})`)
    .order("created_at", { ascending: true });

  return NextResponse.json({ orders: orders ?? [] });
}

/** Advance (or move back) one order's kitchen_status. Staff-only, tenant-scoped. */
export async function POST(req: NextRequest) {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireModule(tenantId, "pos"))) {
    return NextResponse.json({ error: "Kitchen is not available on your plan" }, { status: 403 });
  }

  const { order_id, kitchen_status } = await req.json();
  if (!order_id || !VALID.includes(kitchen_status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = await createAdminClient();
  // Scoped by tenant_id in the same update, not a separate read-then-write —
  // closes the gap where a staff session for tenant A could otherwise guess
  // an order id belonging to tenant B and flip its status.
  const { data, error } = await admin
    .from("orders")
    .update({ kitchen_status, updated_at: new Date().toISOString() })
    .eq("id", order_id)
    .eq("tenant_id", tenantId)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

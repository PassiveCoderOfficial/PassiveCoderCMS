import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const VALID_STATUS = ["picked_up", "delivered"];

/** GET: this rider's currently-assigned (not yet delivered) deliveries. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const admin = await createAdminClient();
  const { data: rider } = await admin
    .from("restaurant_riders")
    .select("id, is_active, restaurant_branches!inner(tenant_id)")
    .eq("rider_token", token)
    .maybeSingle();

  if (!rider || !rider.is_active) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Narrow columns — a rider sees enough to find and deliver an order
  // (customer name, address if we had one, item count), never the tenant's
  // wider order data.
  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, customer_name, billing_address, items, delivery_status, created_at")
    .eq("rider_id", rider.id)
    .not("delivery_status", "eq", "delivered")
    .order("created_at", { ascending: true });

  return NextResponse.json({ orders: orders ?? [] });
}

/**
 * POST: two things a rider's own device does, told apart by which fields
 * are present rather than a separate route — both are "this rider, right
 * now, tell us something" and share the same token lookup + not-found
 * handling, not worth splitting into two files for.
 *   { order_id, delivery_status } -> advance an order (picked_up -> delivered)
 *   { lat, lng }                  -> live GPS ping (Tier 3, migration 098)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();

  const admin = await createAdminClient();
  const { data: rider } = await admin
    .from("restaurant_riders")
    .select("id, is_active")
    .eq("rider_token", token)
    .maybeSingle();

  if (!rider || !rider.is_active) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (typeof body.lat === "number" && typeof body.lng === "number") {
    // No rate limiting here beyond what the client itself paces (rider-app.tsx
    // posts on its own interval, not on every raw Geolocation callback) —
    // one rider's own device, a low-value target, not worth the complexity
    // of a server-side throttle for this.
    const { error } = await admin
      .from("restaurant_riders")
      .update({ last_lat: body.lat, last_lng: body.lng, last_location_at: new Date().toISOString() })
      .eq("id", rider.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const { order_id, delivery_status } = body;
  if (!order_id || !VALID_STATUS.includes(delivery_status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // .eq("rider_id", rider.id) in the same update is the whole access
  // control here — a rider can only ever advance an order actually
  // assigned to them, token alone can't touch someone else's delivery.
  const { data, error } = await admin
    .from("orders")
    .update({ delivery_status, updated_at: new Date().toISOString() })
    .eq("id", order_id)
    .eq("rider_id", rider.id)
    .select("id, tenant_id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Mirrors advanceDelivery's own kitchen_status completion in
  // kitchen-client.tsx — delivered is the actual end of this order's life,
  // same "mark kitchen_status completed too" step whichever side triggers it.
  if (delivery_status === "delivered") {
    await admin.from("orders").update({ kitchen_status: "completed" }).eq("id", order_id);
  }

  return NextResponse.json({ ok: true });
}

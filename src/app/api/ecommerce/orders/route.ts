import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CartItem, Address } from "@/types/cms";
import { upsertContact } from "@/lib/crm/upsertContact";

type BillingAddress = Address & { email: string; phone?: string };

interface OrderPayload {
  items: CartItem[];
  billing_address: BillingAddress;
  payment_method: string;
  notes?: string;
  /** Restaurant pickup/delivery support (2026-09-12) — defaults to
   *  "delivery" so every existing caller is unaffected. "dine_in" added for
   *  the restaurant vertical (docs/business/06-restaurant-vertical.md). */
  fulfillment_type?: "delivery" | "pickup" | "dine_in";
  pickup_time?: string;
  /** dine_in only: the qr_token printed on the table, never the raw table
   *  id — resolved server-side below so a client can't address an
   *  arbitrary table_id it was never shown. */
  table_qr_token?: string;
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get("x-tenant-id");
    const body: OrderPayload = await req.json();

    const { items, billing_address, payment_method, notes, fulfillment_type, pickup_time, table_qr_token } = body;
    const isDineIn = fulfillment_type === "dine_in";

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!billing_address?.email) {
      return NextResponse.json({ error: "Billing address required" }, { status: 400 });
    }
    // Dine-in has no address to give — the customer is at the table the QR
    // code was printed on, which the token below identifies server-side.
    if (isDineIn && !table_qr_token) {
      return NextResponse.json({ error: "Missing table" }, { status: 400 });
    }

    const supabase = await createClient();

    // Resolve the table from its qr_token, never trust a client-sent table
    // id directly — the token is the only thing the customer actually saw
    // (printed on the table), so it's the only thing that should carry
    // authority here. Also recovers branch_id from the table's own branch,
    // rather than trusting a client-sent branch_id that could be swapped
    // for a different tenant's branch.
    let branchId: string | null = null;
    let tableId: string | null = null;
    if (isDineIn) {
      const { data: table } = await supabase
        .from("restaurant_tables")
        .select("id, branch_id, is_active, restaurant_branches!inner(tenant_id, is_active)")
        .eq("qr_token", table_qr_token)
        .maybeSingle();
      const branch = (table as unknown as { restaurant_branches?: { tenant_id: string; is_active: boolean } } | null)
        ?.restaurant_branches;
      if (!table || !table.is_active || !branch?.is_active || (tenantId && branch.tenant_id !== tenantId)) {
        return NextResponse.json({ error: "Table not found" }, { status: 400 });
      }
      tableId = table.id;
      branchId = table.branch_id;
    }

    // Verify products still active + get current prices
    const productIds = [...new Set(items.map((i) => i.product_id))];
    let pQuery = supabase
      .from("products")
      .select("id, name, price, stock_quantity, status, track_inventory")
      .in("id", productIds)
      .eq("status", "active");
    if (tenantId) pQuery = pQuery.eq("tenant_id", tenantId);
    const { data: dbProducts } = await pQuery;

    if (!dbProducts?.length) {
      return NextResponse.json({ error: "Products not found or unavailable" }, { status: 400 });
    }

    // Recalculate with server prices (trust server, not client)
    const priceMap = new Map(dbProducts.map((p) => [p.id, p.price]));
    const verifiedItems: CartItem[] = items.map((item) => ({
      ...item,
      price: priceMap.get(item.product_id) ?? item.price,
    }));

    const subtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping_cost = 0; // flat 0 for now — extend with delivery settings later
    const tax = 0;
    const total = subtotal + shipping_cost + tax;

    const orderNumber = `ORD-${Date.now()}`;

    const orderRow: Record<string, unknown> = {
      order_number: orderNumber,
      customer_email: billing_address.email,
      customer_name: `${billing_address.first_name} ${billing_address.last_name}`.trim(),
      status: "pending",
      payment_status: "pending",
      payment_method,
      items: verifiedItems,
      billing_address,
      subtotal,
      discount: 0,
      shipping_cost,
      tax,
      total,
      notes: notes ?? null,
      fulfillment_type: isDineIn ? "dine_in" : fulfillment_type === "pickup" ? "pickup" : "delivery",
      // A blank datetime-local input sends "" (not null/undefined), and ""
      // is not a valid timestamptz -- caught live, this 500'd every pickup
      // order with an empty pickup time, i.e. the common case ("leave blank
      // for ASAP"). Must check for an empty string explicitly, not just ??.
      pickup_time: fulfillment_type === "pickup" && pickup_time?.trim() ? pickup_time : null,
      branch_id: branchId,
      table_id: tableId,
      // Dine-in and pickup orders go straight to the kitchen; a delivery
      // order that hasn't been branch-routed has no kitchen to notify yet.
      kitchen_status: isDineIn || fulfillment_type === "pickup" ? "new" : null,
    };

    if (tenantId) orderRow.tenant_id = tenantId;

    // Insert with the service role — anonymous checkout no longer relies on a
    // wide-open RLS insert policy (dropped in migration 035)
    const { createAdminClient } = await import("@/lib/supabase/server");
    const adminDb = await createAdminClient();
    const { data: order, error } = await adminDb
      .from("orders")
      .insert(orderRow)
      .select("id, order_number")
      .single();

    if (error) {
      console.error("Order insert error:", error);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Decrement stock for tracked products (floor at 0)
    {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const admin = await createAdminClient();
      for (const item of verifiedItems) {
        const product = dbProducts.find((p) => p.id === item.product_id);
        if (!product?.track_inventory) continue;
        const next = Math.max(0, (product.stock_quantity ?? 0) - item.quantity);
        await admin.from("products")
          .update({ stock_quantity: next, updated_at: new Date().toISOString() })
          .eq("id", product.id);
      }
    }

    if (tenantId) {
      await upsertContact({
        tenantId,
        email: billing_address.email,
        phone: billing_address.phone,
        firstName: billing_address.first_name,
        lastName: billing_address.last_name,
        source: "order",
        tags: ["customer"],
        event: {
          type: "order",
          title: `Order ${order.order_number} — ${total}`,
          meta: { order_id: order.id, order_number: order.order_number, total, items: verifiedItems.length },
        },
      }).catch(() => null);
    }

    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number });
  } catch (err) {
    console.error("Orders route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CartItem, Address } from "@/types/cms";

type BillingAddress = Address & { email: string; phone?: string };

interface OrderPayload {
  items: CartItem[];
  billing_address: BillingAddress;
  payment_method: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get("x-tenant-id");
    const body: OrderPayload = await req.json();

    const { items, billing_address, payment_method, notes } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!billing_address?.email) {
      return NextResponse.json({ error: "Billing address required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify products still active + get current prices
    const productIds = [...new Set(items.map((i) => i.product_id))];
    let pQuery = supabase
      .from("products")
      .select("id, name, price, stock_quantity, status")
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
    };

    if (tenantId) orderRow.tenant_id = tenantId;

    const { data: order, error } = await supabase
      .from("orders")
      .insert(orderRow)
      .select("id, order_number")
      .single();

    if (error) {
      console.error("Order insert error:", error);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number });
  } catch (err) {
    console.error("Orders route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

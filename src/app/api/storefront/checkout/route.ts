import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { placeOrder } from "@/lib/marketplace-ecom/place-order";
import { splitCart } from "@/lib/marketplace-ecom/split-order";

/** Quote a cart: per-vendor grouping, shipping and totals, all server-priced.
 *  The cart page calls this rather than doing its own arithmetic so the
 *  figures a buyer sees are the same ones checkout will charge. */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });

  try {
    const body = await req.json();
    const { result, rate } = await splitCart(tenantId, body.items ?? [], body.area);
    return NextResponse.json({
      ...result,
      shipping_rate: rate ? { name: rate.name, rate: rate.rate, free_above: rate.free_above } : null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not price cart" },
      { status: 400 },
    );
  }
}

/** Place the order. */
export async function PUT(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });

  try {
    const body = await req.json();
    const method = body.payment_method === "bkash" ? "bkash" : "cod";

    // Checkout is open to guests — a logged-in buyer just gets the order
    // linked to their account so it shows up in order history.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const result = await placeOrder({
      tenantId,
      items: body.items ?? [],
      address: body.address ?? {},
      paymentMethod: method,
      customerId: user?.id ?? null,
      notes: body.notes,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 400 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { originOf, paymentResultPage, startOrderPayment } from "@/lib/payments/order-payment";

export const dynamic = "force-dynamic";

/** Start a fresh gateway session for an unpaid online order. */
export async function GET(req: NextRequest) {
  const orderId = new URL(req.url).searchParams.get("order");
  if (!orderId) return paymentResultPage({ title: "Order not found", message: "This link is not complete.", orderId: null, retry: false });
  const tenantId = req.headers.get("x-tenant-id");
  const r = await startOrderPayment(orderId, originOf(req), tenantId);
  if (r.url) return NextResponse.redirect(r.url, 303);
  return paymentResultPage({ title: "Could not start the payment", message: r.error ?? "Please try again in a moment.", orderId, retry: false });
}

import { NextRequest, NextResponse } from "next/server";
import { confirmOrderPayment, originOf, paymentResultPage, readGatewayFields } from "@/lib/payments/order-payment";

export const dynamic = "force-dynamic";

/** SSLCommerz sends the buyer back here (form POST) after a payment. The
 *  POST alone proves nothing: confirmOrderPayment re-validates with the
 *  gateway before marking the order paid. */
async function handle(req: NextRequest) {
  const f = await readGatewayFields(req);
  const r = await confirmOrderPayment({ val_id: f.val_id, tran_id: f.tran_id, value_a: f.value_a });
  if (r.paid && r.orderId) {
    return NextResponse.redirect(`${originOf(req)}/order-confirmation/${r.orderId}`, 303);
  }
  return paymentResultPage({
    title: "We could not confirm your payment",
    message: "If money left your account, it will be matched to your order shortly. Otherwise you can try again.",
    orderId: r.orderId,
    retry: true,
  });
}

export const POST = handle;
export const GET = handle;

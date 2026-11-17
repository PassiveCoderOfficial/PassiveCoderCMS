import { NextRequest } from "next/server";
import { paymentResultPage, readGatewayFields } from "@/lib/payments/order-payment";

export const dynamic = "force-dynamic";

/** Payment failed at the gateway. The order stays unpaid (and hidden from
 *  sellers) so the buyer can try again. */
async function handle(req: NextRequest) {
  const f = await readGatewayFields(req);
  return paymentResultPage({
    title: "Payment failed",
    message: "Your payment did not go through and no money was taken. You can try again or use another method.",
    orderId: f.value_a || null,
    retry: true,
  });
}

export const POST = handle;
export const GET = handle;

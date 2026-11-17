import { NextRequest } from "next/server";
import { paymentResultPage, readGatewayFields } from "@/lib/payments/order-payment";

export const dynamic = "force-dynamic";

async function handle(req: NextRequest) {
  const f = await readGatewayFields(req);
  return paymentResultPage({
    title: "Payment cancelled",
    message: "You cancelled the payment. Your order is saved and waits for payment.",
    orderId: f.value_a || null,
    retry: true,
  });
}

export const POST = handle;
export const GET = handle;

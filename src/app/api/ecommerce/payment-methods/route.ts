import { NextRequest, NextResponse } from "next/server";
import { getStorePaymentMethods } from "@/lib/ecommerce/payment-methods";
import { getSiteCurrency } from "@/lib/currency/currency-server";

/** Checkout's list of payment methods for the current store (no secrets). */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  const cfg = await getSiteCurrency(tenantId);
  const methods = await getStorePaymentMethods(tenantId, cfg.currency);
  return NextResponse.json({ methods });
}

import { NextRequest, NextResponse } from "next/server";
import { confirmOrderPayment, readGatewayFields } from "@/lib/payments/order-payment";

export const dynamic = "force-dynamic";

/** Server-to-server notice from SSLCommerz. Covers buyers who close the tab
 *  before the success redirect. Validated the same way as success. */
export async function POST(req: NextRequest) {
  const f = await readGatewayFields(req);
  const status = String(f.status ?? "").toUpperCase();
  if (status !== "VALID" && status !== "VALIDATED") {
    return NextResponse.json({ ok: true, ignored: status || "no status" });
  }
  const r = await confirmOrderPayment({ val_id: f.val_id, tran_id: f.tran_id, value_a: f.value_a });
  return NextResponse.json({ ok: r.paid, error: r.error ?? null });
}

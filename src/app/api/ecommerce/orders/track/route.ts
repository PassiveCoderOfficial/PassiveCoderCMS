import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const STEPS = ["Order placed", "Processing", "Shipped", "Delivered"] as const;
const STAGE_INDEX: Record<string, number> = {
  pending: 0, on_hold: 0, confirmed: 1, processing: 1, packed: 1,
  shipped: 2, out_for_delivery: 2, delivered: 3, completed: 3,
};

/**
 * Public order lookup for the storefront "Track your order" form. Needs the
 * order number AND the billing email on that order, scoped to the current
 * tenant, so it can't be used to browse other people's orders.
 */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  const order = req.nextUrl.searchParams.get("order")?.trim().replace(/^#/, "");
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!tenantId || !order || !email) {
    return NextResponse.json({ found: false, message: "Enter your order number and billing email." }, { status: 400 });
  }
  const admin = await createAdminClient();
  const { data: rows } = await admin
    .from("orders")
    .select("order_number, status, customer_email, created_at, total")
    .eq("tenant_id", tenantId)
    .eq("order_number", order)
    .limit(1);
  const row = rows?.[0];
  if (!row || String(row.customer_email ?? "").toLowerCase() !== email) {
    return NextResponse.json({ found: false, message: "Sorry, we couldn't find an order with those details. Please check the order number and email." });
  }
  const status = String(row.status ?? "pending");
  if (status === "cancelled" || status === "refunded" || status === "failed") {
    return NextResponse.json({ found: true, reference: row.order_number, stage: status[0].toUpperCase() + status.slice(1), steps: [] });
  }
  const at = STAGE_INDEX[status] ?? 0;
  return NextResponse.json({
    found: true,
    reference: row.order_number,
    stage: STEPS[at],
    steps: STEPS.map((label, i) => ({ label, done: i <= at })),
  });
}

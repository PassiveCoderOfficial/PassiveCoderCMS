import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyPayment } from "@/lib/billing/shurjopay";

// shurjoPay redirects the customer here after payment with ?order_id=<sp_order_id>.
async function handle(req: Request, orderId: string | null) {
  const origin = new URL(req.url).origin;
  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/dashboard/subscription?error=${encodeURIComponent(reason)}`);

  if (!orderId) return fail("missing_order");

  const admin = await createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, tenant_id, plan_id")
    .eq("shurjopay_order_id", orderId)
    .maybeSingle();
  if (!sub) return fail("subscription_not_found");

  const { ok } = await verifyPayment(orderId);
  if (!ok) return fail("payment_not_verified");

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  await admin.from("subscriptions").update({
    status: "active",
    trial_converted: true,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
  }).eq("id", sub.id);

  await admin.from("tenants").update({ status: "active", plan: sub.plan_id }).eq("id", sub.tenant_id);

  return NextResponse.redirect(`${origin}/dashboard/subscription?paid=1`);
}

export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get("order_id");
  return handle(req, orderId);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  let orderId = url.searchParams.get("order_id");
  if (!orderId) {
    try {
      const form = await req.formData();
      orderId = (form.get("order_id") as string) ?? null;
    } catch { /* ignore */ }
  }
  return handle(req, orderId);
}

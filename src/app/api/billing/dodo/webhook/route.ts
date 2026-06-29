import { NextResponse } from "next/server";
import { dodo } from "@/lib/billing/dodo";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });

  let event;
  try {
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k] = v; });
    event = dodo.webhooks.unwrap(rawBody, { headers, key: webhookSecret });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const admin = await createAdminClient();

  if (event.type === "payment.succeeded") {
    const payment = event.data;
    const tenantId = payment.metadata?.tenant_id as string | undefined;
    const planId   = payment.metadata?.plan_id   as string | undefined;
    const cycle    = payment.metadata?.billing_cycle as string | undefined;
    if (!tenantId || !planId) return NextResponse.json({ ok: true });

    const periodEnd = new Date();
    if (cycle === "monthly") periodEnd.setMonth(periodEnd.getMonth() + 1);
    else periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    await admin.from("subscriptions").upsert(
      {
        tenant_id: tenantId,
        plan_id: planId,
        status: "active",
        payment_provider: "dodo",
        billing_cycle: cycle ?? "yearly",
        amount_cents: payment.total_amount,
        currency: "USD",
        current_period_end: periodEnd.toISOString(),
      },
      { onConflict: "tenant_id" },
    );
  }

  if (event.type === "subscription.active" || event.type === "subscription.renewed") {
    const sub = event.data;
    const tenantId = sub.metadata?.tenant_id as string | undefined;
    if (!tenantId) return NextResponse.json({ ok: true });

    await admin.from("subscriptions").upsert(
      {
        tenant_id: tenantId,
        status: "active",
        payment_provider: "dodo",
        current_period_end: sub.next_billing_date ?? null,
      },
      { onConflict: "tenant_id" },
    );
  }

  if (event.type === "subscription.cancelled" || event.type === "subscription.expired") {
    const sub = event.data;
    const tenantId = sub.metadata?.tenant_id as string | undefined;
    if (!tenantId) return NextResponse.json({ ok: true });

    await admin.from("subscriptions")
      .update({ status: event.type === "subscription.cancelled" ? "cancelled" : "expired" })
      .eq("tenant_id", tenantId);
  }

  return NextResponse.json({ ok: true });
}

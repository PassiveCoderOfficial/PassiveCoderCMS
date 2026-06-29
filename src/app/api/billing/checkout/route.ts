import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { makePayment } from "@/lib/billing/shurjopay";
import { dodo, getDodoProductId } from "@/lib/billing/dodo";

const MANUAL_METHODS = ["bkash", "nagad", "bank"] as const;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { tenantId, planId, method, txnRef, senderNumber } = body as {
    tenantId: string; planId: string; method: string; txnRef?: string; senderNumber?: string;
  };
  const billingCycle: "monthly" | "yearly" =
    body.billingCycle === "monthly" ? "monthly" : "yearly";
  if (!tenantId || !planId || !method) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Caller must be a member of the tenant they are paying for.
  const { data: membership } = await admin
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [{ data: plan }, { data: platformSettings }] = await Promise.all([
    admin.from("plans").select("id, name, price_yearly, price_monthly").eq("id", planId).maybeSingle(),
    admin.from("platform_settings").select("usd_to_bdt_rate").eq("id", 1).maybeSingle(),
  ]);
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const bdtRate: number = (platformSettings as { usd_to_bdt_rate?: number } | null)?.usd_to_bdt_rate ?? 125;

  const priceForCycle = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
  if (!priceForCycle || priceForCycle <= 0) {
    return NextResponse.json({ error: `${billingCycle} billing not available for this plan` }, { status: 400 });
  }

  // priceForCycle is stored as cents (e.g. 4000 = $40.00)
  const amountUsd = Number(priceForCycle) / 100;
  const amountCents = Number(priceForCycle); // already cents
  const amountBdt = Math.round(amountUsd * bdtRate);
  const cycleLabel = billingCycle === "monthly" ? "monthly" : "yearly";

  // ── Manual payment (bKash / Nagad / bank) → pending + billing ticket ────────
  if (MANUAL_METHODS.includes(method as typeof MANUAL_METHODS[number])) {
    const { data: tenant } = await admin.from("tenants").select("name, slug").eq("id", tenantId).maybeSingle();
    const { data: ticket, error: ticketErr } = await admin
      .from("support_tickets")
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        subject: `Manual payment — ${plan.name} plan (${cycleLabel}, ${method})`,
        body: `Site: ${tenant?.name ?? tenantId} (${tenant?.slug ?? ""})\n`
          + `Plan: ${plan.name} (${cycleLabel})\nAmount: ৳${amountBdt} BDT ($${amountUsd} USD)\nMethod: ${method}\n`
          + `Sender number: ${senderNumber ?? "—"}\nTransaction ref: ${txnRef ?? "—"}\n\n`
          + `Awaiting super-admin verification.`,
        department: "billing",
        priority: "high",
        status: "open",
        source: "site_admin",
      })
      .select("id")
      .single();
    if (ticketErr) return NextResponse.json({ error: ticketErr.message }, { status: 500 });

    const { error: subErr } = await admin.from("subscriptions").upsert(
      {
        tenant_id: tenantId,
        plan_id: planId,
        status: "pending",
        payment_provider: "manual",
        billing_cycle: billingCycle,
        manual_ticket_id: ticket.id,
        amount_cents: amountCents,
        currency: "BDT",
      },
      { onConflict: "tenant_id" },
    );
    if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, mode: "manual", ticketId: ticket.id });
  }

  // ── shurjoPay (hosted checkout) ─────────────────────────────────────────────
  if (method === "shurjopay") {
    const origin = new URL(req.url).origin;
    const orderId = `sub_${tenantId.slice(0, 8)}_${Date.now()}`;
    try {
      const { checkoutUrl, spOrderId } = await makePayment({
        amount: amountBdt,
        orderId,
        currency: "BDT",
        returnUrl: `${origin}/api/billing/shurjopay/callback`,
        cancelUrl: `${origin}/dashboard/subscription?cancelled=1`,
        customerName: user.email ?? "Customer",
        customerEmail: user.email ?? undefined,
      });

      const { error: subErr } = await admin.from("subscriptions").upsert(
        {
          tenant_id: tenantId,
          plan_id: planId,
          status: "pending",
          payment_provider: "shurjopay",
          billing_cycle: billingCycle,
          shurjopay_order_id: spOrderId,
          amount_cents: amountCents,
          currency: "BDT",
        },
        { onConflict: "tenant_id" },
      );
      if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

      return NextResponse.json({ ok: true, mode: "shurjopay", checkoutUrl });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Payment init failed" }, { status: 502 });
    }
  }

  // ── Dodo Payments (international card) ────────────────────────────────────
  if (method === "dodo") {
    const productId = getDodoProductId(planId, billingCycle);
    if (!productId) {
      return NextResponse.json({ error: `No Dodo product configured for ${planId} ${billingCycle}` }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    try {
      const session = await dodo.checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email: user.email!, name: user.email! },
        return_url: `${origin}/dashboard/subscription?paid=1`,
        cancel_url: `${origin}/dashboard/subscription?cancelled=1`,
        metadata: { tenant_id: tenantId, plan_id: planId, billing_cycle: billingCycle },
        feature_flags: { redirect_immediately: true },
      });

      const { error: subErr } = await admin.from("subscriptions").upsert(
        {
          tenant_id: tenantId,
          plan_id: planId,
          status: "pending",
          payment_provider: "dodo",
          billing_cycle: billingCycle,
          amount_cents: amountCents,
          currency: "USD",
        },
        { onConflict: "tenant_id" },
      );
      if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

      return NextResponse.json({ ok: true, mode: "dodo", checkoutUrl: session.checkout_url });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Dodo payment init failed" }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Unknown payment method" }, { status: 400 });
}

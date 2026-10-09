import { activateSubscription } from "@/lib/billing/activate";
import { NextResponse } from "next/server";
import { getDodoClient, resolveDodoConfig } from "@/lib/billing/dodo";
import { createAdminClient } from "@/lib/supabase/server";
import { syncENMTier, enmTierForPlan } from "@/lib/enm";

export const runtime = "nodejs";

// NOTE: register this endpoint in Dodo against the WWW host —
// https://www.passivecoder.com/api/billing/dodo/webhook
//
// The apex domain 307-redirects to www and webhook delivery does not follow
// redirects, so an apex registration silently never arrives. That is what
// happened to the sandbox endpoint: a test payment reached "active" at Dodo
// while the subscription sat at "pending" here, with no error anywhere.

export async function POST(req: Request) {
  const rawBody = await req.text();

  const admin = await createAdminClient();
  const { data: ps } = await admin.from("platform_settings").select("*").eq("id", 1).maybeSingle();
  const dodoConfig = resolveDodoConfig(ps as Record<string, unknown> | null);
  const webhookSecret = dodoConfig.webhookSecret ?? process.env.DODO_WEBHOOK_SECRET;

  if (!webhookSecret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });

  const dodoClient = getDodoClient({ apiKey: dodoConfig.apiKey, sandbox: dodoConfig.sandbox });

  let event;
  try {
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k] = v; });
    event = dodoClient.webhooks.unwrap(rawBody, { headers, key: webhookSecret });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "payment.succeeded") {
    const payment = event.data;
    const tenantId = payment.metadata?.tenant_id as string | undefined;

    // AiCoder generation top-up — separate from plan-subscription payments,
    // credits tenants.ai_generations_purchased instead of touching
    // subscriptions. Checked first since it has no plan_id.
    if (payment.metadata?.type === "ai_topup" && tenantId) {
      const generations = parseInt(payment.metadata.generations as string, 10) || 0;
      if (generations > 0) {
        // Idempotent + atomic (migration 107): keyed by Dodo's payment_id,
        // so a retried delivery of the same payment.succeeded — Dodo retries
        // on timeouts/non-2xx — can't credit the purchase twice. The old
        // read-then-write here did exactly that.
        const { error } = await admin.rpc("credit_ai_generations", {
          p_reference: `dodo:${payment.payment_id}`,
          p_tenant: tenantId,
          p_generations: generations,
          p_source: "dodo",
          p_amount_cents: payment.total_amount ?? null,
          p_currency: payment.currency ?? null,
          p_note: payment.metadata?.package_id ? `package ${payment.metadata.package_id}` : null,
        });
        // Non-2xx makes Dodo retry — which is safe now, and what we want if
        // the credit genuinely failed.
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    // Pricing v2 payments (development / platform / care) carry `kind`; the
    // pending row recordCheckout wrote says what to grant.
    if (payment.metadata?.kind && tenantId) {
      const { data: sub } = await admin.from("subscriptions").select("id, pending_kind").eq("tenant_id", tenantId).maybeSingle();
      if (sub?.pending_kind) {
        await activateSubscription(admin, sub.id as string);
        await admin.from("subscription_dunning")
          .update({ resolved_at: new Date().toISOString(), stage: 0 })
          .eq("tenant_id", tenantId)
          .is("resolved_at", null);
      }
      return NextResponse.json({ ok: true });
    }

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
        // Dodo can charge in local currency (the one live payment so far was
        // BDT) — record what was actually charged.
        currency: (payment.currency as string | undefined) ?? "USD",
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        pending_plan_id: null,
        pending_billing_cycle: null,
        pending_amount_cents: null,
        pending_currency: null,
      },
      { onConflict: "tenant_id" },
    );

    // tenants.plan is what feature gating reads. This handler used to only
    // mark the subscription active, so a card payment never actually
    // unlocked the plan the customer paid for.
    await admin.from("tenants").update({ plan: planId }).eq("id", tenantId);

    // ENM Pro rides on CMS Pro — grant it on the same event that activates the
    // subscription, or the customer pays for a bundle they never receive.
    await syncENMTier(admin, tenantId, enmTierForPlan(planId));

    // Payment landed: close any open dunning and lift a payment suspension
    // straight away rather than waiting for the next daily pass.
    await admin.from("subscription_dunning")
      .update({ resolved_at: new Date().toISOString(), stage: 0 })
      .eq("tenant_id", tenantId)
      .is("resolved_at", null);
    await admin.from("tenants")
      .update({ status: "active" })
      .eq("id", tenantId)
      .eq("status", "suspended");
  }

  if (event.type === "subscription.active" || event.type === "subscription.renewed") {
    const sub = event.data;
    const tenantId = sub.metadata?.tenant_id as string | undefined;
    if (!tenantId) return NextResponse.json({ ok: true });

    // subscription.active fires the moment a trial starts, not just after
    // the first real charge — Dodo's own model treats a trialing
    // subscription as active with $0 billed so far. That makes this the
    // right place to capture subscription_id: a customer needs to be able
    // to cancel from the dashboard during the trial itself, which needs
    // this id to call Dodo's cancel API against.
    await admin.from("subscriptions").upsert(
      {
        tenant_id: tenantId,
        status: "active",
        payment_provider: "dodo",
        current_period_end: sub.next_billing_date ?? null,
        dodo_subscription_id: sub.subscription_id ?? null,
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

    // Losing CMS Pro drops ENM back to the free listing rather than revoking it
    // — the profile stays up, the Pro features come off.
    await syncENMTier(admin, tenantId, "free");
  }

  return NextResponse.json({ ok: true });
}

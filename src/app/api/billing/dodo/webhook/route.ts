import { NextResponse } from "next/server";
import { getDodoClient, resolveDodoConfig } from "@/lib/billing/dodo";
import { createAdminClient } from "@/lib/supabase/server";
import { syncENMTier } from "@/lib/enm";

export const runtime = "nodejs";

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
        const { data: tenant } = await admin.from("tenants").select("ai_generations_purchased").eq("id", tenantId).maybeSingle();
        if (tenant) {
          await admin.from("tenants")
            .update({ ai_generations_purchased: tenant.ai_generations_purchased + generations })
            .eq("id", tenantId);
        }
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
        currency: "USD",
        current_period_end: periodEnd.toISOString(),
      },
      { onConflict: "tenant_id" },
    );

    // ENM Pro rides on CMS Pro — grant it on the same event that activates the
    // subscription, or the customer pays for a bundle they never receive.
    await syncENMTier(admin, tenantId, planId === "pro" || planId === "biz" ? "pro" : "free");
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

    // Losing CMS Pro drops ENM back to the free listing rather than revoking it
    // — the profile stays up, the Pro features come off.
    await syncENMTier(admin, tenantId, "free");
  }

  return NextResponse.json({ ok: true });
}

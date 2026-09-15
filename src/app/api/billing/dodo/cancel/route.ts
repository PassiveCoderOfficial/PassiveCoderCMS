import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getDodoClient, resolveDodoConfig } from "@/lib/billing/dodo";
import { callerCanManageTenant } from "@/lib/auth/verify-bearer";

/**
 * Self-serve trial cancellation (docs/business/04-pricing-and-packaging.md,
 * "cancel within 6 days, don't pay"). Uses cancel_at_next_billing_date
 * rather than an immediate/forced cancel — during the trial, "next billing
 * date" IS the first real charge (day 8), so this cancels before any money
 * ever moves, which is exactly the promise. It also degrades sensibly for a
 * customer who cancels after the trial has converted to a paid month:
 * they keep access through what they already paid for instead of being cut
 * off mid-period.
 */
export async function POST(req: Request) {
  const { tenantId } = await req.json();
  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });

  // Cookie session (web) first, Bearer token (mobile) fallback — same
  // dual-auth shape as domain/connect and api/ecommerce/pos, added so the
  // Passive Coder Admin app's subscription screen can call this route.
  if (!(await callerCanManageTenant(req, tenantId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = await createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, dodo_subscription_id, payment_provider")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!sub) return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  if (sub.payment_provider !== "dodo" || !sub.dodo_subscription_id) {
    // shurjoPay/manual trials never had money move in the first place —
    // nothing at Dodo to cancel. Just mark it cancelled on our side so the
    // dashboard and the expire-trials cron both stop treating it as due.
    await admin.from("subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", sub.id);
    return NextResponse.json({ ok: true });
  }

  const { data: ps } = await admin.from("platform_settings").select("*").eq("id", 1).maybeSingle();
  const dodoConfig = resolveDodoConfig(ps as Record<string, unknown> | null);
  const dodoClient = getDodoClient({ apiKey: dodoConfig.apiKey, sandbox: dodoConfig.sandbox });

  try {
    await dodoClient.subscriptions.update(sub.dodo_subscription_id, {
      cancel_at_next_billing_date: true,
      cancel_reason: "cancelled_by_customer",
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not cancel with Dodo" }, { status: 502 });
  }

  // Dodo's own subscription.cancelled webhook will flip status to
  // "cancelled" once the cancellation actually takes effect (at the next
  // billing date) — recording the intent here immediately so the dashboard
  // reflects it right away rather than waiting on a webhook round-trip the
  // customer has no visibility into.
  await admin.from("subscriptions").update({ cancelled_at: new Date().toISOString() }).eq("id", sub.id);

  return NextResponse.json({ ok: true });
}

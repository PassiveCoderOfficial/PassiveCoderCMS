/**
 * Shared subscription bookkeeping for every payment path (Dodo webhook,
 * shurjoPay callback, super-admin manual approval) so they can't disagree.
 *
 * Two bugs this replaces:
 * - Starting any checkout upserted the tenant's single subscription row to
 *   status "pending" with the NEW plan. For a customer already paying, an
 *   abandoned upgrade therefore knocked their live subscription out of
 *   dunning/renewal tracking and showed the wrong plan. Now, when the row is
 *   active/past_due, the attempted change is parked in pending_* columns and
 *   only promoted once payment actually lands.
 * - shurjoPay and manual approvals always granted 365 days, even for a
 *   monthly plan.
 */
type Admin = Awaited<ReturnType<typeof import("@/lib/supabase/server").createAdminClient>>;

const LIVE = ["active", "past_due"];

export function periodEndFor(cycle: string | null | undefined, from = new Date()): Date {
  const end = new Date(from);
  if (cycle === "monthly") end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);
  return end;
}

/**
 * Record a started checkout. `fields` is what a brand-new/lapsed subscription
 * row should become (plan_id, billing_cycle, amount_cents, currency, provider
 * ids…). For a live subscription only the pending_* change and the provider
 * reference needed to find it again are written.
 */
export async function recordCheckout(
  admin: Admin,
  tenantId: string,
  fields: {
    plan_id: string;
    billing_cycle: string;
    amount_cents: number;
    currency: string;
    payment_provider: string;
    shurjopay_order_id?: string;
    manual_ticket_id?: string;
  },
): Promise<{ error: string | null }> {
  const { data: existing } = await admin
    .from("subscriptions")
    .select("status")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (existing && LIVE.includes(existing.status as string)) {
    const { error } = await admin.from("subscriptions").update({
      pending_plan_id: fields.plan_id,
      pending_billing_cycle: fields.billing_cycle,
      pending_amount_cents: fields.amount_cents,
      pending_currency: fields.currency,
      ...(fields.shurjopay_order_id ? { shurjopay_order_id: fields.shurjopay_order_id } : {}),
      ...(fields.manual_ticket_id ? { manual_ticket_id: fields.manual_ticket_id } : {}),
    }).eq("tenant_id", tenantId);
    return { error: error?.message ?? null };
  }

  const { error } = await admin.from("subscriptions").upsert(
    { tenant_id: tenantId, status: "pending", ...fields },
    { onConflict: "tenant_id" },
  );
  return { error: error?.message ?? null };
}

/**
 * Activate a paid subscription row: promote any parked pending_* change,
 * start a period sized to the billing cycle, and put the plan on the tenant
 * (tenants.plan is what feature gating reads). Returns the effective plan.
 */
export async function activateSubscription(
  admin: Admin,
  subId: string,
): Promise<{ tenantId: string; planId: string; cycle: string; amountCents: number | null } | null> {
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, tenant_id, plan_id, billing_cycle, amount_cents, currency, pending_plan_id, pending_billing_cycle, pending_amount_cents, pending_currency")
    .eq("id", subId)
    .maybeSingle();
  if (!sub) return null;

  const planId = (sub.pending_plan_id ?? sub.plan_id) as string;
  const cycle = (sub.pending_billing_cycle ?? sub.billing_cycle ?? "yearly") as string;
  const amountCents = (sub.pending_amount_cents ?? sub.amount_cents) as number | null;
  const now = new Date();

  await admin.from("subscriptions").update({
    status: "active",
    trial_converted: true,
    plan_id: planId,
    billing_cycle: cycle,
    amount_cents: amountCents,
    currency: sub.pending_currency ?? sub.currency,
    current_period_start: now.toISOString(),
    current_period_end: periodEndFor(cycle, now).toISOString(),
    pending_plan_id: null,
    pending_billing_cycle: null,
    pending_amount_cents: null,
    pending_currency: null,
  }).eq("id", sub.id);

  await admin.from("tenants").update({ status: "active", plan: planId }).eq("id", sub.tenant_id);

  return { tenantId: sub.tenant_id as string, planId, cycle, amountCents };
}

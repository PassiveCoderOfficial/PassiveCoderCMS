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
    /** Pricing v2 checkouts: what this payment is for. */
    kind?: "development" | "platform" | "care" | "bundle";
    care_plan_id?: string | null;
    care_cycle?: "monthly" | "yearly" | null;
  },
): Promise<{ error: string | null }> {
  const v2 = fields.kind
    ? { pending_kind: fields.kind, pending_care_plan_id: fields.care_plan_id ?? null, pending_care_cycle: fields.care_cycle ?? null }
    : { pending_kind: null, pending_care_plan_id: null, pending_care_cycle: null };
  const { kind: _k, care_plan_id: _c, care_cycle: _cc, ...base } = fields;
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
      ...v2,
      ...(fields.shurjopay_order_id ? { shurjopay_order_id: fields.shurjopay_order_id } : {}),
      ...(fields.manual_ticket_id ? { manual_ticket_id: fields.manual_ticket_id } : {}),
    }).eq("tenant_id", tenantId);
    return { error: error?.message ?? null };
  }

  const { error } = await admin.from("subscriptions").upsert(
    // v2 checkouts always park in pending_* so activation knows the kind,
    // even on a brand-new row.
    { tenant_id: tenantId, status: "pending", ...base, ...v2, ...(fields.kind ? { pending_plan_id: fields.plan_id, pending_billing_cycle: fields.billing_cycle, pending_amount_cents: fields.amount_cents, pending_currency: fields.currency } : {}) },
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
    .select("id, tenant_id, plan_id, billing_cycle, amount_cents, currency, pending_plan_id, pending_billing_cycle, pending_amount_cents, pending_currency, pending_kind, pending_care_plan_id, pending_care_cycle, platform_paid_until, care_paid_until")
    .eq("id", subId)
    .maybeSingle();
  if (!sub) return null;

  if (sub.pending_kind) return activateV2(admin, sub as V2Row);

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


/* ── Pricing v2 (migration 137): development / platform / care / bundle ── */

interface V2Row {
  id: string;
  tenant_id: string;
  plan_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  pending_plan_id: string | null;
  pending_amount_cents: number | null;
  pending_currency: string | null;
  pending_kind: "development" | "platform" | "care" | "bundle";
  pending_care_plan_id: string | null;
  pending_care_cycle: "monthly" | "yearly" | null;
  platform_paid_until: string | null;
  care_paid_until: string | null;
}

const plusMonths = (from: Date, m: number) => { const d = new Date(from); d.setMonth(d.getMonth() + m); return d; };
/** Extend from whichever is later: now, or the still-running paid date. */
const extend = (current: string | null, months: number, now: Date) => {
  const base = current && new Date(current) > now ? new Date(current) : now;
  return plusMonths(base, months);
};

async function activateV2(admin: Admin, sub: V2Row) {
  const now = new Date();
  const kind = sub.pending_kind;
  const planId = (sub.pending_plan_id ?? sub.plan_id ?? "basic") as string;
  const patch: Record<string, unknown> = {
    status: "active",
    trial_converted: true,
    amount_cents: sub.pending_amount_cents ?? sub.amount_cents,
    currency: sub.pending_currency ?? sub.currency,
    current_period_start: now.toISOString(),
    pending_plan_id: null, pending_billing_cycle: null, pending_amount_cents: null, pending_currency: null,
    pending_kind: null, pending_care_plan_id: null, pending_care_cycle: null,
  };
  let platformUntil = sub.platform_paid_until;
  let careUntil = sub.care_paid_until;

  if (kind === "development" || kind === "bundle") {
    patch.plan_id = planId;
    patch.development_paid_at = now.toISOString();
    platformUntil = extend(sub.platform_paid_until, 12, now).toISOString();
    if (kind === "development") {
      const { data: pkg } = await admin.from("plans").select("free_care_plan_id, free_care_months").eq("id", planId).maybeSingle();
      if (pkg?.free_care_plan_id && (pkg.free_care_months ?? 0) > 0) {
        patch.care_plan_id = pkg.free_care_plan_id;
        patch.care_cycle = "monthly";
        patch.care_is_free = true;
        careUntil = extend(sub.care_paid_until, pkg.free_care_months as number, now).toISOString();
      }
    } else {
      patch.care_plan_id = sub.pending_care_plan_id;
      patch.care_cycle = "yearly";
      patch.care_is_free = false;
      careUntil = extend(sub.care_paid_until, 12, now).toISOString();
    }
  } else if (kind === "platform") {
    patch.plan_id = planId;
    platformUntil = extend(sub.platform_paid_until, 12, now).toISOString();
  } else if (kind === "care") {
    const cycle = sub.pending_care_cycle === "monthly" ? "monthly" : "yearly";
    patch.care_plan_id = sub.pending_care_plan_id;
    patch.care_cycle = cycle;
    patch.care_is_free = false;
    careUntil = extend(sub.care_paid_until, cycle === "monthly" ? 1 : 12, now).toISOString();
  }

  patch.platform_paid_until = platformUntil;
  patch.care_paid_until = careUntil;
  patch.billing_cycle = "yearly";
  // The single date dunning/suspension read: online while either is paid.
  const ends = [platformUntil, careUntil].filter(Boolean).map((d) => new Date(d as string).getTime());
  if (ends.length) patch.current_period_end = new Date(Math.max(...ends)).toISOString();

  await admin.from("subscriptions").update(patch).eq("id", sub.id);
  const effectivePlan = (patch.plan_id as string | undefined) ?? sub.plan_id ?? planId;
  await admin.from("tenants").update({ status: "active", plan: effectivePlan }).eq("id", sub.tenant_id);

  return { tenantId: sub.tenant_id, planId: effectivePlan, cycle: "yearly", amountCents: (patch.amount_cents as number | null) ?? null };
}

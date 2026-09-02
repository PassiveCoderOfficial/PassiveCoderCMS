import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

/**
 * Failed-payment / overdue-renewal recovery.
 *
 * Monthly billing makes a lapsed payment a routine event rather than an annual
 * one, so the goal here is recovery, not enforcement: the site stays up through
 * the whole sequence and is only suspended at the end. A dead site cannot pay
 * its invoice, and a customer whose business page vanished without warning does
 * not come back.
 */

export interface DunningStep {
  /** Days past the due date when this step fires. */
  daysOverdue: number;
  subject: string;
  /** Whether reaching this step suspends the site. */
  suspend?: boolean;
  body: (ctx: { siteName: string; amount: string; payUrl: string }) => string;
}

/**
 * Escalation schedule. Deliberately gentle early — the most common cause of a
 * failed charge is an expired or replaced card, not an unwillingness to pay,
 * and treating a good customer like a debtor on day one costs more than the
 * invoice is worth.
 */
export const DUNNING_STEPS: DunningStep[] = [
  {
    daysOverdue: 1,
    subject: "Your payment didn't go through",
    body: ({ siteName, amount, payUrl }) =>
      `Hi,\n\nWe couldn't take the ${amount} payment for ${siteName}. This is usually just an expired or replaced card.\n\nYour site is still live — nothing has changed. You can update payment here:\n${payUrl}\n\nIf you think this is a mistake, reply to this email and we'll look into it.`,
  },
  {
    daysOverdue: 4,
    subject: "Reminder: payment for your website",
    body: ({ siteName, amount, payUrl }) =>
      `Hi,\n\nJust a reminder that the ${amount} payment for ${siteName} is still outstanding.\n\nYour site is live and staying that way for now. Update payment here whenever you get a moment:\n${payUrl}\n\nIf you'd rather pay another way, or something has changed, message us on WhatsApp — we'll sort it out.`,
  },
  {
    daysOverdue: 10,
    subject: "Action needed: your website payment",
    body: ({ siteName, amount, payUrl }) =>
      `Hi,\n\nThe ${amount} payment for ${siteName} is now 10 days overdue.\n\nWe don't want to interrupt your site. If there's a problem — the card, the timing, or the plan itself — tell us and we'll work something out. We would much rather hear from you than switch anything off.\n\nUpdate payment:\n${payUrl}`,
  },
  {
    daysOverdue: 21,
    suspend: true,
    subject: "Your website has been paused",
    body: ({ siteName, amount, payUrl }) =>
      `Hi,\n\nWe've had to pause ${siteName} while the ${amount} payment is outstanding.\n\nNothing has been deleted. Your pages, content and settings are exactly as you left them, and the site comes straight back the moment payment goes through:\n${payUrl}\n\nIf you want to cancel instead, just reply and tell us — no hard feelings, and we'll close it off properly.`,
  },
];

function formatAmount(cents: number | null, currency: string | null): string {
  const amount = (cents ?? 0) / 100;
  if ((currency ?? "USD").toUpperCase() === "BDT") {
    return `৳${Math.round(amount).toLocaleString("en-BD")}`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Highest step whose threshold the overdue age has passed, or null. */
export function stepForAge(daysOverdue: number): { index: number; step: DunningStep } | null {
  let found: { index: number; step: DunningStep } | null = null;
  DUNNING_STEPS.forEach((step, index) => {
    if (daysOverdue >= step.daysOverdue) found = { index: index + 1, step };
  });
  return found;
}

interface SubRow {
  id: string;
  tenant_id: string;
  status: string;
  amount_cents: number | null;
  currency: string | null;
  current_period_end: string | null;
  next_payment_due: string | null;
}

/**
 * One dunning pass. Returns a summary for the cron response.
 *
 * Idempotent by day: a subscription already notified at its current stage is
 * skipped, so re-running the cron does not re-send.
 */
export async function runDunning(admin: SupabaseClient, rootDomain: string) {
  const today = new Date();
  const summary = { checked: 0, notified: 0, suspended: 0, resolved: 0, errors: 0 };

  const { data: subs, error } = await admin
    .from("subscriptions")
    .select("id, tenant_id, status, amount_cents, currency, current_period_end, next_payment_due")
    .in("status", ["active", "past_due"]);

  if (error) throw new Error(error.message);

  for (const sub of (subs ?? []) as SubRow[]) {
    summary.checked++;

    // next_payment_due is authoritative when set; otherwise the period end is
    // the date the next payment was expected.
    const dueRaw = sub.next_payment_due ?? sub.current_period_end;
    if (!dueRaw) continue;

    const due = new Date(dueRaw);
    if (Number.isNaN(due.getTime())) continue;

    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / 86_400_000);

    const { data: state } = await admin
      .from("subscription_dunning")
      .select("*")
      .eq("subscription_id", sub.id)
      .maybeSingle();

    // Paid up: clear any open dunning and restore an unpaid-suspended site.
    if (daysOverdue < 0) {
      if (state && !state.resolved_at) {
        await admin.from("subscription_dunning")
          .update({ resolved_at: new Date().toISOString(), stage: 0 })
          .eq("subscription_id", sub.id);
        if (sub.status === "past_due") {
          await admin.from("subscriptions").update({ status: "active" }).eq("id", sub.id);
          await admin.from("tenants").update({ status: "active" }).eq("id", sub.tenant_id);
        }
        summary.resolved++;
      }
      continue;
    }

    const target = stepForAge(daysOverdue);
    if (!target) continue;

    // A new lapse after a resolved one starts over rather than resuming.
    const sameCycle = state?.due_date === dueRaw;
    const currentStage = sameCycle && !state?.resolved_at ? (state?.stage ?? 0) : 0;
    if (target.index <= currentStage) continue;

    const { data: tenant } = await admin
      .from("tenants")
      .select("id, name, slug, owner_id")
      .eq("id", sub.tenant_id)
      .maybeSingle();
    if (!tenant?.owner_id) continue;

    const { data: owner } = await admin
      .from("profiles").select("email").eq("id", tenant.owner_id).maybeSingle();
    if (!owner?.email) continue;

    const ctx = {
      siteName: tenant.name ?? tenant.slug ?? "your website",
      amount: formatAmount(sub.amount_cents, sub.currency),
      payUrl: `https://${rootDomain}/dashboard/subscription`,
    };

    const sent = await sendEmail({
      to: owner.email,
      subject: target.step.subject,
      text: target.step.body(ctx),
    });
    if (!sent.ok) {
      // Do not advance the stage on a send failure, or the customer silently
      // skips a reminder and goes straight to the next escalation.
      summary.errors++;
      continue;
    }

    await admin.from("subscription_dunning").upsert({
      subscription_id: sub.id,
      tenant_id: sub.tenant_id,
      stage: target.index,
      last_notified_at: new Date().toISOString(),
      due_date: dueRaw,
      resolved_at: null,
    }, { onConflict: "subscription_id" });
    summary.notified++;

    if (target.step.suspend) {
      await admin.from("subscriptions").update({ status: "past_due" }).eq("id", sub.id);
      await admin.from("tenants").update({ status: "suspended" }).eq("id", sub.tenant_id);
      summary.suspended++;
    } else if (sub.status === "active") {
      await admin.from("subscriptions").update({ status: "past_due" }).eq("id", sub.id);
    }
  }

  return summary;
}

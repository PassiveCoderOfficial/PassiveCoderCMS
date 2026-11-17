import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Free trial for self-serve sites (2026-10-19): full dashboard for
 * TRIAL_DAYS; then the site is paused (owner can still sign in and pay) and
 * deleted GRACE_DAYS later unless paid. Paying at any point ends the trial.
 * Staff-built demos keep their own 72-hour rule (tenants.demo_expires_at).
 */
export const TRIAL_DAYS = 7;
export const GRACE_DAYS = 7;
const DAY = 86_400_000;

export const trialEnd = (from = new Date()) => new Date(from.getTime() + TRIAL_DAYS * DAY).toISOString();
export const deleteAfter = (trialEndsAt: string | Date) => new Date(new Date(trialEndsAt).getTime() + GRACE_DAYS * DAY).toISOString();

/** Has this site ever paid us (any recorded payment)? */
export async function sitePaid(admin: SupabaseClient, tenantId: string): Promise<boolean> {
  const { data } = await admin.from("subscription_payments").select("id").eq("tenant_id", tenantId).gt("amount_cents", 0).limit(1);
  return !!data?.length;
}

/** Payment received: the site is no longer on trial and never gets deleted by the trial job. */
export async function endTrial(admin: SupabaseClient, tenantId: string) {
  await admin.from("tenants").update({ trial_ends_at: null, trial_delete_after: null, trial_notice_stage: 0 }).eq("id", tenantId);
  await admin.from("subscriptions").update({ trial_ends_at: null }).eq("tenant_id", tenantId);
}

export type TrialState =
  | { kind: "none" }
  | { kind: "trial"; endsAt: string; daysLeft: number }
  | { kind: "paused"; endsAt: string; deleteAfter: string; daysToDelete: number };

export function trialState(t: { trial_ends_at?: string | null; trial_delete_after?: string | null; status?: string | null }, now = Date.now()): TrialState {
  if (!t.trial_ends_at) return { kind: "none" };
  const end = new Date(t.trial_ends_at).getTime();
  if (end > now) return { kind: "trial", endsAt: t.trial_ends_at, daysLeft: Math.max(1, Math.ceil((end - now) / DAY)) };
  const del = t.trial_delete_after ?? deleteAfter(t.trial_ends_at);
  return { kind: "paused", endsAt: t.trial_ends_at, deleteAfter: del, daysToDelete: Math.max(0, Math.ceil((new Date(del).getTime() - now) / DAY)) };
}

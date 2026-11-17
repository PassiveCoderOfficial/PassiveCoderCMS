import type { SupabaseClient } from "@supabase/supabase-js";
import { ROOT_TENANT_SLUG } from "@/lib/flags";
import {
  ASSISTANT_MESSAGES_PER_DAY, CREDITS_PER_GENERATION, CREDIT_COSTS, CREDIT_GROUP, DEFAULT_MONTHLY_CREDITS,
  PLANLESS_MONTHLY_CREDITS, type CreditStatus, type CreditUse,
} from "./credit-costs";

/**
 * Unified AI Credits: one balance per site, spent by every AI feature.
 *
 *   const r = await reserveCredits(tenantId, "section", { userId });  // BEFORE the model
 *   try { ...call the model... } catch (e) { await refundCredits(r); throw e; }
 *
 * Monthly allowance drains first, then purchased credits (which never expire).
 * The signup build's free grant pays for AiCoder sections before either. Each
 * spend is a compare-and-swap on the tenant row: a concurrent spend makes the
 * WHERE match nothing and this one retries against the new balance, so two
 * requests can never both spend the same last credit.
 *
 * The root site is never metered: no balance, no daily cap, no log.
 */

export type CreditErrorCode = "no_credits" | "daily_cap" | "busy" | "not_found";

export class AiCreditsError extends Error {
  constructor(message: string, public code: CreditErrorCode) { super(message); }
}

export const NO_CREDITS_MESSAGE = "You are out of AI Credits. Buy more to keep going, or wait for next month's refill.";

export interface CreditReservation {
  tenantId: string;
  use: CreditUse;
  credits: number;
  monthlyPart: number;
  purchasedPart: number;
  /** Credits paid by the free build grant. */
  freePart: number;
  spendId: string | null;
  unlimited: boolean;
  /** This ref (conversation, ticket) was charged earlier: nothing spent now. */
  alreadyCharged: boolean;
}

export interface ReserveOptions {
  userId?: string | null;
  /** Charge once per this id: a conversation or ticket. */
  ref?: string;
  /** Free text for the log, e.g. the block type. */
  detail?: string;
}

type TenantRow = {
  plan: string | null; slug: string;
  ai_credits_used_this_month: number; ai_credits_reset_at: string; ai_credits_purchased: number;
  ai_free_build_credits: number | null; ai_chat_day_count: number; ai_chat_day_start: string | null;
};
const TENANT_COLS = "plan, slug, ai_credits_used_this_month, ai_credits_reset_at, ai_credits_purchased, ai_free_build_credits, ai_chat_day_count, ai_chat_day_start";

type NotifyInput = { tenantId: string; type: "low_credits"; dedupeKey: string; title: string; body: string; webUrl: string };
export interface CreditDeps {
  admin: () => Promise<SupabaseClient>;
  notify: (input: NotifyInput) => Promise<void>;
  /** Self-hosted install: AI is paid on its own key or Passive Coder AI credits, so the local ledger never blocks. */
  selfHosted?: boolean;
  /** Retry pause; tests pass 0. */
  backoffMs?: number;
  now?: () => Date;
}

const CAS_ATTEMPTS = 12;

const nextMonthStart = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
const monthStart = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));

/** The plan's allowance; plan states with no row, or a new plan with no key yet, fall back. */
export function monthlyCreditsOf(plan: string | null | undefined, modules: unknown): number {
  const aiCoder = (modules as { ai_coder?: { monthly_credits?: number; monthly_generations?: number } } | null | undefined)?.ai_coder;
  if (typeof aiCoder?.monthly_credits === "number") return aiCoder.monthly_credits;
  if (typeof aiCoder?.monthly_generations === "number") return aiCoder.monthly_generations * CREDITS_PER_GENERATION + DEFAULT_MONTHLY_CREDITS;
  return PLANLESS_MONTHLY_CREDITS[String(plan ?? "")] ?? DEFAULT_MONTHLY_CREDITS;
}

export function creditsWith(deps: CreditDeps) {
  const now = deps.now ?? (() => new Date());
  const pause = (attempt: number) => {
    const base = deps.backoffMs ?? 25;
    return base ? new Promise((r) => setTimeout(r, base * (attempt + 1) * (0.5 + Math.random()))) : Promise.resolve();
  };

  async function allowance(db: SupabaseClient, plan: string | null): Promise<number> {
    const { data } = await db.from("plans").select("modules").eq("id", plan ?? "").maybeSingle();
    return monthlyCreditsOf(plan, data?.modules);
  }

  /** Warn at 20% of the allowance and at zero, once a month per threshold (dedupeKey). */
  async function warnIfLow(tenantId: string, left: number, monthly: number): Promise<void> {
    const threshold = monthly > 0 ? Math.floor(monthly * 0.2) : 20;
    if (left > threshold) return;
    const out = left === 0;
    await deps.notify({
      tenantId, type: "low_credits",
      dedupeKey: `ai-credits:${tenantId}:${now().toISOString().slice(0, 7)}:${out ? "out" : "low"}`,
      title: out ? "AI Credits used up" : "AI Credits running low",
      body: out
        ? "AI tools have stopped and website chat now goes to your team. Buy more to switch the AI back on."
        : `${left} AI Credits left this month. Buy more so your AI tools and website chat keep working.`,
      webUrl: "/dashboard/subscription",
    }).catch((e) => console.error("[credits] notify", e instanceof Error ? e.message : e));
  }

  /** Takes the credits for one use, or throws AiCreditsError. Call BEFORE the model. */
  async function reserveCredits(tenantId: string, use: CreditUse, opts: ReserveOptions = {}): Promise<CreditReservation> {
    const db = await deps.admin();
    const credits = CREDIT_COSTS[use];
    const none = (extra: Partial<CreditReservation>): CreditReservation => ({
      tenantId, use, credits: 0, monthlyPart: 0, purchasedPart: 0, freePart: 0, spendId: null, unlimited: false, alreadyCharged: false, ...extra,
    });
    let checkedRef = false;

    for (let attempt = 0; attempt < CAS_ATTEMPTS; attempt++) {
      const { data } = await db.from("tenants").select(TENANT_COLS).eq("id", tenantId).maybeSingle();
      const t = data as unknown as TenantRow | null;
      if (!t) throw new AiCreditsError("Site not found", "not_found");
      if (t.slug === ROOT_TENANT_SLUG || deps.selfHosted) return none({ unlimited: true });

      if (opts.ref && !checkedRef) {
        const { data: charged } = await db.from("ai_credit_spends").select("id")
          .eq("tenant_id", tenantId).eq("use_type", use).eq("ref", opts.ref).is("refunded_at", null).maybeSingle();
        if (charged) return none({ alreadyCharged: true });
        checkedRef = true;
      }

      const today = now().toISOString().slice(0, 10);
      const dayCount = t.ai_chat_day_start === today ? t.ai_chat_day_count : 0;
      if (use === "assistant" && dayCount >= ASSISTANT_MESSAGES_PER_DAY) {
        throw new AiCreditsError(`This site has hit its daily limit of ${ASSISTANT_MESSAGES_PER_DAY} AI assistant messages. It resets tomorrow.`, "daily_cap");
      }

      const monthly = await allowance(db, t.plan);
      const expired = now() >= new Date(t.ai_credits_reset_at);
      const used = expired ? 0 : t.ai_credits_used_this_month;
      const freeUnits = t.ai_free_build_credits ?? 0;

      let monthlyPart = 0, purchasedPart = 0, freePart = 0;
      if (use === "section" && freeUnits > 0) freePart = credits;
      else {
        monthlyPart = Math.min(credits, Math.max(0, monthly - used));
        purchasedPart = credits - monthlyPart;
        if (purchasedPart > t.ai_credits_purchased) {
          // Denied, possibly with a few credits left that this use cannot run on.
          await warnIfLow(tenantId, Math.max(0, monthly - used) + t.ai_credits_purchased + freeUnits * CREDITS_PER_GENERATION, monthly);
          throw new AiCreditsError(NO_CREDITS_MESSAGE, "no_credits");
        }
      }

      const nextUsed = used + monthlyPart;
      const nextPurchased = t.ai_credits_purchased - purchasedPart;
      const nextFree = freeUnits - freePart / CREDITS_PER_GENERATION;
      const patch: Record<string, unknown> = {
        ai_credits_used_this_month: nextUsed,
        ai_credits_purchased: nextPurchased,
        ...(freePart ? { ai_free_build_credits: nextFree } : {}),
        ...(expired ? { ai_credits_reset_at: nextMonthStart(now()).toISOString() } : {}),
        ...(use === "assistant" ? { ai_chat_day_count: dayCount + 1, ai_chat_day_start: today } : {}),
      };
      let cas = db.from("tenants").update(patch).eq("id", tenantId)
        .eq("ai_credits_used_this_month", t.ai_credits_used_this_month)
        .eq("ai_credits_purchased", t.ai_credits_purchased)
        .eq("ai_credits_reset_at", t.ai_credits_reset_at);
      if (freePart) cas = cas.eq("ai_free_build_credits", freeUnits);
      if (use === "assistant") cas = cas.eq("ai_chat_day_count", t.ai_chat_day_count);
      const { data: won, error } = await cas.select("id").maybeSingle();
      if (error) throw new AiCreditsError(error.message, "busy");
      if (!won) { await pause(attempt); continue; }

      const reservation: CreditReservation = none({ credits, monthlyPart, purchasedPart, freePart });
      const { data: spend, error: logError } = await db.from("ai_credit_spends").insert({
        tenant_id: tenantId, user_id: opts.userId ?? null, use_type: use, credits,
        monthly_part: monthlyPart, purchased_part: purchasedPart, free_part: freePart,
        ref: opts.ref ?? null, detail: opts.detail?.slice(0, 120) ?? null,
      }).select("id").single();
      if (logError) {
        // Two first messages raced: the unique ref says the other one charged.
        if (logError.code === "23505") {
          await putBack(db, reservation);
          return none({ alreadyCharged: true });
        }
        console.error("[credits] spend log", logError.message);
      }
      reservation.spendId = (spend?.id as string | undefined) ?? null;

      await warnIfLow(tenantId, Math.max(0, monthly - nextUsed) + nextPurchased + nextFree * CREDITS_PER_GENERATION, monthly);
      return reservation;
    }
    throw new AiCreditsError("AI is busy right now. Please try again in a moment.", "busy");
  }

  /** Adds a reservation's credits back to the pools they came from. */
  async function putBack(db: SupabaseClient, r: CreditReservation): Promise<void> {
    for (let attempt = 0; attempt < CAS_ATTEMPTS; attempt++) {
      const { data } = await db.from("tenants").select(TENANT_COLS).eq("id", r.tenantId).maybeSingle();
      const t = data as unknown as TenantRow | null;
      if (!t) return;
      const freeUnits = t.ai_free_build_credits ?? 0;
      let cas = db.from("tenants").update({
        ai_credits_used_this_month: Math.max(0, t.ai_credits_used_this_month - r.monthlyPart),
        ai_credits_purchased: t.ai_credits_purchased + r.purchasedPart,
        ...(r.freePart ? { ai_free_build_credits: freeUnits + r.freePart / CREDITS_PER_GENERATION } : {}),
      }).eq("id", r.tenantId)
        .eq("ai_credits_used_this_month", t.ai_credits_used_this_month)
        .eq("ai_credits_purchased", t.ai_credits_purchased);
      if (r.freePart) cas = cas.eq("ai_free_build_credits", freeUnits);
      const { data: won, error } = await cas.select("id").maybeSingle();
      if (error) throw new Error(error.message);
      if (won) return;
      await pause(attempt);
    }
    throw new Error("Could not refund AI Credits: too many concurrent updates");
  }

  /**
   * Undoes a reservation when the model failed: a failure must not cost the
   * site anything. Safe to call twice, and on root or already-charged
   * reservations, where it does nothing.
   */
  async function refundCredits(r: CreditReservation): Promise<void> {
    if (r.unlimited || r.alreadyCharged || r.credits === 0) return;
    const db = await deps.admin();
    if (r.spendId) {
      const { data: claimed } = await db.from("ai_credit_spends").update({ refunded_at: now().toISOString() })
        .eq("id", r.spendId).is("refunded_at", null).select("id").maybeSingle();
      if (!claimed) return;
    }
    await putBack(db, r);
  }

  async function getCreditStatus(tenantId: string): Promise<CreditStatus | null> {
    const db = await deps.admin();
    const { data } = await db.from("tenants").select(TENANT_COLS).eq("id", tenantId).maybeSingle();
    const t = data as unknown as TenantRow | null;
    if (!t) return null;
    const empty = { section: 0, chat: 0, assistant: 0, other: 0 };
    const at = now();
    const expired = at >= new Date(t.ai_credits_reset_at);
    const resetAt = expired ? nextMonthStart(at).toISOString() : t.ai_credits_reset_at;
    if (t.slug === ROOT_TENANT_SLUG || deps.selfHosted) {
      return { unlimited: true, left: 0, total: 0, monthlyIncluded: 0, usedThisMonth: 0, purchasedRemaining: 0, freeBuildCredits: 0, resetAt, breakdown: empty };
    }
    const monthly = await allowance(db, t.plan);
    const { data: usage } = await db.rpc("ai_credit_usage", { p_tenant: tenantId, p_since: monthStart(at).toISOString() });
    const breakdown = { ...empty };
    let spentFromExtras = 0;
    for (const u of (usage ?? []) as { use_type: string; credits: number; purchased_part: number; free_part: number }[]) {
      breakdown[CREDIT_GROUP[u.use_type as CreditUse] ?? "other"] += Number(u.credits);
      spentFromExtras += Number(u.purchased_part) + Number(u.free_part);
    }
    const used = expired ? 0 : t.ai_credits_used_this_month;
    const free = (t.ai_free_build_credits ?? 0) * CREDITS_PER_GENERATION;
    const left = Math.max(0, monthly - used) + t.ai_credits_purchased + free;
    return {
      unlimited: false,
      left,
      // Y stays put as credits are spent, so "X of Y" counts down; only a top-up raises it.
      total: monthly + t.ai_credits_purchased + free + spentFromExtras,
      monthlyIncluded: monthly,
      usedThisMonth: used,
      purchasedRemaining: t.ai_credits_purchased,
      freeBuildCredits: free,
      resetAt,
      breakdown,
    };
  }

  /** Advisory check before a batch (a full page): says so up front instead of stopping halfway. The per-section reserve stays the real gate. */
  async function assertCreditsFor(tenantId: string, use: CreditUse, count: number): Promise<void> {
    const status = await getCreditStatus(tenantId);
    if (!status) throw new AiCreditsError("Site not found", "not_found");
    if (status.unlimited) return;
    const needed = CREDIT_COSTS[use] * count;
    if (status.left >= needed) return;
    throw new AiCreditsError(`This needs ${needed.toLocaleString("en")} AI Credits but only ${status.left.toLocaleString("en")} are left. Buy more to keep going, or wait for next month's refill.`, "no_credits");
  }

  return { reserveCredits, refundCredits, getCreditStatus, assertCreditsFor };
}

const live = creditsWith({
  selfHosted: process.env.NEXT_PUBLIC_CMS_MODE !== "saas",
  admin: async () => (await import("@/lib/supabase/server")).createAdminClient() as unknown as SupabaseClient,
  notify: async (input) => (await import("@/lib/push/notify")).notifyTenantEvent(input),
});

export const { reserveCredits, refundCredits, getCreditStatus, assertCreditsFor } = live;

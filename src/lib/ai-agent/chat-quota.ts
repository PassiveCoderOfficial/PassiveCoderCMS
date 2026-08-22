import { createAdminClient } from "@/lib/supabase/server";
import { AiCoderQuotaError } from "@/lib/aicoder/quota";

/**
 * Agent chat metering.
 *
 * A chat turn costs one or two short completions — materially cheaper than a
 * page-content generation — so charging a full generation per message would
 * be punitive. Chat instead accrues fractional cost against the SAME monthly
 * pool the page generator uses: one number for the customer to understand,
 * one pool to top up, and no way to run up unbounded API spend on a plan
 * whose price doesn't cover it.
 *
 * 200 milli-generations = 0.2 gen per message, i.e. 5 messages per
 * generation. Basic (20/mo) gets ~100 messages if they spend nothing on page
 * generation; Biz (1000/mo) gets ~5000.
 */
const CHAT_COST_MILLI = 200;
const MILLI_PER_GENERATION = 1000;

/**
 * Hard per-tenant daily ceiling, independent of the monthly plan quota.
 * Backstop against a scripted client or a retry loop burning a month's
 * allowance in an afternoon — the monthly cap alone bounds the bill, but not
 * how fast it arrives, and a tenant who loses a month of agent access to a
 * bug of ours is a support problem regardless of who pays for the tokens.
 */
const MAX_CALLS_PER_DAY = 200;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface ChatQuotaStatus {
  monthlyIncluded: number;
  usedThisMonth: number;
  purchasedRemaining: number;
  chatMilliUsed: number;
  callsToday: number;
  maxCallsPerDay: number;
}

/**
 * Consumes one agent chat turn's worth of quota. Throws AiCoderQuotaError
 * when the tenant is out of monthly + purchased allowance, or has hit the
 * daily ceiling. Must be called BEFORE the model runs so a denied turn never
 * costs anything.
 */
export async function reserveChatTurn(tenantId: string): Promise<void> {
  const admin = await createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select(
      "plan, ai_generations_used_this_month, ai_generations_reset_at, ai_generations_purchased, ai_chat_milli_used, ai_chat_day_count, ai_chat_day_start",
    )
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenant) throw new AiCoderQuotaError("Tenant not found");

  // ── Daily ceiling (lazy reset, same approach as the monthly counter) ──
  const today = todayUtc();
  const dayCount = tenant.ai_chat_day_start === today ? tenant.ai_chat_day_count : 0;
  if (dayCount >= MAX_CALLS_PER_DAY) {
    throw new AiCoderQuotaError(
      `This site has hit its daily limit of ${MAX_CALLS_PER_DAY} AI assistant messages. It resets tomorrow.`,
    );
  }

  // ── Monthly pool (lazy reset, mirrors reserveGeneration) ──
  const now = new Date();
  let used = tenant.ai_generations_used_this_month;
  let resetAt = new Date(tenant.ai_generations_reset_at);
  if (now >= resetAt) {
    used = 0;
    resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await admin
      .from("tenants")
      .update({ ai_generations_used_this_month: 0, ai_generations_reset_at: resetAt.toISOString() })
      .eq("id", tenantId);
  }

  const { data: plan } = await admin.from("plans").select("modules").eq("id", tenant.plan).maybeSingle();
  const monthlyIncluded =
    (plan?.modules as Record<string, { monthly_generations?: number }> | null)?.ai_coder?.monthly_generations ?? 0;

  // Accrue the fractional cost; roll whole units into the generation counter.
  const nextMilli = tenant.ai_chat_milli_used + CHAT_COST_MILLI;
  const wholeGenerations = Math.floor(nextMilli / MILLI_PER_GENERATION);
  const remainderMilli = nextMilli % MILLI_PER_GENERATION;

  const patch: Record<string, unknown> = {
    ai_chat_milli_used: remainderMilli,
    ai_chat_day_count: dayCount + 1,
    ai_chat_day_start: today,
  };

  if (wholeGenerations > 0) {
    const quotaRemaining = monthlyIncluded - used;
    if (quotaRemaining >= wholeGenerations) {
      patch.ai_generations_used_this_month = used + wholeGenerations;
    } else if (tenant.ai_generations_purchased >= wholeGenerations) {
      patch.ai_generations_purchased = tenant.ai_generations_purchased - wholeGenerations;
    } else {
      throw new AiCoderQuotaError(
        monthlyIncluded === 0
          ? "AI generations aren't included in this site's plan. Purchase a top-up package to use the assistant."
          : "This month's AI generations are used up. Purchase a top-up package to keep going, or wait for next month's reset.",
      );
    }
  }

  // Conditional on the accrual counter so two concurrent turns can't both
  // debit against the same starting value.
  const { data: updated, error } = await admin
    .from("tenants")
    .update(patch)
    .eq("id", tenantId)
    .eq("ai_chat_milli_used", tenant.ai_chat_milli_used)
    .select("id")
    .maybeSingle();
  if (error) throw new AiCoderQuotaError(error.message);
  if (!updated) throw new AiCoderQuotaError("Usage changed mid-request — please try again.");
}

export async function getChatQuotaStatus(tenantId: string): Promise<ChatQuotaStatus | null> {
  const admin = await createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select(
      "plan, ai_generations_used_this_month, ai_generations_purchased, ai_chat_milli_used, ai_chat_day_count, ai_chat_day_start",
    )
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenant) return null;

  const { data: plan } = await admin.from("plans").select("modules").eq("id", tenant.plan).maybeSingle();
  const monthlyIncluded =
    (plan?.modules as Record<string, { monthly_generations?: number }> | null)?.ai_coder?.monthly_generations ?? 0;

  return {
    monthlyIncluded,
    usedThisMonth: tenant.ai_generations_used_this_month,
    purchasedRemaining: tenant.ai_generations_purchased,
    chatMilliUsed: tenant.ai_chat_milli_used,
    callsToday: tenant.ai_chat_day_start === todayUtc() ? tenant.ai_chat_day_count : 0,
    maxCallsPerDay: MAX_CALLS_PER_DAY,
  };
}

export { CHAT_COST_MILLI, MAX_CALLS_PER_DAY };

import { createAdminClient } from "@/lib/supabase/server";

export class AiCoderQuotaError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Checks and consumes one generation from the tenant's AiCoder quota.
 * Quota pool (this month's included generations) drains first, then the
 * purchased top-up pool. Throws AiCoderQuotaError if both are exhausted —
 * callers must check this BEFORE calling the model, not after, so a denied
 * request never costs anything.
 *
 * The monthly counter resets lazily here (check-and-reset-if-past-due)
 * rather than via a cron job — correct as long as at least one call happens
 * after the period rolls over, which is exactly when it matters.
 */
export async function reserveGeneration(tenantId: string, blockType: string, userId: string | null): Promise<"quota" | "purchased"> {
  const admin = await createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("plan, ai_generations_used_this_month, ai_generations_reset_at, ai_generations_purchased")
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenant) throw new AiCoderQuotaError("Tenant not found");

  const { data: plan } = await admin.from("plans").select("modules").eq("id", tenant.plan).maybeSingle();
  const monthlyIncluded = (plan?.modules as Record<string, { monthly_generations?: number }> | null)
    ?.ai_coder?.monthly_generations ?? 0;

  const now = new Date();
  let used = tenant.ai_generations_used_this_month;
  let resetAt = new Date(tenant.ai_generations_reset_at);

  // Lazy monthly reset — if the stored reset date has passed, this call is
  // the first one of the new period, so zero the counter now.
  if (now >= resetAt) {
    used = 0;
    resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await admin.from("tenants").update({
      ai_generations_used_this_month: 0,
      ai_generations_reset_at: resetAt.toISOString(),
    }).eq("id", tenantId);
  }

  const quotaRemaining = monthlyIncluded - used;
  let source: "quota" | "purchased";

  // Conditional UPDATE (not read-then-write) so two concurrent requests
  // can't both succeed past the same last unit of quota — the second one's
  // WHERE clause simply matches zero rows if the first already consumed it.
  if (quotaRemaining > 0) {
    source = "quota";
    const { data: updated, error } = await admin
      .from("tenants")
      .update({ ai_generations_used_this_month: used + 1 })
      .eq("id", tenantId)
      .eq("ai_generations_used_this_month", used)
      .select("id")
      .maybeSingle();
    if (error) throw new AiCoderQuotaError(error.message);
    if (!updated) throw new AiCoderQuotaError("Quota changed mid-request — please try again.");
  } else if (tenant.ai_generations_purchased > 0) {
    source = "purchased";
    const { data: updated, error } = await admin
      .from("tenants")
      .update({ ai_generations_purchased: tenant.ai_generations_purchased - 1 })
      .eq("id", tenantId)
      .eq("ai_generations_purchased", tenant.ai_generations_purchased)
      .select("id")
      .maybeSingle();
    if (error) throw new AiCoderQuotaError(error.message);
    if (!updated) throw new AiCoderQuotaError("Quota changed mid-request — please try again.");
  } else {
    throw new AiCoderQuotaError(
      monthlyIncluded === 0
        ? "AiCoder generations aren't included in this site's plan. Purchase a top-up package to use AiCoder."
        : "This month's AiCoder generations are used up. Purchase a top-up package to keep going, or wait for next month's reset.",
    );
  }

  await admin.from("ai_generation_log").insert({
    tenant_id: tenantId,
    user_id: userId,
    block_type: blockType,
    source,
  });

  return source;
}

/** Undoes a reservation when generation fails after quota was already
 *  consumed — an upstream/model error shouldn't cost the tenant a
 *  generation they never received. Best-effort; a failed refund just means
 *  the tenant is out one generation on a rare double-failure, not a
 *  correctness issue worth blocking the error response over. */
export async function refundGeneration(tenantId: string, source: "quota" | "purchased"): Promise<void> {
  const admin = await createAdminClient();
  const column = source === "quota" ? "ai_generations_used_this_month" : "ai_generations_purchased";
  const { data } = await admin.from("tenants").select(column).eq("id", tenantId).maybeSingle();
  const current = (data as Record<string, number> | null)?.[column] ?? 0;
  const next = source === "quota" ? Math.max(0, current - 1) : current + 1;
  await admin.from("tenants").update({ [column]: next }).eq("id", tenantId);
}

/**
 * Confirms a tenant could afford `count` generations before a batch run starts.
 *
 * Full-page generation costs a dozen-plus generations, and reserving them one
 * at a time means a tenant with 4 left gets 4 sections and a hard stop halfway
 * through a page — worse than being told up front. This is an advisory check,
 * not a reservation: the per-generation reserve still happens inside the loop
 * and remains the actual race-safe gate. A concurrent run can still exhaust the
 * pool between this check and the loop; that surfaces as a partial page with a
 * clear per-section error, which the caller already handles.
 */
export async function assertBatchAffordable(tenantId: string, count: number): Promise<void> {
  const status = await getQuotaStatus(tenantId);
  if (!status) throw new AiCoderQuotaError("Tenant not found");

  const available = Math.max(0, status.monthlyIncluded - status.usedThisMonth) + status.purchasedRemaining;
  if (available >= count) return;

  throw new AiCoderQuotaError(
    `This page needs ${count} generations but only ${available} are left. ` +
    (status.monthlyIncluded === 0
      ? "AiCoder generations aren't included in this site's plan — purchase a top-up package to continue."
      : "Purchase a top-up package to continue, or wait for next month's reset."),
  );
}

export interface QuotaStatus {
  monthlyIncluded: number;
  usedThisMonth: number;
  purchasedRemaining: number;
  resetAt: string;
}

export async function getQuotaStatus(tenantId: string): Promise<QuotaStatus | null> {
  const admin = await createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("plan, ai_generations_used_this_month, ai_generations_reset_at, ai_generations_purchased")
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenant) return null;

  const { data: plan } = await admin.from("plans").select("modules").eq("id", tenant.plan).maybeSingle();
  const monthlyIncluded = (plan?.modules as Record<string, { monthly_generations?: number }> | null)
    ?.ai_coder?.monthly_generations ?? 0;

  return {
    monthlyIncluded,
    usedThisMonth: tenant.ai_generations_used_this_month,
    purchasedRemaining: tenant.ai_generations_purchased,
    resetAt: tenant.ai_generations_reset_at,
  };
}

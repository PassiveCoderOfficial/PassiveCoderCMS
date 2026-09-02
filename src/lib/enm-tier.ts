// Pure plan → ENM tier mapping, safe to import from client components.
// Kept out of lib/enm.ts because that module holds PARTNER_SECRET and must
// never reach the browser.

export type ENMTier = "free" | "pro";

/**
 * The ENM tier a CMS plan entitles you to.
 *
 * Every plan gets at least a free ENM listing; Pro and Biz include ENM Pro.
 * This is the single source of truth — the rule was previously inlined at four
 * call sites and three of them had missed Biz, so a Biz customer paid for the
 * bundle and silently received the free tier.
 */
export function enmTierForPlan(planId: string | null | undefined): ENMTier {
  return planId === "pro" || planId === "biz" ? "pro" : "free";
}

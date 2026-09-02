import { createAdminClient } from "@/lib/supabase/server";

/**
 * Obvious non-humans. The plan allowance is sold as "visitors", so counting
 * Googlebot against a customer's limit would be wrong — and would warn them
 * about traffic they never received.
 *
 * Deliberately conservative: this catches the high-volume crawlers and
 * monitors, not every possible bot. Missing one inflates a count slightly;
 * matching too eagerly would hide real visitors, which is worse.
 */
const BOT_PATTERN =
  /bot|crawler|spider|crawl|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|monitor|uptime|pingdom|headless|lighthouse|curl|wget|python-requests|axios|node-fetch|postman|vercel-screenshot|semrush|ahrefs|mj12|dotbot|petalbot|gptbot|claudebot|ccbot/i;

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true; // no UA at all is a script far more often than a person
  return BOT_PATTERN.test(userAgent);
}

/**
 * Record one pageview against the tenant's monthly allowance.
 *
 * Never throws and never blocks: call it from `after()`. A failure here must
 * cost nothing — the counter exists to warn an owner they are outgrowing their
 * plan, and no part of that is worth an error on a customer's public site.
 */
export async function countVisit(tenantId: string, userAgent: string | null): Promise<void> {
  if (isBot(userAgent)) return;
  try {
    const admin = await createAdminClient();
    await admin.rpc("bump_tenant_views", { t: tenantId, n: 1 });
  } catch {
    // Intentionally silent — see above.
  }
}

import { createAdminClient } from "@/lib/supabase/server";
import { isBot } from "./count-visit";

/** Coarse device class from the UA — enough for a device-split chart, not
 *  meant to be exact. False positives toward "unknown" are fine; the panel
 *  never needs finer granularity than this. */
function deviceType(userAgent: string | null): "desktop" | "mobile" | "tablet" | "unknown" {
  if (!userAgent) return "unknown";
  if (/ipad|tablet(?!.*mobile)/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

/** Registrable domain from a referrer URL — "google.com", "facebook.com" —
 *  never the full URL. A full referrer can carry the referring page's own
 *  query params or tracking ids, which isn't data we have any business
 *  storing. Same-origin referrers (a visitor clicking within the tenant's own
 *  site) are dropped entirely — "referred by yourself" isn't a stat anyone
 *  wants and would otherwise dominate the top-referrers list. */
function referrerDomain(referrer: string | null, ownHost: string | null): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    const host = url.hostname.replace(/^www\./, "");
    if (ownHost && host === ownHost.replace(/^www\./, "")) return null;
    // Reduce to the registrable-ish tail: keep it simple, two labels, which
    // is right for the overwhelming majority of real referrers (google.com,
    // facebook.com, bing.com) without pulling in a public-suffix-list
    // dependency for a stat that only needs to be roughly right.
    const parts = host.split(".");
    return parts.length > 2 ? parts.slice(-2).join(".") : host;
  } catch {
    return null;
  }
}

/**
 * Records one pageview into the aggregate stats table for the dashboard
 * analytics panel. Separate from countVisit (count-visit.ts), which feeds the
 * plan's billing allowance and must never be touched by this — a failure or
 * change here must never affect what a tenant is billed for.
 *
 * Same never-throws, never-blocks contract: call from `after()`.
 */
export async function recordPageView(
  tenantId: string,
  path: string,
  userAgent: string | null,
  referrer: string | null,
  ownHost: string | null,
  country: string | null,
): Promise<void> {
  if (isBot(userAgent)) return;
  try {
    const admin = await createAdminClient();
    await admin.rpc("bump_page_view_stats", {
      t: tenantId,
      p_path: path || "/",
      p_referrer_domain: referrerDomain(referrer, ownHost),
      p_device_type: deviceType(userAgent),
      p_country: country,
    });
  } catch {
    // Intentionally silent — a stats panel is never worth failing a
    // customer's site over.
  }
}

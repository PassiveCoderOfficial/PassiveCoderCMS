import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getValidGoogleAccessToken } from "@/lib/analytics/google";
import { publicUrl } from "@/lib/tenant/site-urls";
import { rootTenantId } from "@/lib/site/root-builder";
import { sitemapEntries } from "@/lib/seo/sitemap-entries";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * One-click Google Search Console, riding on the site's Google connection
 * (same grant as Analytics, extra scopes). setupSearchConsole() does
 * everything an SEO person would do by hand:
 *   1. asks Google's Site Verification API for a meta-tag token,
 *   2. saves it to site_settings.google_site_verification (rendered in <head>),
 *   3. verifies ownership, adds the site to Search Console, submits the sitemap.
 * Google offers no "index this page now" for ordinary pages, so the sitemap
 * plus per-page index checks is the whole legitimate toolset.
 */
export const GSC_SCOPES = [
  "https://www.googleapis.com/auth/webmasters",
  "https://www.googleapis.com/auth/siteverification",
];

export function hasGscScopes(scopes: string | null | undefined) {
  return !!scopes && GSC_SCOPES.every((s) => scopes.includes(s));
}

async function g<T = unknown>(token: string, url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  const text = await res.text();
  let j: Record<string, unknown> = {};
  try { j = text ? JSON.parse(text) : {}; } catch { /* empty or non-JSON */ }
  if (!res.ok) {
    const msg = (j.error as { message?: string } | undefined)?.message ?? text.slice(0, 200);
    console.error("[gsc]", init.method ?? "GET", url.replace(/\?.*/, ""), res.status, msg);
    throw new Error(`Google (${res.status}): ${msg}`);
  }
  return j as T;
}

const WM = "https://www.googleapis.com/webmasters/v3/sites";
const enc = encodeURIComponent;

/** The site's public home URL with trailing slash: the URL-prefix property. */
export async function siteHomeUrl(admin: SupabaseClient, tenantId: string) {
  const { data: t } = await admin.from("tenants").select("slug, custom_domain, domain_status").eq("id", tenantId).maybeSingle();
  if (!t) return null;
  // The root site is served on the bare root domain (www 308s there when
  // CANONICAL_APEX=1), not on its tenant subdomain.
  if ((await rootTenantId().catch(() => null)) === tenantId) {
    const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com").split(":")[0];
    return process.env.CANONICAL_APEX === "1" ? `https://${root}/` : `https://www.${root}/`;
  }
  return publicUrl({ slug: t.slug as string, custom_domain: t.domain_status === "active" ? (t.custom_domain as string | null) : null }, "/");
}

/**
 * Platform-managed Search Console: most owners never connect Google, so the
 * platform's own Google connection (the root site's) can verify and run
 * Search Console for any site. tenant_integrations.gsc_platform says which
 * account owns a site's property; every Google call below uses that one.
 */
export async function platformGoogleReady() {
  const rootId = await rootTenantId().catch(() => null);
  if (!rootId) return false;
  const admin = await createAdminClient();
  const { data } = await admin.from("tenant_integrations").select("ga_oauth_refresh_token, google_scopes").eq("tenant_id", rootId).maybeSingle();
  return !!data?.ga_oauth_refresh_token && hasGscScopes(data.google_scopes as string | null);
}

/** The Google token that owns this site's Search Console property. */
async function gscToken(tenantId: string): Promise<string | null> {
  const admin = await createAdminClient();
  const { data } = await admin.from("tenant_integrations").select("gsc_platform").eq("tenant_id", tenantId).maybeSingle();
  if (data?.gsc_platform) {
    const rootId = await rootTenantId().catch(() => null);
    return rootId ? getValidGoogleAccessToken(rootId) : null;
  }
  return getValidGoogleAccessToken(tenantId);
}

/**
 * Verifies the site, adds it to Search Console and submits the sitemap.
 * Uses the owner's own Google connection when it has Search Console access,
 * otherwise (or with via: "platform") the platform's Google account, whose
 * meta tag goes in its own column so the owner's tag is never touched.
 */
export async function setupSearchConsole(admin: SupabaseClient, tenantId: string, { via }: { via?: "owner" | "platform" } = {}) {
  const rootId = await rootTenantId().catch(() => null);
  const { data: own } = await admin.from("tenant_integrations").select("ga_oauth_refresh_token, google_scopes").eq("tenant_id", tenantId).maybeSingle();
  const ownReady = !!own?.ga_oauth_refresh_token && hasGscScopes(own.google_scopes as string | null);
  const platform = tenantId !== rootId && (via === "platform" || (!via && !ownReady));
  const token = platform ? (rootId ? await getValidGoogleAccessToken(rootId) : null) : await getValidGoogleAccessToken(tenantId);
  if (!token) throw new Error(platform ? "The platform's Google account isn't connected. Connect Google on the main site first." : "Google isn't connected, or the connection was revoked. Connect Google again.");
  const siteUrl = await siteHomeUrl(admin, tenantId);
  if (!siteUrl) throw new Error("Site not found");
  const site = { type: "SITE", identifier: siteUrl };
  try {
    // 1-2. Meta-tag token into the site's <head>.
    const tok = await g<{ token: string }>(token, "https://www.googleapis.com/siteVerification/v1/token", {
      method: "POST", body: { site, verificationMethod: "META" },
    });
    const content = tok.token.match(/content="([^"]+)"/)?.[1] ?? tok.token;
    await admin.from("site_settings").upsert(
      { tenant_id: tenantId, ...(platform ? { platform_google_verification: content } : { google_site_verification: content }) },
      { onConflict: "tenant_id" },
    );
    // Give the page a moment to serve the new tag before Google fetches it.
    await new Promise((r) => setTimeout(r, 1500));
    // 3. Verify ownership, add the property, submit the sitemap.
    await g(token, "https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=META", { method: "POST", body: { site } });
    await g(token, `${WM}/${enc(siteUrl)}`, { method: "PUT" });
    await g(token, `${WM}/${enc(siteUrl)}/sitemaps/${enc(`${siteUrl}sitemap.xml`)}`, { method: "PUT" });
    const now = new Date().toISOString();
    await admin.from("tenant_integrations").upsert(
      { tenant_id: tenantId, gsc_site_url: siteUrl, gsc_verified_at: now, gsc_sitemap_at: now, gsc_error: null, gsc_platform: platform },
      { onConflict: "tenant_id" },
    );
    return { siteUrl, platform };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Search Console setup failed";
    await admin.from("tenant_integrations").upsert({ tenant_id: tenantId, gsc_error: msg }, { onConflict: "tenant_id" });
    throw e;
  }
}

export async function resubmitSitemap(tenantId: string, siteUrl: string) {
  const token = await gscToken(tenantId);
  if (!token) return false;
  await g(token, `${WM}/${enc(siteUrl)}/sitemaps/${enc(`${siteUrl}sitemap.xml`)}`, { method: "PUT" });
  return true;
}

export type SearchRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

/** Last 28 days: totals, top queries, top pages. Search data lags ~2 days. */
export async function searchPerformance(tenantId: string, siteUrl: string) {
  const token = await gscToken(tenantId);
  if (!token) throw new Error("Google connection expired. Connect Google again.");
  const day = (n: number) => new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);
  const range = { startDate: day(30), endDate: day(2) };
  const q = (body: Record<string, unknown>) =>
    g<{ rows?: SearchRow[] }>(token, `${WM}/${enc(siteUrl)}/searchAnalytics/query`, { method: "POST", body: { ...range, ...body } });
  const [total, queries, pages] = await Promise.all([q({}), q({ dimensions: ["query"], rowLimit: 15 }), q({ dimensions: ["page"], rowLimit: 15 })]);
  return { range, total: total.rows?.[0] ?? null, queries: queries.rows ?? [], pages: pages.rows ?? [] };
}

export type IndexState = {
  url: string; title?: string; kind?: string;
  verdict: string; coverage: string; lastCrawl: string | null; checkedAt?: string;
};
export type IndexReport = { at: string; total: number; pages: IndexState[] };

/** Google's own page for one URL, where the owner clicks "Request indexing". */
export function inspectLink(siteUrl: string, url: string) {
  return `https://search.google.com/search-console/inspect?resource_id=${enc(siteUrl)}&id=${enc(url)}`;
}

const HOUR = 3600_000;
/** When a page is due for another look: missing pages daily, indexed ones weekly. */
function dueAt(p: IndexState | undefined) {
  if (!p?.checkedAt) return 0;
  return new Date(p.checkedAt).getTime() + (p.verdict === "PASS" ? 7 * 24 * HOUR : 20 * HOUR);
}

/**
 * Google's index status for every page in the site's sitemap. The URL
 * Inspection API allows 2,000 checks a day and 600 a minute per site, so
 * each run checks at most `max` pages, oldest result first (never checked,
 * then missing pages after a day, then indexed pages after a week), and
 * keeps the earlier results for the rest. Pages that left the sitemap drop
 * out of the report.
 */
export async function inspectPages(
  admin: SupabaseClient, tenantId: string, siteUrl: string,
  { max = 100, budgetMs = 45_000 }: { max?: number; budgetMs?: number } = {},
): Promise<IndexReport> {
  const token = await gscToken(tenantId);
  if (!token) throw new Error("Google connection expired. Connect Google again.");
  const started = Date.now();
  const entries = (await sitemapEntries(new URL(siteUrl).host)).filter((e) => e.url.startsWith(siteUrl.replace(/\/$/, "")));
  const { data: row } = await admin.from("tenant_integrations").select("gsc_index").eq("tenant_id", tenantId).maybeSingle();
  const prev = new Map(((row?.gsc_index as IndexReport | null)?.pages ?? []).map((p) => [p.url, p]));
  const now = Date.now();
  const due = entries
    .filter((e) => dueAt(prev.get(e.url)) <= now)
    .sort((a, b) => dueAt(prev.get(a.url)) - dueAt(prev.get(b.url)) || b.priority - a.priority)
    .slice(0, max);

  const fresh = new Map<string, IndexState>();
  let i = 0;
  // A few at a time: well under Google's 600/minute, done inside one request.
  const worker = async () => {
    while (i < due.length && Date.now() - started < budgetMs) {
      const e = due[i++];
      try {
        const r = await g<{ inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string } } }>(
          token, "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", { method: "POST", body: { inspectionUrl: e.url, siteUrl } },
        );
        const s = r.inspectionResult?.indexStatusResult;
        fresh.set(e.url, { url: e.url, verdict: s?.verdict ?? "UNKNOWN", coverage: s?.coverageState ?? "", lastCrawl: s?.lastCrawlTime ?? null, checkedAt: new Date().toISOString() });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        // Daily quota used up: stop, keep what we have.
        if (/\(429\)|quota/i.test(msg)) { i = due.length; break; }
        fresh.set(e.url, { url: e.url, verdict: "ERROR", coverage: msg, lastCrawl: null, checkedAt: new Date().toISOString() });
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));

  const pages = entries.flatMap((e) => {
    const p = fresh.get(e.url) ?? prev.get(e.url);
    return p ? [{ ...p, title: e.title, kind: e.kind }] : [];
  });
  const report: IndexReport = { at: new Date().toISOString(), total: entries.length, pages };
  await admin.from("tenant_integrations").update({ gsc_index: report }).eq("tenant_id", tenantId);
  return report;
}

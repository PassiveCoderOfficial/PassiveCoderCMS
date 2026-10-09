import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getValidGoogleAccessToken } from "@/lib/analytics/google";
import { publicUrl } from "@/lib/tenant/site-urls";

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
  return publicUrl({ slug: t.slug as string, custom_domain: t.domain_status === "active" ? (t.custom_domain as string | null) : null }, "/");
}

export async function setupSearchConsole(admin: SupabaseClient, tenantId: string) {
  const token = await getValidGoogleAccessToken(tenantId);
  if (!token) throw new Error("Google isn't connected, or the connection was revoked. Connect Google again.");
  const siteUrl = await siteHomeUrl(admin, tenantId);
  if (!siteUrl) throw new Error("Site not found");
  const site = { type: "SITE", identifier: siteUrl };
  try {
    // 1-2. Meta-tag token into the site's <head>.
    const tok = await g<{ token: string }>(token, "https://www.googleapis.com/siteVerification/v1/token", {
      method: "POST", body: { site, verificationMethod: "META" },
    });
    const content = tok.token.match(/content="([^"]+)"/)?.[1] ?? tok.token;
    await admin.from("site_settings").upsert({ tenant_id: tenantId, google_site_verification: content }, { onConflict: "tenant_id" });
    // Give the page a moment to serve the new tag before Google fetches it.
    await new Promise((r) => setTimeout(r, 1500));
    // 3. Verify ownership, add the property, submit the sitemap.
    await g(token, "https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=META", { method: "POST", body: { site } });
    await g(token, `${WM}/${enc(siteUrl)}`, { method: "PUT" });
    await g(token, `${WM}/${enc(siteUrl)}/sitemaps/${enc(`${siteUrl}sitemap.xml`)}`, { method: "PUT" });
    const now = new Date().toISOString();
    await admin.from("tenant_integrations").update({ gsc_site_url: siteUrl, gsc_verified_at: now, gsc_sitemap_at: now, gsc_error: null }).eq("tenant_id", tenantId);
    return { siteUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Search Console setup failed";
    await admin.from("tenant_integrations").update({ gsc_error: msg }).eq("tenant_id", tenantId);
    throw e;
  }
}

export async function resubmitSitemap(tenantId: string, siteUrl: string) {
  const token = await getValidGoogleAccessToken(tenantId);
  if (!token) return false;
  await g(token, `${WM}/${enc(siteUrl)}/sitemaps/${enc(`${siteUrl}sitemap.xml`)}`, { method: "PUT" });
  return true;
}

export type SearchRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

/** Last 28 days: totals, top queries, top pages. Search data lags ~2 days. */
export async function searchPerformance(tenantId: string, siteUrl: string) {
  const token = await getValidGoogleAccessToken(tenantId);
  if (!token) throw new Error("Google connection expired. Connect Google again.");
  const day = (n: number) => new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);
  const range = { startDate: day(30), endDate: day(2) };
  const q = (body: Record<string, unknown>) =>
    g<{ rows?: SearchRow[] }>(token, `${WM}/${enc(siteUrl)}/searchAnalytics/query`, { method: "POST", body: { ...range, ...body } });
  const [total, queries, pages] = await Promise.all([q({}), q({ dimensions: ["query"], rowLimit: 15 }), q({ dimensions: ["page"], rowLimit: 15 })]);
  return { range, total: total.rows?.[0] ?? null, queries: queries.rows ?? [], pages: pages.rows ?? [] };
}

export type IndexState = { url: string; verdict: string; coverage: string; lastCrawl: string | null };

/** Google's index status for up to 20 of the site's pages (quota: 2,000/day per site). */
export async function inspectPages(admin: SupabaseClient, tenantId: string, siteUrl: string): Promise<IndexState[]> {
  const token = await getValidGoogleAccessToken(tenantId);
  if (!token) throw new Error("Google connection expired. Connect Google again.");
  const { data: pages } = await admin.from("pages").select("slug, seo").eq("tenant_id", tenantId)
    .eq("status", "published").is("deleted_at", null).order("updated_at", { ascending: false }).limit(40);
  const urls = (pages ?? [])
    .filter((p) => !(p.seo as { no_index?: boolean } | null)?.no_index)
    .map((p) => (p.slug === "home" ? siteUrl : `${siteUrl}${p.slug}`))
    .slice(0, 20);
  const out: IndexState[] = [];
  for (const url of urls) {
    try {
      const r = await g<{ inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string } } }>(
        token, "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", { method: "POST", body: { inspectionUrl: url, siteUrl } },
      );
      const s = r.inspectionResult?.indexStatusResult;
      out.push({ url, verdict: s?.verdict ?? "UNKNOWN", coverage: s?.coverageState ?? "", lastCrawl: s?.lastCrawlTime ?? null });
    } catch (e) {
      out.push({ url, verdict: "ERROR", coverage: e instanceof Error ? e.message : "", lastCrawl: null });
    }
  }
  await admin.from("tenant_integrations").update({ gsc_index: { at: new Date().toISOString(), pages: out } }).eq("tenant_id", tenantId);
  return out;
}

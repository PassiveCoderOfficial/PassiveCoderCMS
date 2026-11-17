import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import { siteHomeUrl } from "@/lib/seo/search-console";

/**
 * One-click Bing Webmaster Tools (ChatGPT search and Copilot answer from
 * Bing's index). The owner approves once; setupBing() adds the site, puts
 * Bing's msvalidate.01 tag in <head> (site_settings.bing_site_verification),
 * verifies, and submits the sitemap. Platform OAuth client in env
 * BING_CLIENT_ID / BING_CLIENT_SECRET, registered at bing.com/webmasters.
 */
const API = "https://www.bing.com/webmaster/api.svc/json";
const TOKEN_URL = "https://www.bing.com/webmasters/oauth/token";

export function bingConfigured() {
  return !!(process.env.BING_CLIENT_ID && process.env.BING_CLIENT_SECRET);
}

/** Must match the redirect URI registered with Bing exactly. */
export function bingRedirectUri() {
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com").split(":")[0];
  return root.includes("localhost") ? `http://${root}/api/seo/bing/callback` : `https://www.${root}/api/seo/bing/callback`;
}

export function bingAuthorizeUrl(state: string) {
  const q = new URLSearchParams({
    response_type: "code", client_id: process.env.BING_CLIENT_ID ?? "",
    redirect_uri: bingRedirectUri(), scope: "webmaster.manage", state,
  });
  return `https://www.bing.com/webmasters/oauth/authorize?${q}`;
}

async function tokenRequest(params: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.BING_CLIENT_ID ?? "", client_secret: process.env.BING_CLIENT_SECRET ?? "", ...params }),
  });
  const j = await res.json().catch(() => ({})) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !j.access_token) throw new Error(`Bing sign-in failed: ${j.error_description ?? j.error ?? res.status}`);
  return j;
}

export async function bingExchangeCode(code: string) {
  return tokenRequest({ grant_type: "authorization_code", code, redirect_uri: bingRedirectUri() });
}

async function bingToken(tenantId: string): Promise<string> {
  const admin = await createAdminClient();
  const { data: i } = await admin.from("tenant_integrations").select("bing_refresh_token, bing_access_token, bing_expires_at").eq("tenant_id", tenantId).maybeSingle();
  if (!i?.bing_refresh_token) throw new Error("Bing isn't connected. Click Connect Bing.");
  if (i.bing_access_token && i.bing_expires_at && new Date(i.bing_expires_at).getTime() - Date.now() > 60_000) return i.bing_access_token;
  const j = await tokenRequest({ grant_type: "refresh_token", refresh_token: i.bing_refresh_token }).catch(() => {
    throw new Error("Bing connection expired or was removed. Connect Bing again.");
  });
  await admin.from("tenant_integrations").update({
    bing_access_token: j.access_token,
    bing_expires_at: new Date(Date.now() + (j.expires_in ?? 3600) * 1000).toISOString(),
    ...(j.refresh_token ? { bing_refresh_token: j.refresh_token } : {}),
  }).eq("tenant_id", tenantId);
  return j.access_token!;
}

/** Calls the Webmaster JSON API; returns the unwrapped `d` value. */
async function bing<T = unknown>(tenantId: string, method: string, body?: Record<string, unknown>, query?: Record<string, string>): Promise<T> {
  const token = await bingToken(tenantId);
  const res = await fetch(`${API}/${method}${query ? `?${new URLSearchParams(query)}` : ""}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let j: { d?: T; Message?: string; ErrorCode?: number } = {};
  try { j = text ? JSON.parse(text) : {}; } catch { /* not JSON */ }
  if (!res.ok) {
    console.error("[bing]", method, res.status, text.slice(0, 300));
    throw new Error(`Bing (${res.status} on ${method}): ${j.Message ?? text.slice(0, 160)}`);
  }
  return j.d as T;
}

type BingSite = { Url: string; IsVerified: boolean; AuthenticationCode?: string };

export async function setupBing(admin: SupabaseClient, tenantId: string) {
  const siteUrl = await siteHomeUrl(admin, tenantId);
  if (!siteUrl) throw new Error("Site not found");
  const same = (u: string) => u.replace(/\/$/, "").toLowerCase() === siteUrl.replace(/\/$/, "").toLowerCase();
  try {
    let site = (await bing<BingSite[]>(tenantId, "GetUserSites")).find((s) => same(s.Url));
    if (!site) {
      await bing(tenantId, "AddSite", { siteUrl });
      site = (await bing<BingSite[]>(tenantId, "GetUserSites")).find((s) => same(s.Url));
    }
    if (!site) throw new Error("Bing didn't add the site. Try again in a minute.");
    if (!site.IsVerified) {
      if (!site.AuthenticationCode) throw new Error("Bing didn't return a verification code.");
      await admin.from("site_settings").upsert({ tenant_id: tenantId, bing_site_verification: site.AuthenticationCode }, { onConflict: "tenant_id" });
      await new Promise((r) => setTimeout(r, 1500));
      const ok = await bing<boolean>(tenantId, "VerifySite", { siteUrl: site.Url });
      if (ok === false) throw new Error("Bing couldn't verify the site yet. The tag is in place; click Retry in a few minutes.");
    }
    await bing(tenantId, "SubmitFeed", { siteUrl: site.Url, feedUrl: `${siteUrl}sitemap.xml` });
    const now = new Date().toISOString();
    await admin.from("tenant_integrations").update({ bing_site_url: site.Url, bing_verified_at: now, bing_sitemap_at: now, bing_error: null }).eq("tenant_id", tenantId);
    return { siteUrl: site.Url };
  } catch (e) {
    await admin.from("tenant_integrations").update({ bing_error: e instanceof Error ? e.message : "Bing setup failed" }).eq("tenant_id", tenantId);
    throw e;
  }
}

export async function bingSubmitSitemap(tenantId: string, siteUrl: string) {
  await bing(tenantId, "SubmitFeed", { siteUrl, feedUrl: `${siteUrl.replace(/\/$/, "")}/sitemap.xml` });
}

const asDate = (v: string) => new Date(Number(v.match(/\d+/)?.[0] ?? 0));

/** Last ~28 days of Bing search: totals and top queries. */
export async function bingStats(tenantId: string, siteUrl: string) {
  const since = Date.now() - 28 * 86400_000;
  const [traffic, queries] = await Promise.all([
    bing<{ Date: string; Clicks: number; Impressions: number }[]>(tenantId, "GetRankAndTrafficStats", undefined, { siteUrl }),
    bing<{ Query: string; Date: string; Clicks: number; Impressions: number; AvgImpressionPosition: number }[]>(tenantId, "GetQueryStats", undefined, { siteUrl }),
  ]);
  const recent = (traffic ?? []).filter((t) => asDate(t.Date).getTime() >= since);
  const totals = recent.reduce((a, t) => ({ clicks: a.clicks + t.Clicks, impressions: a.impressions + t.Impressions }), { clicks: 0, impressions: 0 });
  const byQuery = new Map<string, { query: string; clicks: number; impressions: number }>();
  for (const q of queries ?? []) {
    if (asDate(q.Date).getTime() < since) continue;
    const r = byQuery.get(q.Query) ?? { query: q.Query, clicks: 0, impressions: 0 };
    r.clicks += q.Clicks; r.impressions += q.Impressions;
    byQuery.set(q.Query, r);
  }
  return { totals, queries: [...byQuery.values()].sort((a, b) => b.impressions - a.impressions).slice(0, 15) };
}

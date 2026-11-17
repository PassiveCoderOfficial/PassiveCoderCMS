import { createAdminClient, createProxyClient } from "@/lib/supabase/server";

/**
 * Site redirects (Settings > Redirects, and each page's "Also reachable at"),
 * applied in the proxy for every host before any page renders. Rules are
 * cached per site for 60s so normal page loads cost no database call.
 *
 * from_path: path without leading slash ("bd", "offer/2026").
 * Target: to_url (any URL, external or "/path") else to_path (page slug, "home" = /).
 */
export type RedirectRule = { id: string; from_path: string; to_path: string | null; to_url: string | null; status_code: number };

const TTL = 60_000;
const cache = new Map<string, { at: number; rules: Map<string, RedirectRule> }>();

export const normPath = (p: string) => decodeURIComponent(p).trim().replace(/^\/+|\/+$/g, "").toLowerCase();

export function clearRedirectCache(tenantId: string) { cache.delete(tenantId); }

async function rulesFor(tenantId: string) {
  const hit = cache.get(tenantId);
  if (hit && Date.now() - hit.at < TTL) return hit.rules;
  const { data, error } = await createProxyClient().from("page_redirects").select("id, from_path, to_path, to_url, status_code").eq("tenant_id", tenantId).limit(2000);
  // Database unreachable: keep the rules we had rather than dropping every redirect.
  if (error) { if (hit) { hit.at = Date.now(); return hit.rules; } throw new Error(error.message); }
  const rules = new Map((data ?? []).map((r) => [normPath(r.from_path as string), r as RedirectRule]));
  cache.set(tenantId, { at: Date.now(), rules });
  return rules;
}

/** The rule for this path, if any, with its resolved destination. */
export async function findRedirect(tenantId: string, pathname: string): Promise<{ rule: RedirectRule; to: string } | null> {
  const key = normPath(pathname);
  if (!key) return null;
  const rule = (await rulesFor(tenantId).catch(() => null))?.get(key);
  if (!rule) return null;
  const to = rule.to_url?.trim() || (rule.to_path ? (rule.to_path === "home" ? "/" : `/${rule.to_path.replace(/^\/+/, "")}`) : null);
  if (!to || normPath(to) === key) return null;
  return { rule, to };
}

/** The platform's own site (served on the root domain) is a tenant too. */
let rootId: { at: number; id: string | null } | null = null;
export async function rootTenantId(slug: string) {
  if (rootId && Date.now() - rootId.at < 10 * TTL) return rootId.id;
  const { data, error } = await createProxyClient().from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (error) { if (rootId) return rootId.id; throw new Error(error.message); }
  rootId = { at: Date.now(), id: (data?.id as string) ?? null };
  return rootId.id;
}

export async function countRedirectHit(id: string) {
  const admin = await createAdminClient();
  const { data } = await admin.from("page_redirects").select("hits").eq("id", id).maybeSingle();
  await admin.from("page_redirects").update({ hits: ((data?.hits as number) ?? 0) + 1 }).eq("id", id);
}

/** Paths a redirect may never take over (dashboard, auth, system routes). */
export const RESERVED_PREFIXES = ["dashboard", "login", "signup", "register", "auth", "api", "_next", "onboarding", "super-admin", "staff", "forgot-password", "reset-password", "pm", "sitemap.xml", "sitemap.xsl", "sitemap.html", "robots.txt", "llms.txt", "favicon.ico"];
export const isReservedPath = (p: string) => { const k = normPath(p); return !k || RESERVED_PREFIXES.some((r) => k === r || k.startsWith(`${r}/`)); };

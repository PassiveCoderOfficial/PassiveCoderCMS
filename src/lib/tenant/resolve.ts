import { createProxyClient } from "@/lib/supabase/server";
import { PUBLIC_RENDER_HEADER, PUBLIC_RENDER_TOKEN } from "@/lib/supabase/public-render-token";
import { ROOT_DOMAIN, isSaaS } from "@/lib/flags";
import { getStandaloneTenant } from "@/lib/tenant/standalone";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: string;
  status: string;
  custom_domain: string | null;
  domain_status: string;
  onboarding_completed: boolean;
  /** Non-null = staff-built demo; public site pauses after this. */
  demo_expires_at: string | null;
  /** Non-null = on the free trial (lib/sites/trial.ts): not indexed by search engines. */
  trial_ends_at: string | null;
  /** Email shortcuts (/webmail, /cpanel, /mail): lib/tenant/mail-shortcuts.ts. */
  mail_host_type?: string | null;
  mail_shortcuts_enabled?: boolean | null;
  mail_shortcut_targets?: { webmail?: string; cpanel?: string } | null;
  /** Set only when the host is an alias domain (tenant_alias_domains):
   *  every request there 301s to the primary host under this path prefix. */
  alias?: { prefix: string; primaryHost: string } | null;
}

export type AliasRow = { domain: string; path_prefix: string; tenant: Tenant };

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { tenant: Tenant | null; expiresAt: number }>();

export const TENANT_COLS = "id,slug,name,plan,status,custom_domain,domain_status,onboarding_completed,demo_expires_at,trial_ends_at,mail_host_type,mail_shortcuts_enabled,mail_shortcut_targets";
export const LIVE_STATUSES = ["active", "onboarded", "pending", "suspended", "enm_pending"];

/** The tenant for a host straight from the database. Throws when the
 *  database does not answer, so callers can tell "no such site" (null) from
 *  "could not check". */
async function lookupTenant(hostname: string, rootHostname: string): Promise<Tenant | null> {
  const supabase = createProxyClient();
  if (hostname.endsWith(`.${rootHostname}`)) {
    const slug = hostname.slice(0, hostname.length - rootHostname.length - 1);
    if (!slug) return null;
    const { data, error } = await supabase.from("tenants").select(TENANT_COLS).eq("slug", slug).in("status", LIVE_STATUSES).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Tenant | null) ?? null;
  }
  if (hostname !== rootHostname && !hostname.startsWith("localhost") && !hostname.endsWith(".localhost")) {
    // Custom domain
    const { data, error } = await supabase.from("tenants").select(TENANT_COLS).eq("custom_domain", hostname).eq("domain_status", "active").in("status", LIVE_STATUSES).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data as unknown as Tenant;
    // Alias domain (renovation.example.com -> example.com/renovation).
    const { data: alias, error: aliasErr } = await supabase
      .from("tenant_alias_domains")
      .select(`domain,path_prefix,tenant:tenants!inner(${TENANT_COLS})`)
      .in("domain", aliasCandidates(hostname))
      .limit(2);
    if (aliasErr) throw new Error(aliasErr.message);
    const rows = (alias ?? []) as unknown as AliasRow[];
    const row = rows.find((r) => r.domain === hostname) ?? rows[0];
    return row ? aliasTenant(row, rootHostname) : null;
  }
  return null;
}

/** The host itself and, for www.x, the bare x (one alias row covers both). */
const aliasCandidates = (hostname: string) => [hostname, hostname.replace(/^www\./, "")];

/** The alias's tenant, marked with where its requests go. */
export function aliasTenant(row: AliasRow, rootHostname: string): Tenant | null {
  const t = row.tenant;
  if (!t || !LIVE_STATUSES.includes(t.status)) return null;
  const primaryHost = t.custom_domain && t.domain_status === "active" ? t.custom_domain : `${t.slug}.${rootHostname}`;
  return { ...t, alias: { prefix: row.path_prefix.replace(/^\/+|\/+$/g, ""), primaryHost } };
}

/*
 * Fallback when the database is down (2026-10-19): the whole tenant list,
 * served by /api/internal/tenant-map out of Next's Data Cache, which keeps
 * its last good copy while the database is unreachable. Only used when the
 * live lookup fails and this instance has no earlier answer for the host.
 */
let snapshot: { at: number; tenants: Tenant[]; aliases: AliasRow[] } | null = null;
async function tenantFromSnapshot(hostname: string, rootHostname: string): Promise<Tenant | null | undefined> {
  if (!snapshot || Date.now() - snapshot.at > 60_000) {
    try {
      const res = await fetch(`https://${ROOT_DOMAIN}/api/internal/tenant-map`, {
        headers: { [PUBLIC_RENDER_HEADER]: PUBLIC_RENDER_TOKEN },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const body = await res.json();
        snapshot = { at: Date.now(), tenants: body.tenants as Tenant[], aliases: (body.aliases ?? []) as AliasRow[] };
      }
    } catch {}
  }
  if (!snapshot) return undefined;
  if (hostname.endsWith(`.${rootHostname}`)) {
    const slug = hostname.slice(0, hostname.length - rootHostname.length - 1);
    return snapshot.tenants.find((t) => t.slug === slug) ?? null;
  }
  const direct = snapshot.tenants.find((t) => t.custom_domain === hostname && t.domain_status === "active");
  if (direct) return direct;
  const cands = aliasCandidates(hostname);
  const row = snapshot.aliases.find((a) => a.domain === hostname) ?? snapshot.aliases.find((a) => cands.includes(a.domain));
  return row ? aliasTenant(row, rootHostname) : null;
}

export async function resolveTenant(host: string): Promise<Tenant | null> {
  // Standalone: one site per install, whatever the host (lib/tenant/standalone.ts).
  if (!isSaaS) return getStandaloneTenant().catch(() => null);
  const hostname = host.split(":")[0].toLowerCase();
  const cached = cache.get(hostname);
  if (cached && cached.expiresAt > Date.now()) return cached.tenant;

  // Strip port from ROOT_DOMAIN for comparison
  const rootHostname = ROOT_DOMAIN.split(":")[0].toLowerCase();

  let tenant: Tenant | null;
  try {
    tenant = await lookupTenant(hostname, rootHostname);
  } catch {
    // Database unreachable. A failed lookup used to be cached as "no such
    // site" and every site showed Not Found. Keep the last answer this
    // instance had (however old), else the cached tenant list.
    if (cached) {
      cached.expiresAt = Date.now() + CACHE_TTL_MS;
      return cached.tenant;
    }
    const fromSnapshot = await tenantFromSnapshot(hostname, rootHostname);
    if (fromSnapshot !== undefined) return fromSnapshot;
    return null;
  }

  cache.set(hostname, { tenant, expiresAt: Date.now() + CACHE_TTL_MS });
  return tenant;
}

/** Partner dashboard domains (white-label), cached like tenants. */
const brandHostCache = new Map<string, { partnerId: string | null; expiresAt: number }>();

/** Partner id whose white-label dashboard lives at this host (active domains only), or null. */
export async function resolveBrandHost(host: string): Promise<string | null> {
  const h = host.split(":")[0].toLowerCase();
  const hit = brandHostCache.get(h);
  if (hit && hit.expiresAt > Date.now()) return hit.partnerId;
  const supabase = createProxyClient();
  const { data } = await supabase.from("partners").select("id").ilike("dashboard_domain", h).eq("dashboard_domain_status", "active").maybeSingle();
  const partnerId = (data?.id as string | undefined) ?? null;
  brandHostCache.set(h, { partnerId, expiresAt: Date.now() + 60_000 });
  return partnerId;
}

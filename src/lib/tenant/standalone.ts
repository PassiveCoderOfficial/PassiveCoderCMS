import { createProxyClient } from "@/lib/supabase/server";
// resolve.ts imports this file too; TENANT_COLS is only read inside the
// function, after both modules have loaded, so the cycle is safe.
import { TENANT_COLS, type Tenant } from "@/lib/tenant/resolve";

/*
 * Standalone (self-hosted, single-site) mode: one install serves exactly one
 * site. Every request belongs to that site, whatever the host name, so the
 * proxy injects its x-tenant-* headers the same way SaaS does for a tenant
 * host, and the 122 files that read those headers work unchanged.
 *
 * The site is STANDALONE_TENANT_ID when set, otherwise the only row in
 * `tenants` (the one /setup created). No row yet = first run: the proxy sends
 * visitors to /setup.
 */

const CACHE_TTL_MS = 30_000;
let cached: { tenant: Tenant | null; expiresAt: number } | null = null;

/** The install's single site, or null before /setup has run. Throws when the
 *  database does not answer, so callers can tell "no site yet" from "down". */
export async function getStandaloneTenant(): Promise<Tenant | null> {
  if (cached && cached.expiresAt > Date.now()) return cached.tenant;
  const supabase = createProxyClient();
  const pinned = process.env.STANDALONE_TENANT_ID?.trim();
  const query = supabase.from("tenants").select(TENANT_COLS).order("created_at", { ascending: true }).limit(1);
  const { data, error } = pinned ? await query.eq("id", pinned) : await query;
  if (error) throw new Error(error.message);
  const tenant = ((data ?? [])[0] as Tenant | undefined) ?? null;
  // A missing site is not cached for long: /setup is about to create it.
  cached = { tenant, expiresAt: Date.now() + (tenant ? CACHE_TTL_MS : 2_000) };
  return tenant;
}

/** Drop the cached site (after /setup creates it). */
export function clearStandaloneTenantCache() {
  cached = null;
}

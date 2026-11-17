/*
 * Which site(s) a Supabase write touched, for expiring the public-site cache
 * (public-cache.ts). Shared by the server clients and the browser client, so
 * it must not import anything server-only.
 */

/** Writes that must NOT expire a site's cache: counters and logs written on
 *  every page view, and background integrations. */
const NO_INVALIDATE = /(_logs?|_events|_stats|_views|_submissions|_sessions|_messages|_tickets|_tokens|_jobs|_queue|notifications|audit|usage|analytics|integrations|webhook|otp)$/;
const COUNTER_ONLY_KEYS = new Set(["hits", "views", "view_count", "last_seen_at", "last_hit_at"]);
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function bodyRows(body: unknown): Record<string, unknown>[] {
  if (typeof body !== "string") return [];
  try {
    const parsed = JSON.parse(body);
    return (Array.isArray(parsed) ? parsed : [parsed]).filter((r) => r && typeof r === "object");
  } catch {
    return [];
  }
}

/** null = this write does not affect any public site; [] = it does, but does
 *  not say which site (expire them all); otherwise the tenant ids. */
export function writeScope(url: string, body: unknown): string[] | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  const table = u.pathname.match(/\/rest\/v1\/([a-z0-9_]+)$/i)?.[1];
  if (!table || NO_INVALIDATE.test(table)) return null; // rpc, storage, auth, logs
  const rows = bodyRows(body);
  if (rows.length && rows.every((r) => Object.keys(r).every((k) => COUNTER_ONLY_KEYS.has(k)))) return null;

  const ids = new Set<string>();
  const filter = u.searchParams.get("tenant_id")?.match(UUID)?.[0];
  if (filter) ids.add(filter.toLowerCase());
  if (table === "tenants") { const id = u.searchParams.get("id")?.match(UUID)?.[0]; if (id) ids.add(id.toLowerCase()); }
  for (const r of rows) if (typeof r.tenant_id === "string" && UUID.test(r.tenant_id)) ids.add(r.tenant_id.toLowerCase());
  return [...ids];
}

export const requestUrl = (input: RequestInfo | URL) =>
  typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

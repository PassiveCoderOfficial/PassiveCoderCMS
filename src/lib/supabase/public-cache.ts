import { headers } from "next/headers";
import { revalidateTag, unstable_cache } from "next/cache";
import { PUBLIC_RENDER_HEADER, PUBLIC_RENDER_TOKEN } from "./public-render-token";
import { requestUrl, writeScope } from "./write-scope";
import { ACTOR_HEADER, ACTOR_VIA_HEADER, ORIGIN_HEADER, describeAuthWrite, verifyActor, type WriteActor } from "./write-actor";
import { ACT_AS_COOKIE, ACT_AS_HEADER, cookieFrom, onStaffPortal, parseActAs } from "@/lib/act-as-token";

/*
 * Public-site read cache (2026-10-19).
 *
 * Every public page view used to read its site (settings, identity, page,
 * blocks' data) straight from Supabase: ~15 queries per view, no copy kept
 * anywhere. When the database struggled, every site on the platform went
 * down with it. Now, for anonymous GET page views (the proxy marks them with
 * PUBLIC_RENDER_HEADER), Supabase reads go through two layers:
 *
 *  1. a small in-memory copy per server instance (cheap repeat hits), and
 *  2. Next's Data Cache (unstable_cache): shared by all instances, survives
 *     cold starts, refreshed in the background when it goes stale.
 *
 * A read that fails (network error, 5xx, timeout) THROWS inside the cached
 * function, so it is never stored. unstable_cache then keeps serving the
 * previous copy (it swallows background-refresh errors and returns the stale
 * value), and the memory layer falls back to its last good copy too. That is
 * what keeps sites up while the database is down.
 *
 * Freshness: entries live an hour, but any content write made through our
 * Supabase clients expires the site's entries at once (invalidateForWrite),
 * and signed-in owners never use the cache, so edits show immediately.
 */

export { PUBLIC_RENDER_HEADER, PUBLIC_RENDER_TOKEN };

/** One hour: edits invalidate explicitly, this only bounds staleness for
 *  writes made outside the app (seed scripts, SQL). */
const REVALIDATE_SECONDS = 3600;
/** Memory copy: short, it only saves Data Cache reads on busy instances. */
const MEMORY_TTL_MS = 60_000;
const MEMORY_MAX = 2000;
/** A cold read that hangs this long fails instead of holding the page. */
const READ_TIMEOUT_MS = 8000;

type Cached = { status: number; statusText: string; headers: Record<string, string>; body: string };

const memory = new Map<string, { at: number; value: Cached }>();

function remember(key: string, value: Cached) {
  if (memory.size >= MEMORY_MAX) memory.delete(memory.keys().next().value!);
  memory.set(key, { at: Date.now(), value });
}

const KEEP_HEADERS = ["content-type", "content-range", "preference-applied"];

function toResponse(c: Cached) {
  return new Response(c.body, { status: c.status, statusText: c.statusText, headers: c.headers });
}

/** Reads the request context once per call; null outside a request or when
 *  this is not an anonymous public page view. */
async function publicRenderTenant(): Promise<string | null> {
  try {
    const h = await headers();
    if (h.get(PUBLIC_RENDER_HEADER) !== PUBLIC_RENDER_TOKEN) return null;
    return h.get("x-tenant-id") ?? "root";
  } catch {
    return null; // scripts, cron, after() callbacks: no request scope
  }
}

const siteTag = (tenant: string) => `site:${tenant}`;
const ALL_TAG = "site-all";

async function cachedRead(baseFetch: typeof fetch, input: RequestInfo | URL, init: RequestInit | undefined, tenant: string) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const h = new Headers(init?.headers);
  // The role matters (anon and service role see different rows), so the key
  // carries a short tail of the API key along with what shapes the reply.
  const role = (h.get("apikey") ?? "").slice(-8);
  const key = [tenant, url, h.get("accept") ?? "", h.get("range") ?? "", h.get("prefer") ?? "", role].join("|");

  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < MEMORY_TTL_MS) return toResponse(hit.value);

  try {
    const value = await unstable_cache(
      async (): Promise<Cached> => {
        const res = await baseFetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(READ_TIMEOUT_MS) });
        // Only real answers are worth keeping. 404/406 are real ("no such
        // row"); auth errors, rate limits and 5xx are the database or the
        // gateway having a bad moment, so they must not replace a good copy.
        if (!res.ok && res.status !== 404 && res.status !== 406) throw new Error(`supabase read ${res.status}`);
        const kept: Record<string, string> = {};
        for (const k of KEEP_HEADERS) { const v = res.headers.get(k); if (v) kept[k] = v; }
        return { status: res.status, statusText: res.statusText, headers: kept, body: await res.text() };
      },
      ["sb-read", key],
      { revalidate: REVALIDATE_SECONDS, tags: [siteTag(tenant), ALL_TAG] },
    )();
    remember(key, value);
    return toResponse(value);
  } catch (err) {
    // No Data Cache copy and the database failed: last memory copy, however old.
    if (hit) return toResponse(hit.value);
    throw err;
  }
}

/** After a successful content write, expire the affected site's cached reads
 *  (or every site's, when the write does not say which site it touched). */
function invalidateForWrite(input: RequestInfo | URL, init: RequestInit | undefined) {
  const ids = writeScope(requestUrl(input), init?.body);
  if (ids) invalidateSites(ids);
}

/** Expire these sites' cached reads; an empty list expires every site. */
export function invalidateSites(input: string[]) {
  // Anonymous views on the root domain (passivecoder.com) have no
  // x-tenant-id, so their reads are cached under "root", not under the root
  // builder tenant's id. A write to that tenant (page edit, publish, SEO)
  // only named its id, so the live root site kept serving the old page for
  // up to an hour. The root site also shows other tenants' data (showcase,
  // templates), so any site write expires the "root" entries too.
  const ids = input.length ? [...new Set([...input, "root"])] : input;
  // Memory copies on this instance go at once; other instances' copies are
  // at most MEMORY_TTL_MS old and then re-read the (now expired) Data Cache.
  if (ids.length) { for (const k of memory.keys()) if (ids.some((id) => k.startsWith(`${id}|`))) memory.delete(k); }
  else memory.clear();
  try {
    if (ids.length) for (const id of ids) revalidateTag(siteTag(id), { expire: 0 });
    else revalidateTag(ALL_TAG, { expire: 0 });
  } catch {
    // Outside a request (seed scripts): entries expire on their own within the hour.
  }
}

/** The staff member a super admin is acting as on the Staff Portal, if the signed cookie says so for this actor. */
async function actingAsFor(actorId: string): Promise<string | null> {
  try {
    const h = await headers();
    const parsed = parseActAs(cookieFrom(h.get("cookie"), ACT_AS_COOKIE));
    if (!parsed || parsed.saUserId !== actorId || !onStaffPortal(h)) return null;
    return parsed.targetUserId;
  } catch {
    return null;
  }
}

/** Who this write is for, when the proxy vouched for them. Null for cron, MCP and scripts. */
async function currentActor(): Promise<WriteActor | null> {
  try {
    return verifyActor((await headers()).get(ACTOR_HEADER));
  } catch {
    return null; // scripts, cron, after() callbacks: no request scope
  }
}

/** Password and account changes go to Supabase Auth, so no trigger sees them. Best
 *  effort and short: a failure here must never touch the change that just worked. */
async function logAuthWrite(baseFetch: typeof fetch, url: string, method: string, init: RequestInit | undefined, actor: WriteActor) {
  try {
    const write = describeAuthWrite(url, method, init?.body);
    if (!write) return;
    const h = new Headers(init?.headers);
    const apikey = h.get("apikey");
    if (!apikey) return;
    await baseFetch(`${new URL(url).origin}/rest/v1/rpc/log_team_auth_action`, {
      method: "POST",
      headers: { apikey, Authorization: h.get("authorization") ?? `Bearer ${apikey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_actor: actor.userId, p_action: write.action, p_target: write.target, p_args: write.args, p_via: actor.via }),
      signal: AbortSignal.timeout(1500),
    });
  } catch (err) {
    console.error("[action-list] could not log an account change", err instanceof Error ? err.message : "unknown");
  }
}

/** fetch for our Supabase clients: cached reads during anonymous public page
 *  views, cache invalidation after content writes, plain fetch otherwise. */
export function siteAwareFetch(baseFetch: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (method === "GET" || method === "HEAD") {
      const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (!href.includes("/rest/v1/")) return baseFetch(input, init); // auth, storage: never cached
      const tenant = await publicRenderTenant();
      if (tenant) return cachedRead(baseFetch, input, init, tenant);
      return baseFetch(input, init);
    }
    const actor = await currentActor();
    // Database writes from this app say so: the "database" Action List
    // trigger (migration 227) records only scripts and direct SQL, not the
    // app's own routes, cron jobs, webhooks and MCP calls, which log themselves.
    const rest = requestUrl(input).includes("/rest/v1/");
    let sent = init;
    if (actor || rest) {
      const h = new Headers(init?.headers);
      if (rest) h.set(ORIGIN_HEADER, "app");
      if (actor) {
        h.set(ACTOR_HEADER, actor.userId);
        h.set(ACTOR_VIA_HEADER, actor.via);
        // A super admin viewing the Staff Portal as a staff member: the Action
        // List trigger (migration 224) records both ids. Attribution only.
        const actingAs = await actingAsFor(actor.userId);
        if (actingAs) h.set(ACT_AS_HEADER, actingAs);
      }
      sent = { ...init, headers: h };
    }
    const res = await baseFetch(input, sent);
    if (res.ok) invalidateForWrite(input, init);
    if (res.ok && actor) await logAuthWrite(baseFetch, requestUrl(input), method, init, actor);
    return res;
  };
}

/** For scripts and admin tools: expire one site's cache, or all of them. */
export function invalidateSiteCache(tenantId?: string | null) {
  invalidateSites(tenantId ? [tenantId] : []);
}

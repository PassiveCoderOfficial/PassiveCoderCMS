/**
 * Cross-site request check for the API (used by the proxy).
 *
 * A browser attaches the visitor's cookies to requests another website makes
 * it send, so a write to /api/* that arrives with cookies AND an Origin header
 * naming someone else's site is refused. Allowed origins:
 *  - the host the request came to (every site calls its own /api);
 *  - the platform's own hosts (the root domain, its www and the app URL's
 *    host), but only for a request addressed to one of those same hosts, so
 *    the bare domain and www can call each other;
 *  - (looked up by the caller) the request site's own verified custom domain.
 *
 * Another subdomain of the root domain is NOT allowed: every site gets one
 * (a.<root>), the sign-in cookie is shared across them, and a site's own
 * JavaScript must not be able to write to b.<root>/api or to the root with
 * the visitor's session. No page of the platform calls another host's /api
 * from the browser with cookies (checked 2026-11-17: no absolute API URLs and
 * no credentials: "include" in client code; the experts and food hosts, staff
 * portal, partner dashboards and site dashboards all call their own host).
 *
 * Deliberately passes, so nothing that is not a browser forgery breaks:
 * - GET/HEAD/OPTIONS, and anything outside /api/;
 * - no Origin header: the mobile apps, webhooks, cron, the WordPress plugin
 *   and other server-to-server callers;
 * - no cookies: nothing to ride on (Bearer and API-key callers, MCP clients,
 *   the CORS endpoints), whatever the Origin;
 * - endpoints other sites are meant to call from a browser: payment gateway
 *   returns (the gateway posts the shopper's browser back to us), webhooks,
 *   MCP and OAuth. They authenticate by signature, token or gateway check.
 *
 * No imports: unit-tested in tests/platform/api-origin.test.ts.
 */

const CROSS_SITE_BY_DESIGN = /^\/api\/(?:payments\/|webhooks\/|billing\/dodo\/webhook(?:\/|$)|github\/webhook(?:\/|$)|cron\/|mcp(?:\/|$)|oauth\/|v1\/)/;

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Lower-case host name without port, or null. Accepts "host:port" and IPv6 "[::1]:3000". */
export function hostnameOf(host: string | null | undefined): string | null {
  if (!host) return null;
  const h = host.trim().toLowerCase().replace(/:\d+$/, "");
  return h || null;
}

export type ApiOriginInput = {
  method: string;
  pathname: string;
  /** The Origin request header, as sent. */
  origin: string | null | undefined;
  /** Whether the request carries any cookie. */
  hasCookies: boolean;
  /** Hosts this request was addressed to (Host, X-Forwarded-Host, the URL's host). */
  requestHosts: Array<string | null | undefined>;
  /** Host of NEXT_PUBLIC_APP_URL, when set. A platform host like the root domain. */
  appHost?: string | null;
  /** NEXT_PUBLIC_ROOT_DOMAIN (a port is ignored). */
  rootDomain: string;
};

export type ApiOriginVerdict =
  | { verdict: "allow" }
  | { verdict: "deny" }
  /** Not the request host and not on the root domain: allow only if `host` is a
   *  verified custom domain of the site the request is addressed to. */
  | { verdict: "lookup"; host: string };

export function apiOriginVerdict(i: ApiOriginInput): ApiOriginVerdict {
  const allow = { verdict: "allow" } as const;
  if (SAFE_METHODS.has(i.method.toUpperCase())) return allow;
  if (!i.pathname.startsWith("/api/")) return allow;
  if (i.origin == null || i.origin === "") return allow;
  if (!i.hasCookies) return allow;
  if (CROSS_SITE_BY_DESIGN.test(i.pathname)) return allow;

  // "null" (sandboxed frames, data: pages) and anything unparsable.
  let originHost: string;
  try {
    const u = new URL(i.origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") return { verdict: "deny" };
    originHost = u.hostname.toLowerCase();
  } catch {
    return { verdict: "deny" };
  }
  if (!originHost) return { verdict: "deny" };

  const requestHosts = i.requestHosts.map(hostnameOf).filter((h): h is string => !!h);
  if (requestHosts.includes(originHost)) return allow;
  const root = hostnameOf(i.rootDomain);
  // The platform's own hosts may call each other (root <-> www <-> app URL).
  const platformHosts = new Set([root, root ? `www.${root}` : null, hostnameOf(i.appHost)].filter((h): h is string => !!h));
  if (platformHosts.has(originHost)) return requestHosts.some((h) => platformHosts.has(h)) ? allow : { verdict: "deny" };
  // Any other host on the root domain is some other site's subdomain.
  if (root && originHost.endsWith(`.${root}`)) return { verdict: "deny" };
  return { verdict: "lookup", host: originHost };
}

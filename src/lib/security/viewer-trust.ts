/**
 * Who is looking at a site on a platform subdomain? (Pure part; the server
 * lookups are in lib/security/untrusted-viewer.ts.)
 *
 * The sign-in cookie is shared by every *.<root domain> host and scripts can
 * read it (lib/supabase/cookie-domain.ts). So a site's own code (custom JS,
 * the free-form analytics snippet, Tag Manager, HTML blocks) must not run in
 * the browser of a signed-in person who has nothing to do with that site, and
 * never in a staff or super admin browser: it could read their session.
 *
 *  - No session cookie: an ordinary visitor. Nothing to steal; the site
 *    renders exactly as saved. The answer never depends on a lookup.
 *  - A custom domain, or a single-site install: the shared cookie is not sent
 *    there at all, so nothing changes.
 *  - The platform's own site: its content is written by the platform.
 *  - Signed in, a member of this site and not staff: renders as saved.
 *  - Signed in and staff or super admin, or not a member, or the session
 *    cannot be checked: the site's own code is not rendered for this viewer.
 *
 * No imports: unit-tested in tests/platform/viewer-trust.test.ts.
 */

export type ViewerInput = {
  /** Multi-site platform (not a single-site install). */
  saas: boolean;
  /** Host the page was requested on (Host / X-Forwarded-Host). */
  host: string | null | undefined;
  /** NEXT_PUBLIC_ROOT_DOMAIN (a port is ignored). */
  rootDomain: string;
  /** The site is the platform's own. */
  platformSite: boolean;
  /** The request carries a platform session cookie. */
  hasSessionCookie: boolean;
};

const bare = (h: string | null | undefined) => (h ?? "").trim().toLowerCase().replace(/:\d+$/, "");

/** A Supabase session cookie, whole or chunked (sb-<ref>-auth-token, .0, .1). */
export function isSessionCookieName(name: string): boolean {
  return name.startsWith("sb-") && name.includes("auth-token");
}

/** True when the page is on a subdomain of the root domain (not the root itself, not a custom domain). */
export function onPlatformSubdomain(host: string | null | undefined, rootDomain: string): boolean {
  const h = bare(host), root = bare(rootDomain);
  return !!h && !!root && h !== root && h.endsWith(`.${root}`);
}

/**
 * First step, from the request alone:
 *  "trusted": render as saved, no lookup needed;
 *  "check": a signed-in viewer on a platform subdomain, look the person up.
 */
export function viewerFirstCheck(i: ViewerInput): "trusted" | "check" {
  if (!i.saas || i.platformSite) return "trusted";
  if (!i.hasSessionCookie) return "trusted";
  return onPlatformSubdomain(i.host, i.rootDomain) ? "check" : "trusted";
}

export type ViewerFacts = {
  /** The verified user id, or null when the session could not be verified. */
  userId: string | null;
  /** Super admin or active platform staff. */
  platformStaff: boolean;
  /** Has a tenant_members row for this site (any role). */
  member: boolean;
};

/** Second step: may this signed-in viewer be shown the site's own code? */
export function viewerIsUntrusted(f: ViewerFacts): boolean {
  if (!f.userId) return true;
  if (f.platformStaff) return true;
  return !f.member;
}

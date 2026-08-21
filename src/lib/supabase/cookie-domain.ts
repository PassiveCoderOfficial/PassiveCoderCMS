// Auth cookies must be shared across ALL subdomains (staff portal, and every
// tenant's {slug}.rootdomain dashboard) so a logged-in user isn't forced to
// re-login when switching between them.
//
// Setting the cookie Domain to the leading-dot root domain (e.g.
// ".passivecoder.com") makes the browser send it to every subdomain of THAT
// domain. It does nothing on a tenant's own custom domain (e.g.
// freebirdsg.com) — a Domain attribute only ever narrows which subdomains of
// the CURRENT host receive the cookie, it can never point at an unrelated
// domain. A browser handed `Set-Cookie: ...; Domain=.passivecoder.com` while
// serving a page on freebirdsg.com must reject the cookie outright, since
// accepting it would let passivecoder.com plant cookies for a site it doesn't
// own. The result was total, silent auth failure on every custom domain:
// signInWithPassword still returned a token, but no cookie was ever set, so
// the very next request had no session and bounced back to /login.
//
// So the leading-dot form is only correct when the CURRENT request host is
// actually on the root domain or one of its subdomains. Anywhere else
// (localhost, a bare IP, or a tenant's custom domain) the cookie must be
// host-only — omit Domain entirely and let the browser default it to the
// exact host that set it.

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000").replace(/:\d+$/, "");

function isOnRootDomain(host: string): boolean {
  return host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`);
}

/**
 * `host` should be the ACTUAL request host — `window.location.hostname` in
 * the browser, or the incoming `Host`/`x-forwarded-host` header on the server.
 * Passing the root domain unconditionally is the bug this file exists to fix;
 * every caller must supply the real one.
 */
export function getCookieDomain(host: string | undefined): string | undefined {
  if (!host) return undefined;
  const bare = host.replace(/:\d+$/, "");
  if (bare === "localhost" || bare.includes("localhost") || /^\d+\.\d+\.\d+\.\d+$/.test(bare)) {
    return undefined;
  }
  if (!isOnRootDomain(bare)) return undefined;
  return `.${ROOT_DOMAIN}`;
}

/**
 * Merge the shared cross-subdomain Domain into Supabase cookie options, only
 * when `host` is actually on the root domain. Generic preserves the caller's
 * option type; we spread into a fresh object so the `domain` key is added
 * without a lossy cast.
 */
export function withCookieDomain<T extends object>(host: string | undefined, options?: T): T & { domain?: string } {
  const domain = getCookieDomain(host);
  if (!domain) return { ...(options ?? ({} as T)) };
  return { ...(options ?? ({} as T)), domain };
}

// Auth cookies must be shared across ALL subdomains (agent portal, staff portal,
// and every tenant's {slug}.rootdomain dashboard) so a logged-in user isn't
// forced to re-login when switching between them.
//
// Setting the cookie Domain to the leading-dot root domain (e.g. ".passivecoder.com")
// makes the browser send it to every subdomain. On localhost we return undefined
// (host-only cookie) — browsers reject Domain attributes for "localhost".

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export function getCookieDomain(): string | undefined {
  const host = ROOT_DOMAIN.replace(/:\d+$/, ""); // strip port
  if (host === "localhost" || host.includes("localhost") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return undefined;
  }
  return `.${host}`;
}

/** Merge the shared cross-subdomain Domain into Supabase cookie options. */
export function withCookieDomain<T extends Record<string, unknown>>(options?: T): T {
  const domain = getCookieDomain();
  if (!domain) return (options ?? {}) as T;
  return { ...(options ?? {}), domain } as T;
}

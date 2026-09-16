/**
 * A tenant has (up to) two real addresses: its own .{ROOT} subdomain, and an
 * optional custom_domain. Which one to use depends on what you're doing:
 *
 *  - Admin/dashboard actions (switching sites, editing) must stay on the
 *    subdomain — the login session cookie is scoped there. Landing on a
 *    custom domain forces a re-login even though it's the same tenant/
 *    account, since that domain has never seen this session's cookie.
 *    Reported live: switching to a tenant with a custom domain attached
 *    ("sgpfloorrepair.com") from the site switcher forced a fresh login.
 *  - "Visit"/"Preview" actions are for what a real visitor sees, which is
 *    the custom domain when one is attached (nobody markets the .passivecoder
 *    subdomain once they have their own domain) — falls back to the
 *    subdomain when none is set.
 *
 * The platform's own tenant (slug matching ROOT's first label) is a special
 * case either way: its real address is the bare ROOT domain, not its own
 * subdomain — see (admin)/layout.tsx's identical rootSlug logic.
 */

export const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const ROOT_SLUG = ROOT.split(".")[0];
export const isLocal = ROOT.includes("localhost");
export const proto = isLocal ? "http" : "https";

export interface SiteIdentity {
  slug: string;
  custom_domain?: string | null;
}

/** The host to use for admin/dashboard/editor actions — always resolves
 *  where the session cookie actually lives, never the custom domain. */
export function adminHost(site: SiteIdentity): string {
  if (site.slug === ROOT_SLUG) return ROOT;
  return `${site.slug}.${ROOT}`;
}

/** The host a real visitor sees — the custom domain when attached, else the
 *  subdomain. Use for "Visit site" / "Preview" links, never for anything
 *  that needs the admin session. */
export function publicHost(site: SiteIdentity): string {
  if (site.custom_domain) return site.custom_domain;
  return adminHost(site);
}

export function adminUrl(site: SiteIdentity, path = ""): string {
  return `${proto}://${adminHost(site)}${path}`;
}

export function publicUrl(site: SiteIdentity, path = ""): string {
  return `${proto}://${publicHost(site)}${path}`;
}

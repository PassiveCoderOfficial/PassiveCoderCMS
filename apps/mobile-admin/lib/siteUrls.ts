// Mirrors cms/src/lib/tenant/site-urls.ts exactly — a tenant has up to two
// real addresses (its .ROOT subdomain, and an optional custom_domain).
// "Visit"/"Preview" always prefers the custom domain when one is attached
// (falls back to the subdomain), since nobody markets the .passivecoder
// subdomain once they have their own domain. Unlike admin/dashboard hosts,
// preview links have no session-cookie constraint, so this is the only
// host-resolution rule mobile needs (riders.tsx's own local copy of this
// logic predates this shared version — worth pointing future call sites
// here instead of re-deriving it locally again).
//
// Note: like the web version this mirrors, this does NOT check
// domain_status — a custom domain still pending DNS verification is used
// as-is. Pre-existing gap on web too, not introduced here.

const ROOT_DOMAIN = process.env.EXPO_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";

export interface SiteIdentity {
  slug: string;
  custom_domain?: string | null;
}

export function publicHost(site: SiteIdentity): string {
  return site.custom_domain || `${site.slug}.${ROOT_DOMAIN}`;
}

export function publicUrl(site: SiteIdentity, path = ""): string {
  return `https://${publicHost(site)}${path}`;
}

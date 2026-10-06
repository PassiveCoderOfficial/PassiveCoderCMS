import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminUrl, ROOT, proto } from "@/lib/tenant/site-urls";

/**
 * Every address an AI agent needs to talk about a site: where visitors see
 * it (custom domain once it's live, else the default subdomain), the default
 * subdomain itself (always works), and dashboard links for editing. Agents
 * previously only got custom_domain/domain_status and, with no domain
 * connected, had no URL for the site at all.
 */
export type SiteLinks = {
  name: string;
  slug: string;
  liveUrl: string;
  defaultUrl: string;
  customDomain: string | null;
  customDomainStatus: string;
  dashboardUrl: string;
};

export async function getSiteLinks(admin: SupabaseClient, tenantId: string): Promise<SiteLinks | null> {
  const { data: t } = await admin.from("tenants").select("name, slug, custom_domain, domain_status").eq("id", tenantId).maybeSingle();
  if (!t) return null;
  const site = { slug: t.slug as string };
  const defaultUrl = adminUrl(site);
  const live = t.custom_domain && t.domain_status === "active" ? `${proto}://${t.custom_domain}` : defaultUrl;
  return {
    name: t.name as string,
    slug: t.slug as string,
    liveUrl: live,
    defaultUrl,
    customDomain: (t.custom_domain as string | null) ?? null,
    customDomainStatus: (t.domain_status as string | null) ?? "none",
    dashboardUrl: adminUrl(site, "/dashboard"),
  };
}

/** Public URL of a page or post by slug ("home" is the site root). */
export const pageUrl = (l: SiteLinks, slug: string) => (slug === "home" ? `${l.liveUrl}/` : `${l.liveUrl}/${slug}`);
export const productUrl = (l: SiteLinks, slug: string) => `${l.liveUrl}/products/${slug}`;
export const pageEditUrl = (l: SiteLinks, id: string) => `${l.dashboardUrl}/pages/${id}`;

/** One-paragraph description of the site's addresses for an agent's instructions. */
export function linksBrief(l: SiteLinks) {
  const domain = l.customDomain
    ? l.customDomainStatus === "active"
      ? `Its custom domain ${l.customDomain} is live.`
      : `A custom domain (${l.customDomain}) is being connected (status: ${l.customDomainStatus}); until it is live, use the default address.`
    : "It has no custom domain yet, so the default address is the live site.";
  return `Site addresses: live site ${l.liveUrl}; default address (always works) ${l.defaultUrl}. ${domain} ` +
    `Page URLs are the live site plus the page slug (slug "home" is the root), products are at /products/<slug>. ` +
    `The owner manages everything at ${l.dashboardUrl}. These addresses are confirmed; you may share them.`;
}

export const ROOT_DOMAIN = ROOT;

/**
 * Add `url` (public) and, for pages/posts, `editUrl` to every row in a tool
 * result that has a slug, so agents can link to what they list or create.
 * Product tools get /products/<slug>; everything else is a page or post.
 */
export function withUrls(result: unknown, l: SiteLinks, tool: string): unknown {
  const isProduct = /product/.test(tool);
  const visit = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(visit);
    if (!v || typeof v !== "object") return v;
    const o = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(o)) out[k] = k === "blocks" || k === "draft_blocks" ? val : visit(val);
    if (typeof o.slug === "string" && !("url" in o)) {
      out.url = isProduct ? productUrl(l, o.slug) : pageUrl(l, o.slug);
      const id = (o.id ?? o.pageId) as string | undefined;
      if (!isProduct && typeof id === "string") out.editUrl = pageEditUrl(l, id);
      if (isProduct && typeof o.id === "string") out.editUrl = `${l.dashboardUrl}/ecommerce/products/${o.id}`;
    }
    return out;
  };
  return visit(result);
}

import "server-only";
import { contentPath } from "@/lib/posts/post-route";
import { publishDueForSite } from "@/lib/posts/scheduled";
import { resolveTenant } from "@/lib/tenant/resolve";
import { publicUrl } from "@/lib/tenant/site-urls";
import { createAdminClient } from "@/lib/supabase/server";
import { ROOT_TENANT_SLUG } from "@/lib/flags";
import { rootPathOf } from "@/lib/pricing/hreflang";

/**
 * One list of a site's public URLs, shared by /sitemap.xml (search engines),
 * /sitemap.html (people) and the dashboard's "Pages in Google" check, so the
 * three can never disagree about which pages a site has.
 */
export type SitemapKind = "page" | "post" | "product" | "property" | "community";
export type SitemapEntry = {
  url: string;
  title: string;
  kind: SitemapKind;
  lastModified: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
};

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
// Same host as the canonical tags (marketing layout / root-page.tsx).
export const ROOT_BASE = `https://${ROOT.split(":")[0]}`;

/** A page whose seo.canonical points at another URL is a duplicate: keep it out. */
function canonicalElsewhere(seo: unknown, ownPath: string): boolean {
  const c = (seo as { canonical?: string } | null)?.canonical?.trim();
  if (!c) return false;
  try {
    const p = new URL(c, ROOT_BASE).pathname.replace(/\/$/, "") || "/";
    return p !== (ownPath.replace(/\/$/, "") || "/");
  } catch { return false; }
}

const noIndex = (seo: unknown) => !!(seo as { no_index?: boolean } | null)?.no_index;
const titleOf = (p: { title?: unknown; seo?: unknown; slug?: unknown }) =>
  String((p.seo as { title?: string } | null)?.title || p.title || p.slug || "").trim();

/**
 * The URLs for the site served on `host`: a tenant's own published pages,
 * posts, products and listings (each built from its real address, custom
 * domain if attached), or, with no tenant, the platform's root site.
 * Pages marked "hide from search engines", pages whose canonical points
 * elsewhere and paths behind a redirect are left out.
 */
export async function sitemapEntries(host: string): Promise<SitemapEntry[]> {
  const tenant = await resolveTenant(host);
  const now = new Date().toISOString();

  if (tenant) {
    await publishDueForSite(tenant.id);
    const admin = await createAdminClient();
    const [{ data: pages }, { data: products }, { data: properties }, { data: communities }] = await Promise.all([
      admin.from("pages").select("slug, title, updated_at, type, seo")
        .eq("tenant_id", tenant.id).eq("status", "published").is("deleted_at", null),
      admin.from("products").select("slug, name, updated_at").eq("tenant_id", tenant.id).eq("status", "active").limit(5000),
      admin.from("re_properties").select("slug, title, updated_at").eq("tenant_id", tenant.id).neq("status", "draft").limit(5000),
      admin.from("re_communities").select("slug, name").eq("tenant_id", tenant.id).limit(1000),
    ]);
    const redirected = await redirectedSlugs(tenant.id);
    const site = { slug: tenant.slug, custom_domain: tenant.custom_domain };
    return [
      ...(pages ?? []).filter((p) => !noIndex(p.seo) && !canonicalElsewhere(p.seo, contentPath(p)) && !redirected.has(p.slug)).map((p): SitemapEntry => ({
        url: publicUrl(site, contentPath(p)),
        title: titleOf(p),
        kind: p.type === "post" ? "post" : "page",
        lastModified: p.updated_at ?? now,
        changeFrequency: p.type === "post" ? "weekly" : "monthly",
        priority: p.slug === "home" ? 1 : 0.7,
      })),
      ...(products ?? []).map((p): SitemapEntry => ({ url: publicUrl(site, `/products/${p.slug}`), title: String(p.name ?? p.slug), kind: "product", lastModified: p.updated_at ?? now, changeFrequency: "weekly", priority: 0.6 })),
      ...(properties ?? []).map((p): SitemapEntry => ({ url: publicUrl(site, `/properties/${p.slug}`), title: String(p.title ?? p.slug), kind: "property", lastModified: p.updated_at ?? now, changeFrequency: "weekly", priority: 0.6 })),
      ...(communities ?? []).map((c): SitemapEntry => ({ url: publicUrl(site, `/communities/${c.slug}`), title: String(c.name ?? c.slug), kind: "community", lastModified: now, changeFrequency: "monthly", priority: 0.5 })),
    ];
  }

  // Root site on builder pages: every published root-tenant page (country
  // and language landing pages included) is listed from the database, so a
  // new /ae/ar or /sg/cleaning-website page needs no code change. The
  // hard-coded marketing routes below fill in whatever is not a builder page.
  const builder = await rootBuilderPages(now);
  const seen = new Set(builder.map((e) => e.url));
  const fixedPage = (path: string, title: string, changeFrequency: SitemapEntry["changeFrequency"], priority: number): SitemapEntry =>
    ({ url: `${ROOT_BASE}${path}`, title, kind: "page", lastModified: now, changeFrequency, priority });
  const fixed: SitemapEntry[] = [
    fixedPage("/", "Home", "weekly", 1),
    fixedPage("/bn", "Home (Bangla)", "weekly", 0.9),
    fixedPage("/pricing", "Pricing", "monthly", 0.9),
    fixedPage("/bn/pricing", "Pricing (Bangla)", "monthly", 0.8),
    fixedPage("/website-maintenance", "Website maintenance", "monthly", 0.8),
    fixedPage("/bn/website-maintenance", "Website maintenance (Bangla)", "monthly", 0.7),
    fixedPage("/bn/contact", "Contact (Bangla)", "monthly", 0.5),
    fixedPage("/bn/refund", "Refund policy (Bangla)", "yearly", 0.3),
    // Partner program, English and Bangla (root-site builder pages).
    ...["company-profile-design", "partners", "partners/reseller", "partners/agencies", "partners/freelancers", "partners/marketers", "partners/white-label", "referral"].flatMap((p) => [
      fixedPage(`/${p}`, p, "monthly", 0.7),
      fixedPage(`/bn/${p}`, `${p} (Bangla)`, "monthly", 0.6),
    ]),
    // /onboarding is noindex (signup flow), so it is not listed.
    fixedPage("/templates", "Templates", "weekly", 0.8),
    fixedPage("/website-for-bangladeshi-businesses", "Websites for Bangladeshi businesses", "monthly", 0.8),
    fixedPage("/contact", "Contact", "monthly", 0.6),
    fixedPage("/privacy", "Privacy policy", "yearly", 0.3),
    fixedPage("/terms", "Terms", "yearly", 0.3),
    fixedPage("/refund", "Refund policy", "yearly", 0.3),
  ];
  return [...builder, ...fixed.filter((e) => !seen.has(e.url))];
}

async function rootBuilderPages(now: string): Promise<SitemapEntry[]> {
  try {
    const admin = await createAdminClient();
    const { data: hs } = await admin.from("homepage_settings").select("use_builder_pages, live_root_slug").limit(1).maybeSingle();
    if (!hs?.use_builder_pages) return [];
    const rootSlug = (hs.live_root_slug as string | null) || ROOT_TENANT_SLUG;
    const { data: t } = await admin.from("tenants").select("id").eq("slug", rootSlug).maybeSingle();
    if (!t?.id) return [];
    // Scheduled blog posts that are due go live before they are listed.
    await publishDueForSite(t.id as string);
    const { data: pages } = await admin.from("pages").select("slug, title, updated_at, seo, type")
      .eq("tenant_id", t.id).eq("status", "published").is("deleted_at", null).limit(5000);
    const redirected = await redirectedSlugs(t.id as string);
    return (pages ?? [])
      .map((p) => {
        const slug = p.slug as string;
        return { p, path: p.type === "post" ? `/blog/${slug}` : rootPathOf(slug) };
      })
      .filter(({ p, path }) => !noIndex(p.seo) && !canonicalElsewhere(p.seo, path) && !redirected.has(p.slug as string))
      .map(({ p, path }): SitemapEntry => {
        const depth = path.split("/").filter(Boolean).length;
        return {
          url: `${ROOT_BASE}${path}`,
          title: titleOf(p),
          kind: p.type === "post" ? "post" : "page",
          lastModified: (p.updated_at as string | null) ?? now,
          changeFrequency: depth === 0 || p.type === "post" ? "weekly" : "monthly",
          priority: depth === 0 ? 1 : depth === 1 ? 0.8 : 0.6,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Paths that a redirect (Settings > Redirects) sends elsewhere, e.g. the /bd
 * short link. A published page can sit behind one; listing it in the sitemap
 * only points crawlers at a 301.
 */
async function redirectedSlugs(tenantId: string): Promise<Set<string>> {
  try {
    const admin = await createAdminClient();
    const { data } = await admin.from("page_redirects").select("from_path").eq("tenant_id", tenantId).limit(2000);
    return new Set((data ?? []).map((r) => String(r.from_path ?? "").replace(/^\/+|\/+$/g, "")).filter(Boolean));
  } catch {
    return new Set();
  }
}

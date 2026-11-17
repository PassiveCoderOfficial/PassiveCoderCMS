import { MetadataRoute } from "next";
import { contentPath } from "@/lib/posts/post-route";
import { publishDueForSite } from "@/lib/posts/scheduled";
import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenant/resolve";
import { publicUrl } from "@/lib/tenant/site-urls";
import { createAdminClient } from "@/lib/supabase/server";
import { ROOT_TENANT_SLUG } from "@/lib/flags";
import { rootPathOf } from "@/lib/pricing/hreflang";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
// Same host as the canonical tags (marketing layout / root-page.tsx). The bare
// domain 307-redirects to www, so listing it sent crawlers through a redirect
// for every URL and disagreed with every page's canonical.
const BASE = `https://${ROOT.split(":")[0]}`;

/** A page whose seo.canonical points at another URL is a duplicate: keep it out. */
function canonicalElsewhere(seo: unknown, ownPath: string): boolean {
  const c = (seo as { canonical?: string } | null)?.canonical?.trim();
  if (!c) return false;
  try {
    const p = new URL(c, BASE).pathname.replace(/\/$/, "") || "/";
    return p !== (ownPath.replace(/\/$/, "") || "/");
  } catch { return false; }
}

/**
 * Every tenant subdomain and custom domain served the SAME hardcoded
 * platform-marketing sitemap (agents/onboarding/templates/... under
 * passivecoder.com) — this file never looked at the request at all.
 * A client's real pages were never listed for any search engine, and a
 * custom-domain client's sitemap.xml pointed crawlers at a different
 * company's URLs entirely. Confirmed live on a client site. Found in
 * the 2026-09-26 production audit.
 *
 * Now: resolve the tenant from the request host first. A real tenant gets
 * its own published pages, each URL built from ITS OWN real address
 * (custom domain if attached, else its subdomain) via the same publicUrl()
 * used by the dashboard's Visit Site links — one source of truth for "what
 * is this tenant's real address" the sitemap can't drift from. No tenant
 * (root domain, or SaaS mode off) falls through to the original
 * platform-marketing list.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host") ?? "";
  const tenant = await resolveTenant(host);

  if (tenant) {
    await publishDueForSite(tenant.id);
    const admin = await createAdminClient();
    const [{ data: pages }, { data: products }, { data: properties }, { data: communities }] = await Promise.all([
      admin.from("pages").select("slug, updated_at, type, seo")
        .eq("tenant_id", tenant.id).eq("status", "published").is("deleted_at", null),
      admin.from("products").select("slug, updated_at").eq("tenant_id", tenant.id).eq("status", "active").limit(5000),
      admin.from("re_properties").select("slug, updated_at").eq("tenant_id", tenant.id).neq("status", "draft").limit(5000),
      admin.from("re_communities").select("slug").eq("tenant_id", tenant.id).limit(1000),
    ]);
    const redirected = await redirectedSlugs(tenant.id);

    const site = { slug: tenant.slug, custom_domain: tenant.custom_domain };
    const now = new Date().toISOString();
    return [
      // Pages marked "hide from search engines" stay out of the sitemap too.
      ...(pages ?? []).filter((p) => !(p.seo as { no_index?: boolean } | null)?.no_index && !canonicalElsewhere(p.seo, contentPath(p)) && !redirected.has(p.slug)).map((p) => ({
        url: publicUrl(site, contentPath(p)),
        lastModified: p.updated_at ?? now,
        changeFrequency: (p.type === "post" ? "weekly" : "monthly") as "weekly" | "monthly",
        priority: p.slug === "home" ? 1 : 0.7,
      })),
      ...(products ?? []).map((p) => ({ url: publicUrl(site, `/products/${p.slug}`), lastModified: p.updated_at ?? now, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...(properties ?? []).map((p) => ({ url: publicUrl(site, `/properties/${p.slug}`), lastModified: p.updated_at ?? now, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...(communities ?? []).map((c) => ({ url: publicUrl(site, `/communities/${c.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 })),
    ];
  }

  const now = new Date().toISOString();
  // Root site on builder pages: every published root-tenant page (country
  // and language landing pages included) is listed from the database, so a
  // new /ae/ar or /sg/cleaning-website page needs no code change. The
  // hard-coded marketing routes below fill in whatever is not a builder page.
  const builder = await rootBuilderPages(now);
  const seen = new Set(builder.map((e) => e.url));
  const fixed: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/bn`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/bn/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/website-maintenance`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/bn/website-maintenance`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/bn/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/bn/refund`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    // Partner program, English and Bangla (root-site builder pages).
    ...["company-profile-design", "partners", "partners/reseller", "partners/agencies", "partners/freelancers", "partners/marketers", "partners/white-label", "referral"].flatMap((p) => [
      { url: `${BASE}/${p}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
      { url: `${BASE}/bn/${p}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
    ]),
    // /onboarding is noindex (signup flow), so it is not listed.
    { url: `${BASE}/templates`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/website-for-bangladeshi-businesses`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/refund`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
  return [...builder, ...fixed.filter((e) => !seen.has(e.url))];
}

async function rootBuilderPages(now: string): Promise<MetadataRoute.Sitemap> {
  try {
    const admin = await createAdminClient();
    const { data: hs } = await admin.from("homepage_settings").select("use_builder_pages, live_root_slug").limit(1).maybeSingle();
    if (!hs?.use_builder_pages) return [];
    const rootSlug = (hs.live_root_slug as string | null) || ROOT_TENANT_SLUG;
    const { data: t } = await admin.from("tenants").select("id").eq("slug", rootSlug).maybeSingle();
    if (!t?.id) return [];
    // Scheduled blog posts that are due go live before they are listed.
    await publishDueForSite(t.id as string);
    const { data: pages } = await admin.from("pages").select("slug, updated_at, seo, type")
      .eq("tenant_id", t.id).eq("status", "published").is("deleted_at", null).limit(5000);
    const redirected = await redirectedSlugs(t.id as string);
    return (pages ?? [])
      .map((p) => {
        const slug = p.slug as string;
        return { p, path: p.type === "post" ? `/blog/${slug}` : rootPathOf(slug) };
      })
      .filter(({ p, path }) => !(p.seo as { no_index?: boolean } | null)?.no_index && !canonicalElsewhere(p.seo, path) && !redirected.has(p.slug as string))
      .map(({ p, path }) => {
        const depth = path.split("/").filter(Boolean).length;
        return {
          url: `${BASE}${path}`,
          lastModified: (p.updated_at as string | null) ?? now,
          changeFrequency: (depth === 0 || p.type === "post" ? "weekly" : "monthly") as "weekly" | "monthly",
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

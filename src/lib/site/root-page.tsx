import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { TenantPageWithChrome } from "@/components/site/tenant-page-with-chrome";
import { rootBuilderTenantFor, rootTenantId } from "@/lib/site/root-builder";
import { loadPreviewPage } from "@/lib/site/preview-token";
import { langForRootSlug, rootPathOf } from "@/lib/pricing/hreflang";
import { rootAlternates } from "@/lib/site/root-alternates";
import { firstParagraph } from "@/lib/seo/auto-meta";
import { loadPostForRequest, postSlugFromPath } from "@/lib/posts/post-route";
import { withPriceTokens } from "@/lib/pricing/price-tokens";


/**
 * Routes that exist only as root-site builder pages (partner program,
 * referral, their Bangla versions). On passivecoder.com they render the
 * root tenant's page with that slug; on a client's domain they render the
 * client's own page with the same slug if it has one, otherwise 404.
 */
export async function RootBuilderPage({ slug, previewToken }: { slug: string; previewToken?: string }) {
  const tenantId = (await headers()).get("x-tenant-id");
  // Signed draft-preview link (seed scripts, dashboard): the draft of a page
  // that is not published yet renders on its real URL, never indexed.
  if (previewToken) {
    const rootId = tenantId ?? (await rootTenantId());
    const draft = rootId ? await loadPreviewPage(rootId, slug, previewToken) : null;
    if (draft) return <TenantPageWithChrome tenantId={rootId!} slug={slug} root={!tenantId} draft={draft} />;
  }
  // Blog post at /blog/<slug> (published, or a preview for signed-in members).
  const postSlug = postSlugFromPath(slug);
  if (postSlug) {
    const siteId = tenantId ?? (await rootTenantId());
    const hit = siteId ? await loadPostForRequest(siteId, postSlug) : null;
    if (!hit) notFound();
    return <TenantPageWithChrome tenantId={siteId!} slug={slug} root={!tenantId} draft={hit.post} postPreview={hit.preview} />;
  }
  if (tenantId) return <TenantPageWithChrome tenantId={tenantId} slug={slug} />;
  const root = await rootBuilderTenantFor(slug);
  if (!root) notFound();
  return <TenantPageWithChrome tenantId={root} slug={slug} root />;
}

type Seo = { title?: string; description?: string; lang?: string; alternates?: Record<string, string>; image?: string };

/** `describe`: with no SEO description, fall back to the excerpt or the
 *  first paragraph (blog posts rarely have one written). */
export async function rootBuilderMetadata(slug: string, { describe = false }: { describe?: boolean } = {}): Promise<Metadata> {
  const h = await headers();
  const tenantId = h.get("x-tenant-id") ?? (await rootBuilderTenantFor(slug));
  // Absolute addresses: search engines want full URLs in canonical and hreflang.
  const origin = `https://${(h.get("x-forwarded-host") ?? h.get("host") ?? "passivecoder.com").split(",")[0].trim()}`;
  const postSlug = postSlugFromPath(slug);
  if (postSlug) {
    const siteId = h.get("x-tenant-id") ?? (await rootTenantId());
    return siteId ? postMetadata(siteId, postSlug, `${origin}/${slug}`, !h.get("x-tenant-id")) : {};
  }
  if (!tenantId) return {};
  const admin = await createAdminClient();
  const { data: stored } = await admin.from("pages").select(describe ? "title, seo, excerpt, blocks" : "title, seo").eq("tenant_id", tenantId).eq("slug", slug)
    .eq("status", "published").is("deleted_at", null).maybeSingle<{ title: string; seo: Seo | null; excerpt?: string | null; blocks?: unknown }>();
  if (!stored) return {};
  const page = await withPriceTokens(stored);
  const seo = { ...((page.seo ?? {}) as Seo) };
  if (describe && !seo.description?.trim()) {
    const d = page.excerpt?.trim() || firstParagraph(page.blocks);
    if (d) seo.description = d;
  }
  const title = seo.title ?? (page.title as string);
  const abs = (p: string) => `${origin}${p}`;
  // Country/language pages compute their hreflang set from the URL rules
  // (lib/pricing/hreflang.ts); a manual seo.alternates (lang → path) wins.
  const computed = Object.fromEntries(Object.entries(await rootAlternates(tenantId, slug)).map(([l, p]) => [l, abs(p)]));
  const path = rootPathOf(slug);
  // x-default: the main-language version. A page without seo.lang IS that
  // version (Arabic on an Arabic-first site with English at /en/...);
  // a translated page points at the English one as before.
  const xDefault = seo.alternates && (!seo.lang && Object.values(seo.alternates).includes(path) ? path : seo.alternates.en);
  const manual = seo.alternates
    ? { ...Object.fromEntries(Object.entries(seo.alternates).map(([l, p]) => [l, abs(p)])), ...(xDefault ? { "x-default": abs(xDefault) } : {}) }
    : {};
  const languages = { ...computed, ...manual };
  const lang = seo.lang ?? langForRootSlug(slug);
  // The root site's default share image; tenants keep their layout's image.
  const image = seo.image ?? (h.get("x-tenant-id") ? undefined : abs("/images/og-contractor-sites.jpg"));
  return {
    title,
    ...(seo.description ? { description: seo.description } : {}),
    alternates: {
      canonical: abs(path),
      ...(Object.keys(languages).length > 1 ? { languages } : {}),
    },
    // Full OG + twitter set per page. Without url/siteName/image here the
    // page's openGraph replaced the layout's wholesale (no og:image or og:url
    // on any inner page) and twitter:* fell back to the homepage defaults, so
    // every shared link showed the homepage's title and description.
    openGraph: {
      type: "website",
      url: abs(path),
      ...(h.get("x-tenant-id") ? {} : { siteName: "Passive Coder" }),
      title,
      ...(seo.description ? { description: seo.description } : {}),
      ...(image ? { images: [image] } : {}),
      locale: lang === "bn" ? "bn_BD" : lang === "ar" ? "ar_AE" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      ...(seo.description ? { description: seo.description } : {}),
      ...(image ? { images: [image] } : {}),
    },
  };
}

/** Metadata for a blog post at /blog/<slug>: its featured image is the share
 *  image, previews are never indexed. */
export async function postMetadata(tenantId: string, postSlug: string, url: string, root: boolean): Promise<Metadata> {
  const hit = await loadPostForRequest(tenantId, postSlug);
  if (!hit) return {};
  const p = hit.post as { title: string; seo: Seo | null; excerpt?: string | null; blocks?: unknown; featured_image?: string | null; published_at?: string | null };
  const seo = (p.seo ?? {}) as Seo & { og_image?: string };
  const title = seo.title ?? p.title;
  const description = seo.description?.trim() || p.excerpt?.trim() || firstParagraph(p.blocks) || undefined;
  const image = p.featured_image || seo.og_image || seo.image || (root ? `${new URL(url).origin}/images/og-contractor-sites.jpg` : undefined);
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: url },
    ...(hit.preview ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: "article", url, title,
      ...(root ? { siteName: "Passive Coder" } : {}),
      ...(description ? { description } : {}),
      ...(image ? { images: [image] } : {}),
      ...(p.published_at ? { publishedTime: p.published_at } : {}),
    },
    twitter: { card: "summary_large_image", title, ...(description ? { description } : {}), ...(image ? { images: [image] } : {}) },
  };
}

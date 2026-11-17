import { notFound, permanentRedirect } from "next/navigation";
import { publishDueForSite } from "@/lib/posts/scheduled";
import { faqJsonLd, ldScript } from "@/lib/seo/jsonld";
import { headers } from "next/headers";
import { cache } from "react";
import { after } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { recordPageView } from "@/lib/usage/record-page-view";
import { PageRenderer } from "@/components/site/page-renderer";
import { SiteHeaderChrome, HIDE_GLOBAL_CHROME_CSS } from "@/components/site/site-header-chrome";
import { MarketplaceHome } from "@/modules/registry/marketplace/home";
import { MarketplaceShopView } from "@/modules/registry/marketplace/shop-view";
import { isEcomMarketplace } from "@/modules/registry/marketplace/is-marketplace";
import { fetchGlobalLayout, fetchTranslatedChrome, withPrefooter, isChromeBlock, toBlocks } from "@/lib/site/global-blocks";
import { previewOverlay } from "@/lib/support-ai/preview";
import { getStudioHeader } from "@/lib/site/header-studio";
import { getStudioFooter } from "@/lib/site/footer-studio";
import { studioLangChrome } from "@/modules/header-studio/model";
import { isSaaS } from "@/lib/flags";
import { resolveTenant } from "@/lib/tenant/resolve";
import { publicUrl } from "@/lib/tenant/site-urls";
import { firstParagraph } from "@/lib/seo/auto-meta";
import { withPriceTokens } from "@/lib/pricing/price-tokens";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { setRenderLang, setRenderEntry } from "@/lib/collections/render";
import { findEntryPage, entryTemplate, fillEntry, sampleEntryPage, type EntryPage } from "@/lib/collections/detail";
import { withSiteMedia } from "@/lib/media/site-media";
import { loadPreviewPage } from "@/lib/site/preview-token";
import { editorBridgeScript } from "@/lib/site/editor-bridge";
import { loadPostForRequest, postSlugFromPath } from "@/lib/posts/post-route";
import { postMetadata } from "@/lib/site/root-page";
import { PostHeader } from "@/components/site/post-header";
import { PostJsonLd, RelatedPosts } from "@/components/site/post-extras";
import type { Block, Page } from "@/types/cms";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

/** Marketplace category at its top-level address (/fashion), when no page owns that slug. */
const loadMarketplaceCategory = cache(async (tenantId: string | null, slug: string[] | undefined) => {
  if (!tenantId || slug?.length !== 1 || !(await isEcomMarketplace(tenantId))) return null;
  const admin = await createAdminClient();
  const { data } = await admin.from("categories").select("id, name, slug, description").eq("tenant_id", tenantId)
    .eq("type", "product").eq("slug", slug[0]).maybeSingle();
  return data;
});

/** The published page for this slug, once per request (metadata and body share it). */
const loadPublishedPage = cache(async (tenantId: string | null, pageSlug: string) => {
  // Publish any scheduled post that is now due before reading (throttled).
  await publishDueForSite(tenantId);
  const supabase = await createClient();
  let q = supabase.from("pages").select("*").eq("slug", pageSlug).eq("status", "published").is("deleted_at", null);
  q = tenantId ? q.eq("tenant_id", tenantId) : q.is("tenant_id", null);
  const { data } = await q.maybeSingle();
  return data;
});

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pageSlug = slug?.join("/") ?? "home";

  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  // Draft preview link from the mobile app: never indexed.
  const previewToken = (await searchParams).pc_preview;
  if (previewToken) {
    const preview = await loadPreviewPage(tenantId, pageSlug, previewToken);
    if (preview) return { title: (await withPriceTokens(preview.seo as Page["seo"] | null))?.title ?? preview.title, robots: { index: false, follow: false } };
  }

  // Blog post at /blog/<slug> (a preview for signed-in members when unpublished).
  const postSlug = tenantId ? postSlugFromPath(pageSlug) : null;
  if (postSlug && !(await loadPublishedPage(tenantId, pageSlug))) {
    const tenant = await resolveTenant(reqHeaders.get("host") ?? "");
    const url = tenant ? publicUrl({ slug: tenant.slug, custom_domain: tenant.custom_domain }, `/${pageSlug}`) : `/${pageSlug}`;
    const meta = await postMetadata(tenantId!, postSlug, url, false);
    return Object.keys(meta).length ? meta : { title: "Not Found" };
  }

  const page = await withPriceTokens(await loadPublishedPage(tenantId, pageSlug));

  if (!page) {
    const cat = await loadMarketplaceCategory(tenantId, slug);
    if (cat) return { title: cat.name, description: cat.description ?? `Shop ${cat.name} from trusted sellers.`, alternates: { canonical: `/${cat.slug}` } };
    // Collection entry page (/<prefix>/<entry>)?
    const ep = tenantId && slug ? await findEntryPage(tenantId, slug) : null;
    return ep ? entryMetadata(ep) : { title: "Not Found" };
  }

  const seo = page.seo as Page["seo"];
  const ne = (v: string | null | undefined) =>
    typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;

  // No description written: the page's own first paragraph, never blank.
  const pageDescription = ne(seo?.description) ?? firstParagraph(page.blocks) ?? undefined;
  const ogDescription = ne(seo?.og_description) ?? pageDescription;
  const ogTitle = ne(seo?.og_title) ?? ne(seo?.title) ?? page.title;
  const ogImage = ne(seo?.og_image);

  // Keys are omitted, never set to undefined. Next merges page metadata over
  // the layout's per key, and an explicit `description: undefined` counts as
  // a value — it replaced the tenant description from (site)/layout.tsx with
  // nothing, which is why tenant sites fell back to the platform's. Same for
  // openGraph: sending the object with an undefined description wipes the
  // layout's, so it's only included when there's something to say.
  const og: NonNullable<Metadata["openGraph"]> = { title: ogTitle };
  if (ogDescription) og.description = ogDescription;
  if (ogImage) og.images = [ogImage];

  return {
    title: ne(seo?.title) ?? page.title,
    ...(pageDescription ? { description: pageDescription } : {}),
    ...(seo?.keywords ? { keywords: seo.keywords } : {}),
    openGraph: og,
    ...(seo?.no_index ? { robots: { index: false } } : {}),
    ...(await withLanguageAlternates(resolveCanonical(seo?.canonical, tenantId, pageSlug), seo?.alternates)),
  };
}

async function withLanguageAlternates(
  canonical: ReturnType<typeof resolveCanonical>,
  languages: Record<string, string> | undefined,
): Promise<Partial<Metadata>> {
  const base = await canonical;
  if (!languages || Object.keys(languages).length === 0) return base;
  return { ...base, alternates: { ...(base.alternates ?? {}), languages } };
}

const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);

function entryMetadata({ entry, lang, alternates }: EntryPage): Metadata {
  const t = lang ? entry.translations?.[lang] : undefined;
  const title = entry.seo?.title || t?.title || entry.title;
  const description = entry.seo?.description || t?.excerpt || entry.excerpt || undefined;
  return {
    title,
    ...(description ? { description } : {}),
    openGraph: { title, ...(description ? { description } : {}), ...(entry.image_url ? { images: [entry.image_url] } : {}) },
    ...(Object.keys(alternates).length ? { alternates: { languages: alternates } } : {}),
  };
}

/** A collection entry drawn with its collection's template page. */
async function EntryPageView({ tenantId, ep, path, prefooter }: { tenantId: string; ep: EntryPage; path: string; prefooter: Block[] }) {
  setRenderLang(ep.lang);
  setRenderEntry(ep.entry.id);
  const blocks = fillEntry(await entryTemplate(tenantId, ep.type, ep.lang), ep, path);
  // A translated template brings its own header/footer, like a translated page.
  const ownChrome = blocks.some((b) => isChromeBlock(b, "header"));
  const dir = ep.lang && RTL_LANGS.has(ep.lang) ? "rtl" : undefined;
  return (
    <div className="min-h-screen" lang={ep.lang ?? undefined} dir={dir}>
      {ownChrome && <style dangerouslySetInnerHTML={{ __html: HIDE_GLOBAL_CHROME_CSS }} />}
      {ownChrome && <SiteHeaderChrome localized blocks={withSiteMedia(blocks.filter((b) => isChromeBlock(b, "header")))} />}
      <PageRenderer blocks={withSiteMedia(ownChrome ? blocks.filter((b) => !isChromeBlock(b, "header")) : ep.lang ? blocks : withPrefooter(blocks, prefooter))} />
      <LanguageSwitcher alternates={ep.alternates} current={ep.lang ?? Object.keys(ep.alternates)[0] ?? ""} chrome={blocks.filter((b) => isChromeBlock(b, "header"))} />
    </div>
  );
}

/**
 * A page only got a canonical tag if a client had manually typed one into
 * their SEO settings — nobody does, so almost every published page had
 * none at all. Without one, a tenant whose .passivecoder.com subdomain
 * still resolves alongside an attached custom domain (the normal state —
 * attaching a custom domain never stops the subdomain from working) has no
 * signal telling search engines which host is authoritative, and can be
 * indexed as duplicate content under both. Defaults to this page's own
 * real address (custom domain if attached, else the subdomain) via the
 * same publicUrl() the dashboard's Visit Site links use — the one place
 * "what is this tenant's real address" is decided. A manually-set
 * seo.canonical always wins; this only fills the gap when there isn't one.
 */
async function resolveCanonical(
  manualCanonical: string | null | undefined,
  tenantId: string | null,
  pageSlug: string,
): Promise<Pick<Metadata, "alternates">> {
  if (manualCanonical) return { alternates: { canonical: manualCanonical } };
  if (!tenantId) return {};

  const reqHeaders = await headers();
  const tenant = await resolveTenant(reqHeaders.get("host") ?? "");
  if (!tenant) return {};

  const path = pageSlug === "home" ? "/" : `/${pageSlug}`;
  return { alternates: { canonical: publicUrl({ slug: tenant.slug, custom_domain: tenant.custom_domain }, path) } };
}

export default async function SitePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const pageSlug = slug?.join("/") ?? "home";

  // In SaaS mode the proxy injects x-tenant-id. In standalone / local dev,
  // marketing routes should take priority — but Next.js catch-all still wins
  // at the router level. We guard here: if no tenant header and not root, 404
  // (which forces Next.js to try the more-specific marketing route group next).
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");
  const isRoot = !slug || slug.length === 0;

  if (isSaaS && !tenantId && !isRoot) {
    // Check if this is a root-level page (tenant_id IS NULL) before 404ing
    const supabaseCheck = await createClient();
    const { data: rootCheck } = await supabaseCheck
      .from("pages")
      .select("id")
      .eq("slug", pageSlug)
      .eq("status", "published")
      .is("tenant_id", null)
      .is("deleted_at", null)
      .maybeSingle();
    if (!rootCheck) notFound();
  }

  // Standalone: the proxy injects the install's single site on every request
  // (lib/tenant/standalone.ts), so no header means there is no site to show.
  if (!isSaaS && !tenantId) notFound();

  // Signed draft-preview link (mobile app): the page with its unpublished
  // draft in place, even when the page itself isn't published yet.
  const sp = await searchParams;
  const previewToken = sp.pc_preview;
  const draftPreview = previewToken ? await loadPreviewPage(tenantId, pageSlug, previewToken) : null;
  // Editor mode (mobile app page editor): blocks become tappable, links inert.
  const editorScript = draftPreview && sp.editor === "1"
    ? <script dangerouslySetInnerHTML={{ __html: editorBridgeScript() }} />
    : null;

  // Blog post at /blog/<slug>: published, or a preview for signed-in members.
  const postSlug = tenantId && !draftPreview ? postSlugFromPath(pageSlug) : null;
  const postHit = postSlug && !(await loadPublishedPage(tenantId, pageSlug)) ? await loadPostForRequest(tenantId!, postSlug) : null;
  if (postSlug && !postHit && !(await loadPublishedPage(tenantId, pageSlug))) notFound();
  const postPreview = !!postHit?.preview;

  // Page row and the site's global header/footer in one round trip.
  // getStudioHeader is React-cached: the layout already asked for it this request.
  const [livePage, liveLayout, preview, studioHeader, studioFooter] = await Promise.all([draftPreview ?? postHit?.post ?? loadPublishedPage(tenantId, pageSlug), fetchGlobalLayout(tenantId), previewOverlay(tenantId), getStudioHeader(tenantId), getStudioFooter(tenantId)]);
  // AI support preview (cookie from /api/support/preview/<token>): the
  // proposed change set applied on top of the live content, never cached.
  const previewPage = livePage ? preview?.pages.get(livePage.id) : undefined;
  const page = await withPriceTokens(livePage && previewPage ? { ...livePage, blocks: previewPage.blocks, title: previewPage.title } : livePage);
  const pi = preview?.identity;
  const globalLayout = pi
    ? {
        header: pi.global_header !== undefined ? toBlocks(pi.global_header) : liveLayout.header,
        footer: pi.global_footer !== undefined ? toBlocks(pi.global_footer) : liveLayout.footer,
        prefooter: pi.global_prefooter !== undefined ? toBlocks(pi.global_prefooter) : liveLayout.prefooter,
      }
    : liveLayout;

  // Collection entry page (/<prefix>/<entry>, or /<lang>/<prefix>/<entry>).
  if (!page && !isRoot && tenantId) {
    const ep = await findEntryPage(tenantId, slug!);
    if (ep) {
      after(() => recordPageView(tenantId, `/${pageSlug}`, reqHeaders.get("user-agent"), reqHeaders.get("referer"), reqHeaders.get("host"), reqHeaders.get("x-vercel-ip-country")));
      return <EntryPageView tenantId={tenantId} ep={ep} path={`/${pageSlug}`} prefooter={globalLayout.prefooter} />;
    }
  }

  // Old address of a page whose URL changed: 301 to the new one.
  if (!page && !isRoot && tenantId) {
    const admin = await createAdminClient();
    const { data: r } = await admin.from("page_redirects").select("id, to_path, hits")
      .eq("tenant_id", tenantId).eq("from_path", pageSlug).maybeSingle();
    if (r) {
      after(async () => { await admin.from("page_redirects").update({ hits: (r.hits ?? 0) + 1 }).eq("id", r.id); });
      permanentRedirect(r.to_path === "home" ? "/" : `/${r.to_path}`);
    }
  }
  if (!page && !isRoot) {
    const cat = await loadMarketplaceCategory(tenantId, slug);
    if (!cat) notFound();
    after(() => recordPageView(tenantId!, `/${pageSlug}`, reqHeaders.get("user-agent"), reqHeaders.get("referer"), reqHeaders.get("host"), reqHeaders.get("x-vercel-ip-country")));
    const sp = await searchParams;
    return <MarketplaceShopView tenantId={tenantId!} sp={{ q: sp.q, vendor: sp.vendor, sort: sp.sort, min: sp.min, max: sp.max, rating: sp.rating, page: sp.page, category: cat.id }} />;
  }

  // Recorded here, past the notFound() above: a 404 isn't a real pageview of
  // this page and shouldn't count as one. Uses pageSlug directly from this
  // component's own route params rather than an injected x-pathname header —
  // (site)/layout.tsx tried the header route first; it didn't reliably reach
  // this layer (root-caused to Next 16's middleware→Proxy rename changing
  // the response-header-forwarding contract in a way several targeted fixes
  // didn't resolve), so this sidesteps that mechanism entirely.
  // A post's old /<slug> address: it lives at /blog/<slug> now.
  if (page && page.type === "post" && !postHit && !draftPreview) permanentRedirect(`/blog/${page.slug}`);

  if (tenantId && !draftPreview && !postPreview) {
    after(() =>
      recordPageView(
        tenantId,
        isRoot ? "/" : `/${pageSlug}`,
        reqHeaders.get("user-agent"),
        reqHeaders.get("referer"),
        reqHeaders.get("host"),
        reqHeaders.get("x-vercel-ip-country"),
      ),
    );
  }

  if (!page) {
    // A marketplace tenant with no hand-built home page still has a real
    // storefront to show — products, categories and sellers all live in the
    // database already. Rendering it beats bouncing shoppers to the dashboard
    // or showing them an empty CMS shell.
    if (tenantId) {
      const admin = await createAdminClient();
      const { count: sellerCount } = await admin
        .from("vendors")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "approved")
        .contains("capabilities", ["ecommerce"]);
      if ((sellerCount ?? 0) > 0) {
        const { data: identity } = await admin
          .from("site_identity")
          .select("site_name")
          .eq("tenant_id", tenantId)
          .maybeSingle();
        return (
          <MarketplaceHome
            tenantId={tenantId}
            siteName={identity?.site_name ?? "our marketplace"}
          />
        );
      }
    }

    // No home page published — send visitor to dashboard to set one up.
    // Never show a placeholder welcome screen to public visitors.
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }

  // A collection's entry-page template, opened directly: shown with a sample entry.
  const templateOf = (page.settings as { collection_template?: string } | null)?.collection_template;
  if (templateOf && tenantId) {
    const ep = await sampleEntryPage(tenantId, templateOf);
    if (ep) return <EntryPageView tenantId={tenantId} ep={ep} path={`/${pageSlug}`} prefooter={globalLayout.prefooter} />;
  }

  const rawBlocks: Block[] = Array.isArray(page.blocks) ? page.blocks : [];

  // Site chrome (header/footer) is rendered once by (site)/layout.tsx from
  // site_identity.global_header / global_footer. When those exist, strip any
  // per-page navigation/footer blocks so they don't render twice.
  const { header, footer, prefooter } = globalLayout;
  // A translated page brings its own localized navigation/footer, so it keeps
  // them and the layout's global (default-language) chrome is hidden instead.
  const lang = (page.seo as Page["seo"] | null)?.lang?.trim().toLowerCase() || null;
  // Collection entries on this page come out in the page's language.
  setRenderLang(lang);
  const dir = lang && RTL_LANGS.has(lang.split("-")[0]) ? "rtl" : "ltr";
  // A published Header Studio header is site chrome too: per-page nav blocks
  // must not render under it. No studio header = the old rule, unchanged.
  const hasGlobalHeader = (header.length > 0 || !!studioHeader) && !lang;
  // Same for a published Footer Studio footer and per-page footer blocks.
  const hasGlobalFooter = (footer.length > 0 || !!studioFooter) && !lang;
  const blocks: Block[] = rawBlocks.filter((b) => {
    if (hasGlobalHeader && isChromeBlock(b, "header")) return false;
    if (hasGlobalFooter && isChromeBlock(b, "footer")) return false;
    return true;
  });

  // Global pre-footer (CTA + contact) — injected once site-wide, skipped on pages
  // that already have their own contact block.
  const finalBlocks = withSiteMedia(!lang ? withPrefooter(blocks, prefooter) : blocks);

  // Language versions of this page (seo.alternates) get a visitor switcher.
  const alternates = (page.seo as Page["seo"] | null)?.alternates ?? null;
  const ownPath = pageSlug === "home" ? "/" : `/${pageSlug}`;
  const currentLang = lang ?? Object.entries(alternates ?? {}).find(([, p]) => p === ownPath)?.[0] ?? "";

  if (lang) {
    // A language version without its own header/footer borrows them from
    // that language's home page, so the translated chrome lives in one place.
    let localized = finalBlocks;
    if (tenantId && pageSlug !== lang && !finalBlocks.some((b) => isChromeBlock(b, "header"))) {
      const chrome = await fetchTranslatedChrome(tenantId, lang);
      if (chrome) localized = [...withSiteMedia(chrome.header), ...finalBlocks, ...withSiteMedia(chrome.footer)];
    }
    const localizedHeader = localized.filter((b) => isChromeBlock(b, "header"));
    return (
      <div className="min-h-screen" lang={lang} dir={dir}>
        <style dangerouslySetInnerHTML={{ __html: HIDE_GLOBAL_CHROME_CSS }} />
        {/* The page's own header goes in the site header slot (flattened
            wrappers), so it stays pinned on scroll like the global one. */}
        {localizedHeader.length > 0 && <SiteHeaderChrome localized blocks={localizedHeader} />}
        {page.type === "post" && <PostHeader post={page as Record<string, unknown>} preview={postPreview} />}
        <PageRenderer blocks={localized.filter((b) => !isChromeBlock(b, "header"))} />
        {page.type === "post" && !postPreview && <><PostJsonLd post={page as Record<string, unknown>} /><RelatedPosts post={page as Record<string, unknown>} /></>}
        <LanguageSwitcher alternates={alternates} current={currentLang} chrome={localizedHeader} />
        {editorScript}
      </div>
    );
  }

  const faq = faqJsonLd(finalBlocks);
  return (
    <div className="min-h-screen">
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(faq) }} />}
      {page.type === "post" && <PostHeader post={page as Record<string, unknown>} preview={postPreview} />}
      <PageRenderer blocks={finalBlocks} />
      {page.type === "post" && !postPreview && <><PostJsonLd post={page as Record<string, unknown>} /><RelatedPosts post={page as Record<string, unknown>} /></>}
      <LanguageSwitcher alternates={alternates} current={currentLang} chrome={studioHeader ? studioLangChrome(studioHeader.config) : header} />
      {editorScript}
    </div>
  );
}

/** LanguageSwitcher hides itself when the header already switches language natively. */

// Pages are dynamic — disable static generation for catch-all
export const dynamic = "force-dynamic";

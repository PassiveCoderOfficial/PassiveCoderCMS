import { createAdminClient, createClient } from "@/lib/supabase/server";
import { styleText } from "@/lib/security/style-text";
import { scriptJson } from "@/lib/security/style-text";
import { PageRenderer } from "@/components/site/page-renderer";
import { faqJsonLd, ldScript } from "@/lib/seo/jsonld";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { CartProvider } from "@/lib/cart/cart-context";
import { fetchGlobalLayout, toBlocks, withPrefooter, isChromeBlock } from "@/lib/site/global-blocks";
import { resolveDbTemplateIdentity } from "@/modules/templates/resolve-identity";
import { buildSiteTheme, type SiteThemeInput } from "@/modules/themes/site-theme";
import type { Block } from "@/types/cms";
import { getStudioHeader } from "@/lib/site/header-studio";
import { studioLangChrome } from "@/modules/header-studio/model";
import { StudioSiteHeader } from "@/components/site/header-studio/studio-site-header";
import { getStudioFooter } from "@/lib/site/footer-studio";
import { StudioSiteFooter } from "@/components/site/footer-studio/studio-site-footer";

/**
 * Renders a tenant's DB page (by slug) wrapped in the global header + footer.
 * Used by explicit (marketing) routes that win over the (site) catch-all on
 * tenant subdomains (contact, pricing, privacy, terms, refund, etc.) so they
 * still show the site chrome instead of 404ing.
 *
 * Also injects the tenant's template CSS vars — same resolve + build the
 * (site) layout and the homepage's own tenant branch use. Without this these
 * routes rendered on the bare shadcn default palette (navy/slate) instead of
 * the tenant's brand colors, so a page built and previewed correctly in the
 * editor came out with the wrong CTA button color, wrong accents, etc. the
 * moment it published — the one difference between editor and live that
 * this component alone was responsible for.
 */
import { withPreview } from "@/lib/support-ai/preview";
import { withPriceTokens } from "@/lib/pricing/price-tokens";
import { PreviewBar } from "@/components/support/preview-bar";
import { langForRootSlug, rootPathOf, switcherAlternates } from "@/lib/pricing/hreflang";
import { rootAlternates } from "@/lib/site/root-alternates";
import { PostHeader } from "@/components/site/post-header";
import { PostJsonLd, RelatedPosts } from "@/components/site/post-extras";
import { getPanelTimeZone } from "@/lib/time/panel-tz-server";

/** `root`: the platform's own site, whose country/language pages (/sa, /ae/ar,
 *  /bn/...) get their language and alternates from the URL rules when the
 *  page's SEO settings leave them blank. */
/** `draft`: a page row to render instead of the published one (signed
 *  draft-preview links, lib/site/preview-token.ts); never indexed. */
/** `postPreview`: the draft is an unpublished blog post shown to a signed-in
 *  member (lib/posts/post-route.ts); it gets the preview banner. */
export async function TenantPageWithChrome({ tenantId, slug, root = false, draft, postPreview = false }: { tenantId: string; slug: string; root?: boolean; draft?: Record<string, unknown> | null; postPreview?: boolean }) {
  const supabase = await createClient();
  const admin = await createAdminClient();
  const [{ data: livePage }, liveLayout, { data: identity }, { data: settings }, studioHeader, studioFooter] = await Promise.all([
    draft ? Promise.resolve({ data: draft }) : supabase.from("pages").select("*").eq("slug", slug).eq("status", "published").eq("tenant_id", tenantId).is("deleted_at", null).maybeSingle(),
    fetchGlobalLayout(tenantId),
    admin.from("site_identity")
      .select("template_id, color_overrides, design_overrides")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    admin.from("site_settings").select("language").eq("tenant_id", tenantId).maybeSingle(),
    // Published Header Studio header (null = classic chrome, unchanged).
    getStudioHeader(tenantId),
    // Published Footer Studio footer (null = classic chrome, unchanged).
    getStudioFooter(tenantId),
  ]);

  // AI support preview (cookie): proposed change set applied on top.
  const { page: previewed, layout, preview } = await withPreview(tenantId, livePage, liveLayout);
  const page = await withPriceTokens(previewed);

  const templateIdentity = identity?.template_id
    ? await resolveDbTemplateIdentity(identity.template_id)
    : null;

  const { css: templateCSSVars } = buildSiteTheme(identity as SiteThemeInput | null, templateIdentity);
  const templateCustomCss = templateIdentity?.customCss ?? null;

  const rawBlocks: Block[] = toBlocks(page?.blocks);
  const { header, footer, prefooter } = layout;
  // This component renders header/footer separately (below) whenever the
  // tenant has global chrome — a page's own nav/footer block must be
  // stripped the same way (site)/[...slug]/page.tsx and (marketing)/page.tsx
  // already do, or it renders twice. Missed here originally: found live
  // (2026-09-09) on a client site's /contact showing two full headers —
  // this is the third of three render paths a tenant page can take
  // (site catch-all, marketing homepage, and this one for /contact,
  // /pricing, /privacy, /terms, /refund), and only the first two got the
  // isChromeBlock fix when the double-render bug from the nav migration
  // was found and fixed. Same bug, same fix, third place it was hiding.
  // A translated page (seo.lang, e.g. the Bangla root site) carries its own
  // navigation and footer in its language; the global (default-language)
  // chrome is skipped for it. Same rule as (site)/[...slug]/page.tsx.
  const seo = (page?.seo ?? null) as { lang?: string; alternates?: Record<string, string>; jsonld?: unknown } | null;
  const slugLang = root ? langForRootSlug(slug) : "en";
  const lang = seo?.lang?.trim().toLowerCase() || (slugLang !== "en" ? slugLang : null);
  const ownChrome = !!lang && rawBlocks.some((b) => isChromeBlock(b, "header"));
  // A translated page with its own chrome keeps it, studio header or not.
  const studio = ownChrome ? null : studioHeader;
  const hasGlobalHeader = (header.length > 0 || !!studio) && !ownChrome;
  const studioFoot = ownChrome ? null : studioFooter;
  const hasGlobalFooter = (footer.length > 0 || !!studioFoot) && !ownChrome;
  const blocks: Block[] = rawBlocks.filter((b) => {
    if (hasGlobalHeader && isChromeBlock(b, "header")) return false;
    if (hasGlobalFooter && isChromeBlock(b, "footer")) return false;
    return true;
  });
  const body = ownChrome ? blocks : withPrefooter(blocks, prefooter);
  const alternates = seo?.alternates ?? (root ? switcherAlternates(slug, await rootAlternates(tenantId, slug)) : null);
  const ownPath = rootPathOf(slug);
  // A main-language page takes the site's language (Settings > Languages):
  // an Arabic-first site's /contact or /terms renders here, outside
  // (site)/layout.tsx and its data-site-lang root, and was left-to-right.
  const mainLang = ((settings?.language as string | undefined) || "en").split("-")[0].toLowerCase();
  const pageLang = lang ?? mainLang;
  const rtl = ["ar", "ur", "fa", "he"].includes(pageLang.split("-")[0]);
  const currentLang = lang ?? Object.entries(alternates ?? {}).find(([, p]) => p === ownPath)?.[0] ?? "en";
  // Structured data: FAQ from the page's FAQ block (same as the site
  // catch-all) plus anything the page stores in seo.jsonld (Service, Offer,
  // Breadcrumb) so landing pages can answer search and AI engines directly.
  const faq = faqJsonLd(body);
  const seoLd = seo?.jsonld;
  const extraLd: unknown[] = Array.isArray(seoLd) ? seoLd : seoLd ? [seoLd] : [];
  // Root-site pages without their own BreadcrumbList get one from the URL
  // (Home > section > page), so every inner page shows a breadcrumb trail
  // in search results instead of a bare URL.
  const hasCrumbs = extraLd.some((ld) => JSON.stringify(ld ?? "").includes("BreadcrumbList"));
  if (root && !hasCrumbs && slug !== "home" && slug !== "bn/home" && slug !== "ar/home") {
    const crumbs = rootBreadcrumbs(ownPath, (page?.title as string | undefined) ?? slug);
    if (crumbs) extraLd.push(crumbs);
  }
  // CartProvider like (site)/layout.tsx: the navigation block's cart icon
  // calls useCart() and logged an error on every root-site page without it.
  return (
    <CartProvider>
    <div className={lang ? "min-h-screen" : "pc-site-lang-root min-h-screen"} data-site-lang={mainLang} lang={lang ?? (mainLang !== "en" ? mainLang : undefined)} dir={rtl ? "rtl" : undefined}>
      {!lang && rtl && (
        <style precedence="pc-base" href="pc-translated-ltr" dangerouslySetInnerHTML={{ __html: "html.translated-ltr .pc-site-lang-root{direction:ltr}" }} />
      )}
      {/* The root layout prints <html lang="en">; a translated page sets the
          document language and direction itself so screen readers, the font
          stack ([lang="ar"]) and scrollbars follow the page, not the shell. */}
      {lang && <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${scriptJson(lang)};document.documentElement.dir=${scriptJson(rtl ? "rtl" : "ltr")}` }} />}
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(faq) }} />}
      {extraLd.map((ld, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(ld) }} />)}
      <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: templateCSSVars }} />
      {templateCustomCss && <style precedence="pc-template-css" dangerouslySetInnerHTML={{ __html: styleText(templateCustomCss) }} />}
      {studio ? <StudioSiteHeader tenantId={tenantId} data={studio} /> : hasGlobalHeader && <PageRenderer blocks={header} />}
      {page?.type === "post" && <PostHeader post={page as Record<string, unknown>} preview={postPreview} timeZone={root ? await getPanelTimeZone() : undefined} />}
      <PageRenderer blocks={body} />
      {page?.type === "post" && !postPreview && <><PostJsonLd post={page as Record<string, unknown>} /><RelatedPosts post={page as Record<string, unknown>} /></>}
      {studioFoot ? <StudioSiteFooter tenantId={tenantId} data={studioFoot} /> : hasGlobalFooter && <PageRenderer blocks={footer} />}
      <LanguageSwitcher alternates={alternates} current={currentLang} chrome={ownChrome ? rawBlocks.filter((b) => isChromeBlock(b, "header")) : studio ? studioLangChrome(studio.config) : header} />
      {preview && <PreviewBar />}
    </div>
    </CartProvider>
  );
}

const ROOT_ORIGIN = `https://${(process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com").split(":")[0]}`;

/** BreadcrumbList for a root-site path, e.g. /bn/partners/reseller -> হোম > Partners > page. */
function rootBreadcrumbs(path: string, title: string) {
  const segs = path.split("/").filter(Boolean);
  if (!segs.length) return null;
  const langPrefix = ["bn", "ar"].includes(segs[0]) ? segs[0] : null;
  const homePath = langPrefix === "bn" ? "/bn" : langPrefix === "ar" ? "/ar" : "/";
  const rest = langPrefix ? segs.slice(1) : segs;
  if (!rest.length) return null;
  const items: { name: string; url: string }[] = [{ name: langPrefix === "bn" ? "হোম" : langPrefix === "ar" ? "الرئيسية" : "Home", url: `${ROOT_ORIGIN}${homePath === "/" ? "/" : homePath}` }];
  for (let i = 0; i < rest.length - 1; i++) {
    const p = `/${[...(langPrefix ? [langPrefix] : []), ...rest.slice(0, i + 1)].join("/")}`;
    const name = rest[i].length <= 2 ? rest[i].toUpperCase() : rest[i].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    items.push({ name, url: `${ROOT_ORIGIN}${p}` });
  }
  items.push({ name: title, url: `${ROOT_ORIGIN}${path}` });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

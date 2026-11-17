import React from "react";
import { SearchBlock } from "@/components/blocks/search/search-block";
import { HeaderBookingBlock } from "@/components/blocks/header-booking/header-booking-block";
import { headers } from "next/headers";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Block } from "@/types/cms";
import { cn } from "@/lib/utils";
import { toFamilyBlock } from "@/lib/blocks/cards";
import { resolveCollectionBlock } from "@/lib/collections/render";
import { BlockErrorBoundary } from "./block-error-boundary";
import { siteCodeBlocked } from "@/lib/security/untrusted-viewer";
import { sanitizeTrialContent } from "@/lib/security/trial-html";

/** Is the site this request is for on the free trial, or is the viewer a
 *  signed-in outsider or staff on a platform subdomain (lib/security/
 *  viewer-trust.ts)? Either way its HTML is sanitised. (Asked once per request.) */
async function isTrialRequest(): Promise<boolean> {
  return siteCodeBlocked((await headers()).get("x-tenant-id"));
}
import { HeroBlock } from "@/components/blocks/hero/hero-block";
import { SliderBlock } from "@/components/blocks/slider/slider-block";
import { NavigationBlock } from "@/components/blocks/navigation/navigation-block";
import { HeaderLogoBlock } from "@/components/blocks/header-logo/header-logo-block";
import { HeaderNavBlock } from "@/components/blocks/header-nav/header-nav-block";
import { HeaderCtaBlock } from "@/components/blocks/header-cta/header-cta-block";
import { HeaderCartBlock } from "@/components/blocks/header-cart/header-cart-block";
import { HeaderAccountBlock } from "@/components/blocks/header-account/header-account-block";
import { TextBlock } from "@/components/blocks/text/text-block";
import { ServicesBlock } from "@/components/blocks/services/services-block-server";
import { ItemBoxBlock } from "@/components/blocks/item-box/item-box-block-server";
import { BlogBlock } from "@/components/blocks/blog/blog-block";
import { GalleryBlock } from "@/components/blocks/gallery/gallery-block";
import { resolvePortfolioGallery } from "@/lib/portfolio/gallery-server";
import { CTABlock } from "@/components/blocks/cta/cta-block";
import { TestimonialsBlock } from "@/components/blocks/testimonials/testimonials-block-server";
import { DividerBlock } from "@/components/blocks/divider/divider-block";
import { SocialLinksBlock } from "@/components/blocks/social-links/social-links-block";
import { SpacerBlock } from "@/components/blocks/spacer/spacer-block";
import { CustomHtmlBlock } from "@/components/blocks/custom-html/custom-html-block";
import { EcommerceProductsBlock } from "@/components/blocks/ecommerce/ecommerce-products-block";
import { AccountingFeedBlock } from "@/components/blocks/accounting/accounting-feed-block";
import { TeamBlock } from "@/components/blocks/team/team-block";
import { FAQBlock } from "@/components/blocks/faq/faq-block";
import { PricingBlock } from "@/components/blocks/pricing/pricing-block";
import { FeaturesBlock } from "@/components/blocks/features/features-block";
import { StatsBlock } from "@/components/blocks/stats/stats-block";
import { ContactBlock } from "@/components/blocks/contact/contact-block";
import { EmbedBlock } from "@/components/blocks/embed/embed-block";
import { VideoBlock } from "@/components/blocks/video/video-block";
import { TimelineBlock } from "@/components/blocks/timeline/timeline-block";
import { ColumnsBlock } from "@/components/blocks/columns/columns-block";
import { NewsletterBlock } from "@/components/blocks/newsletter/newsletter-block";
import { CountdownBlock } from "@/components/blocks/countdown/countdown-block";
import { PricingCatalogBlock } from "@/modules/registry/blocks/pricing-catalog";
import { StepsBlock } from "@/components/blocks/steps/steps-block";
import { IconGridBlock } from "@/components/blocks/icon-grid/icon-grid-block";
import { FooterBlock } from "@/components/blocks/footer/footer-block";
import { CountryGridBlock } from "@/components/blocks/country-grid/country-grid-block";
import { EligibilityCheckerBlock } from "@/components/blocks/eligibility-checker/eligibility-checker-block";
import { StatusTrackerBlock } from "@/components/blocks/status-tracker/status-tracker-block";
import { BookingBlock } from "@/components/blocks/booking/booking-block";
import { MarketplaceBookingBlock, MarketplaceRequestBlock, MarketplaceVendorDirectoryBlock } from "@/modules/registry/blocks/marketplace";
import { ScrollStoryBlock } from "@/components/blocks/scroll-story/scroll-story-block";
import { MarqueeBlock } from "@/components/blocks/marquee/marquee-block";
import { BottomBarBlock } from "@/components/blocks/bottom-bar/bottom-bar-block";
import { OptionPreviewBlock } from "@/components/blocks/option-preview/option-preview-block";
import { ReSearchBlock, ReListingsBlock, ReCommunitiesBlock, ReDevelopersBlock, ReCalculatorBlock, ReLeadFormBlock } from "@/modules/registry/blocks/real-estate";
import { TableBlock } from "@/components/blocks/table/table-block";
import { CodeBlock } from "@/components/blocks/code/code-block";
import { MediaTabsBlock } from "@/components/blocks/media-tabs/media-tabs-block";
import { SectionNavBlock } from "@/components/blocks/section-nav/section-nav-block";
import { ResultsAlumniBlock, ResultsSearchBlock, ResultsCoursesBlock } from "@/modules/registry/blocks/results";
import { DonorGroupCardsBlock, DonorListBlock, DonorMapBlock, DonorRequestsBlock } from "@/modules/registry/blocks/donors";
import { ContainerBlock } from "@/components/blocks/container/container-block";
import { googleFontsHref } from "@/modules/themes/fonts";
import { applyHiddenElements, getBlockBackground, getBlockWrapperStyle, getContainerClass, withHeroOverlay } from "@/modules/page-builder/block-utils";
import { expandDynamicChildren } from "@/modules/navigation/dynamic-children";
import { collectNavBlocks, hasNestedNavToResolve, mapNavBlocks, pickNavItems } from "@/modules/navigation/nav-blocks";

interface PageBlockProps {
  block: Block;
  identityLogo?: string | null;
  identityLogoDark?: string | null;
  /** Rendered inside a container column. The column already sets the width,
   *  so the usual centered max-width wrapper would constrain it twice. */
  nested?: boolean;
  /** How many containers deep this block already sits. Passed down, never
   *  read from the block itself, so it can't be spoofed by document content —
   *  only genuine recursive calls increment it. */
  depth?: number;
}

// Containers may nest inside containers (2026-09-06: block editor pass toward
// Elementor-style containers — arbitrary flex items, arbitrary nesting). A
// page document is user-authored JSON, not a closed type — a corrupted
// import or a future bug could still produce many levels of nesting, and
// server-side recursion has no viewport/frame budget to fall back on the way
// a runaway client render would. Capping depth is what stands between
// "flexible nesting" and a stack-exhausting render on a malformed document.
// 4 levels is generously past any layout a real editor session builds by
// hand (section > row > column > card is already 3) with room to spare.
const MAX_CONTAINER_DEPTH = 4;

async function ServerBlockInner({ block, identityLogo, identityLogoDark, nested, depth = 0 }: PageBlockProps) {
  // Hidden elements (Style panel) blanked on a render-only copy.
  block = applyHiddenElements(block);
  // Blocks bound to a collection show its live entries.
  block = await resolveCollectionBlock(block);
  // Trial site: nothing its owner typed may run as script. A pass over the
  // whole block, after collection entries are in (nested blocks come through
  // here again with their own entries; cleaning twice changes nothing).
  // Paid sites skip this entirely and render exactly what was saved.
  if (await isTrialRequest()) block = sanitizeTrialContent(block);
  // Cards draws each layout with the original block's component.
  if (block.type === "cards") block = toFamilyBlock(block);
  const { style: bgStyle, className: bgClassName } = getBlockBackground(withHeroOverlay(block));
  const { style: wrapStyle, className: wrapClassName } = getBlockWrapperStyle(block);

  let content: React.ReactNode;
  switch (block.type) {
    case "hero":             content = <HeroBlock block={block} />; break;
    case "slider":           content = <SliderBlock block={block} />; break;
    case "navigation":       content = <NavigationBlock block={block} identityLogo={identityLogo} identityLogoDark={identityLogoDark} />; break;
    case "header_logo":      content = <HeaderLogoBlock block={block} identityLogo={identityLogo} identityLogoDark={identityLogoDark} />; break;
    case "header_nav":       content = <HeaderNavBlock block={block} />; break;
    case "header_cta":       content = <HeaderCtaBlock block={block} />; break;
    case "header_booking":   content = <HeaderBookingBlock block={block} />; break;
    case "header_cart":      content = <HeaderCartBlock block={block} />; break;
    case "search":           content = <SearchBlock block={block} />; break;
    case "header_account": {
      // Only checked when this block type is actually on the page — avoids
      // an auth round-trip on every render of every other block type.
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      content = <HeaderAccountBlock block={block} isSignedIn={!!user} />;
      break;
    }
    case "text":             content = <TextBlock block={block} />; break;
    case "services":         content = await ServicesBlock({ block: block as import("@/types/cms").ServicesBlockProps }); break;
    case "item_box":         content = await ItemBoxBlock({ block: block as import("@/types/cms").ItemBoxBlockProps }); break;
    case "blog":             content = await BlogBlock({ block }); break;
    case "gallery":          content = <GalleryBlock block={await resolvePortfolioGallery(block)} />; break;
    case "cta":              content = <CTABlock block={block} />; break;
    case "testimonials":     content = await TestimonialsBlock({ block: block as import("@/types/cms").TestimonialsBlockProps }); break;
    case "divider":          content = <DividerBlock block={block} />; break;
    case "social_links":     content = <SocialLinksBlock block={block} />; break;
    case "spacer":           content = <SpacerBlock block={block} />; break;
    case "custom_html":      content = <CustomHtmlBlock block={block} />; break;
    case "ecommerce_products": content = await EcommerceProductsBlock({ block }); break;
    case "accounting_feed":  content = await AccountingFeedBlock({ block }); break;
    case "team":             content = <TeamBlock block={block} />; break;
    case "faq":              content = <FAQBlock block={block} />; break;
    case "pricing":          content = <PricingBlock block={block} />; break;
    case "features":         content = <FeaturesBlock block={block} />; break;
    case "stats":            content = <StatsBlock block={block} />; break;
    case "contact":          content = <ContactBlock block={block} />; break;
    case "embed":            content = <EmbedBlock block={block} />; break;
    case "video":            content = <VideoBlock block={block} />; break;
    case "timeline":         content = <TimelineBlock block={block} />; break;
    case "columns":          content = <ColumnsBlock block={block} />; break;
    case "newsletter":       content = <NewsletterBlock block={block} />; break;
    case "countdown":        content = <CountdownBlock block={block} />; break;
    case "pricing_catalog":  content = <PricingCatalogBlock block={block} />; break;
    case "steps":            content = <StepsBlock block={block} />; break;
    case "icon_grid":        content = <IconGridBlock block={block} />; break;
    case "footer":           content = <FooterBlock block={block as import("@/types/cms").FooterBlockProps} identityLogo={identityLogo} identityLogoDark={identityLogoDark} />; break;
    case "country_grid":     content = <CountryGridBlock block={block} />; break;
    case "eligibility_checker": content = <EligibilityCheckerBlock block={block} />; break;
    case "status_tracker":   content = <StatusTrackerBlock block={block} />; break;
    case "booking":          content = <BookingBlock block={block} />; break;
    case "marketplace_booking": content = <MarketplaceBookingBlock block={block} />; break;
    case "marketplace_request": content = <MarketplaceRequestBlock block={block} />; break;
    case "marketplace_vendor_directory": content = <MarketplaceVendorDirectoryBlock block={block} />; break;
    case "marquee": content = <MarqueeBlock block={block} />; break;
    case "bottom_bar": {
      // Categories sheet needs the shop's categories; only fetched when used.
      let cats: { id: string; name: string; slug: string; image_url: string | null }[] = [];
      const tid = (await headers()).get("x-tenant-id");
      if (tid && block.data.items?.some((i) => i.action === "categories" && !i.hidden)) {
        const supabase = await createClient();
        const { data } = await supabase.from("categories").select("id, name, slug, image_url").eq("tenant_id", tid).eq("type", "product").order("order_index");
        cats = data ?? [];
      }
      content = <BottomBarBlock block={block} categories={cats} />;
      break;
    }
    case "option_preview": content = <OptionPreviewBlock block={block} />; break;
    case "scroll_story": content = <ScrollStoryBlock block={block} />; break;
    case "re_search": content = <ReSearchBlock block={block} />; break;
    case "re_listings": content = <ReListingsBlock block={block} />; break;
    case "re_communities": content = <ReCommunitiesBlock block={block} />; break;
    case "re_developers": content = <ReDevelopersBlock block={block} />; break;
    case "re_calculator": content = <ReCalculatorBlock block={block} />; break;
    case "re_lead_form": content = <ReLeadFormBlock block={block} />; break;
    case "table": content = <TableBlock block={block} />; break;
    case "code": content = <CodeBlock block={block} />; break;
    case "media_tabs": content = <MediaTabsBlock block={block} />; break;
    case "section_nav": content = <SectionNavBlock block={block} />; break;
    case "results_search": content = <ResultsSearchBlock block={block} />; break;
    case "results_alumni": content = <ResultsAlumniBlock block={block} />; break;
    case "results_courses": content = <ResultsCoursesBlock block={block} />; break;
    case "donor_group_cards": content = <DonorGroupCardsBlock block={block} />; break;
    case "donor_list":       content = <DonorListBlock block={block} />; break;
    case "donor_map":        content = <DonorMapBlock block={block} />; break;
    case "donor_requests":   content = <DonorRequestsBlock block={block} />; break;
    case "ecommerce_cart":   content = null; break; // cart is injected by layout
    // Containers hold their own blocks, so each column's children are
    // rendered here and handed to the layout shell. Awaited because several
    // block types fetch their own data. Containers may nest inside
    // containers now (see MAX_CONTAINER_DEPTH above) — past the cap, a
    // nested container is skipped rather than crashing the page, since the
    // rest of the content is still worth publishing.
    case "container": {
      if (depth >= MAX_CONTAINER_DEPTH) { content = null; break; }
      const container = block as import("@/types/cms").ContainerBlockProps;
      const columnContent = await Promise.all(
        (container.data.columns ?? []).map(async (col) =>
          Promise.all(
            (col.blocks ?? [])
              .filter((child) => child.visible !== false)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map(async (child) => (
                <ServerBlock
                  key={child.id}
                  block={child}
                  identityLogo={identityLogo}
                  identityLogoDark={identityLogoDark}
                  nested
                  depth={depth + 1}
                />
              )),
          ),
        ),
      );
      content = <ContainerBlock block={container} columnContent={columnContent} />;
      break;
    }
    default:                 content = null;
  }

  if (!content) return null;
  // Section Links can stay under the site header while the page scrolls.
  const stickyTop = block.type === "section_nav" && block.data.sticky && !nested ? Math.max(0, Number(block.data.topOffset ?? 64) || 0) : null;

  return (
    <>
    {block.style?.headingFont && googleFontsHref([block.style.headingFont]) && (
      // React hoists <link precedence> into <head> once per href.
      <link rel="stylesheet" href={googleFontsHref([block.style.headingFont])!} precedence="pc-block-font" />
    )}
    <div data-pc-block={block.type} data-pc-id={block.id} id={block.anchor || undefined} style={{ ...bgStyle, ...wrapStyle, ...(block.anchor ? { scrollMarginTop: 110 } : {}), ...(stickyTop != null ? { position: "sticky", top: stickyTop, zIndex: 30 } : {}) }} className={cn("w-full", bgClassName, wrapClassName, hideOnClasses(block.hideOn))}>
      <div className={nested ? "w-full" : cn("w-full", getContainerClass(block.width))}>{content}</div>
    </div>
    </>
  );
}

/**
 * One block crashing must never take the rest of the page down with it — a
 * client's whole site 500ing because one section has bad/legacy data is a
 * real production outage, not a cosmetic gap. Confirmed live: a `features`
 * block with `items: null` 500'd the entire page, including a good text
 * block both above and below it.
 *
 * See block-error-boundary.tsx for why this needs both a Suspense boundary
 * AND a client Error Boundary, and why a plain try/catch around this
 * function does not work (most blocks are non-async function components
 * rendered as JSX, whose body only actually runs when React later walks the
 * returned element — outside any try/catch's synchronous extent, even in
 * an `async` function). This wrapper is the only thing standing between
 * "one broken section" and "the whole site is down" — every render path
 * (top-level PageRenderer, and a container's own nested children) goes
 * through this same function, so wrapping here covers both without
 * touching either call site.
 */
async function ServerBlock(props: PageBlockProps) {
  return (
    <BlockErrorBoundary>
      <ServerBlockInner {...props} />
    </BlockErrorBoundary>
  );
}

// hideOn is CSS-driven (server has no viewport info, unlike `visible` which
// is filtered out entirely below). Breakpoints match the project's existing
// mobile/tablet/desktop convention: <640px mobile, 640-1023px tablet, >=1024px (lg) desktop.
// Built as an explicit 3-bucket truth table rather than composing toggles —
// simpler to reason about than "hidden sm:block sm:hidden lg:block" chains.
function hideOnClasses(hideOn?: ("desktop" | "tablet" | "mobile")[]): string {
  if (!hideOn?.length) return "";
  const mobile = hideOn.includes("mobile");
  const tablet = hideOn.includes("tablet");
  const desktop = hideOn.includes("desktop");
  if (mobile && tablet && desktop) return "hidden"; // matches visible:false, kept in sync by the callers
  if (mobile && tablet) return "hidden lg:block";
  if (mobile && desktop) return "hidden sm:block lg:hidden";
  if (tablet && desktop) return "sm:hidden";
  if (mobile) return "hidden sm:block";
  if (tablet) return "sm:hidden lg:block";
  if (desktop) return "lg:hidden";
  return "";
}

export async function PageRenderer({ blocks }: { blocks: Block[] }) {
  const visible = blocks
    .filter((b) => b.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Fetch identity logo once for nav block fallback (only if page has a nav block)
  let identityLogo: string | null = null;
  let identityLogoDark: string | null = null;
  let resolved = visible;

  // header_logo (the new independent sub-block, alongside navigation/
  // header_nav) also needs identityLogo/identityLogoDark for its own
  // fallback-to-real-logo behavior — checking only "navigation" here missed
  // it after the migration to container-based headers (2026-09-06), so a
  // migrated header's logo silently fell back to the BrandLogo placeholder
  // everywhere instead of the tenant's real uploaded logo.
  const hasNav = visible.some((b) =>
    b.type === "navigation" || b.type === "header_nav" ||
    (b.type === "footer" && !!(b as import("@/types/cms").FooterBlockProps).data.autoLightLogo) ||
    (b.type === "container" && (b as import("@/types/cms").ContainerBlockProps).data.columns?.some(
      (c) => c.blocks?.some((cb) => cb.type === "header_logo"),
    )),
  );
  if (hasNav) {
    const reqHeaders = await headers();
    const tenantId = reqHeaders.get("x-tenant-id");
    if (tenantId) {
      const admin = await createAdminClient();
      const { data } = await admin
        .from("site_identity")
        .select("logo_url, logo_dark_url")
        .eq("tenant_id", tenantId)
        .single();
      identityLogo = data?.logo_url ?? null;
      identityLogoDark = data?.logo_dark_url ?? null;

      resolved = await resolveNavBlocks(admin, tenantId, visible);
    }
  } else if (hasNestedNavToResolve(visible)) {
    // A container header or page section whose menu block names a saved
    // menu or holds an auto list (P0, 2026-11-17: these were ignored). The
    // identity logo is deliberately not fetched here, so logo fallbacks on
    // pages without a top-level header block stay exactly as they were.
    const tenantId = (await headers()).get("x-tenant-id");
    if (tenantId) resolved = await resolveNavBlocks(await createAdminClient(), tenantId, visible);
  }

  return (
    <>
      {await Promise.all(resolved.map((block) => (
        <ServerBlock key={block.id} block={block} identityLogo={identityLogo} identityLogoDark={identityLogoDark} />
      )))}
    </>
  );
}

/**
 * Fills menu blocks from the tenant's saved menus.
 *
 * A menu block that names a `menuLocation` renders whatever menu is assigned
 * there, so the header and footer read the same source instead of each holding
 * their own copy that quietly drifts. Blocks without one keep their inline
 * items, and a missing menu falls back to those items too — a nav bar with
 * slightly stale links beats one with no links at all.
 *
 * Menu blocks inside containers (every container header, page sections) are
 * filled too (modules/navigation/nav-blocks.ts); a nested block that names no
 * menu and has no auto list is left untouched, object and all.
 *
 * Dynamic sub-menus (all services, product categories) are expanded here as
 * well, which is why this runs server-side per request rather than at save time.
 */
async function resolveNavBlocks(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  tenantId: string,
  blocks: Block[],
): Promise<Block[]> {
  const navBlocks = collectNavBlocks(blocks);
  if (navBlocks.length === 0) return blocks;

  // Saved menus are only read when some block asks for one.
  const byLocation = new Map<string, import("@/types/cms").NavItem[]>();
  if (navBlocks.some(({ block }) => !!(block.data as { menuLocation?: string }).menuLocation)) {
    const { data: menus } = await admin
      .from("nav_menus")
      .select("location, items")
      .eq("tenant_id", tenantId);
    for (const m of menus ?? []) {
      byLocation.set(m.location as string, (m.items ?? []) as import("@/types/cms").NavItem[]);
    }
  }

  return mapNavBlocks(blocks, async (block) => {
    const nav = block as import("@/types/cms").NavigationBlockProps | import("@/types/cms").HeaderNavBlockProps;
    const items = await expandDynamicChildren(admin, tenantId, pickNavItems(nav.data, byLocation) ?? []);
    return { ...nav, data: { ...nav.data, items } } as Block;
  });
}

import React from "react";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import type { Block } from "@/types/cms";
import { cn } from "@/lib/utils";
import { HeroBlock } from "@/components/blocks/hero/hero-block";
import { SliderBlock } from "@/components/blocks/slider/slider-block";
import { NavigationBlock } from "@/components/blocks/navigation/navigation-block";
import { TextBlock } from "@/components/blocks/text/text-block";
import { ServicesBlock } from "@/components/blocks/services/services-block-server";
import { ItemBoxBlock } from "@/components/blocks/item-box/item-box-block-server";
import { BlogBlock } from "@/components/blocks/blog/blog-block";
import { GalleryBlock } from "@/components/blocks/gallery/gallery-block";
import { CTABlock } from "@/components/blocks/cta/cta-block";
import { TestimonialsBlock } from "@/components/blocks/testimonials/testimonials-block";
import { DividerBlock } from "@/components/blocks/divider/divider-block";
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
import { StepsBlock } from "@/components/blocks/steps/steps-block";
import { IconGridBlock } from "@/components/blocks/icon-grid/icon-grid-block";
import { EnmLeadFormBlock } from "@/components/blocks/enm/enm-lead-form-block";
import { EnmBookingWidgetBlock } from "@/components/blocks/enm/enm-booking-widget-block";
import { FooterBlock } from "@/components/blocks/footer/footer-block";
import { CountryGridBlock } from "@/components/blocks/country-grid/country-grid-block";
import { EligibilityCheckerBlock } from "@/components/blocks/eligibility-checker/eligibility-checker-block";
import { StatusTrackerBlock } from "@/components/blocks/status-tracker/status-tracker-block";
import { BookingBlock } from "@/components/blocks/booking/booking-block";
import { MarketplaceBookingBlock } from "@/components/blocks/marketplace/marketplace-booking-block";
import { MarketplaceRequestBlock } from "@/components/blocks/marketplace/marketplace-request-block";
import { DonorGroupCardsBlock } from "@/components/blocks/donors/donor-group-cards-block";
import { DonorListBlock } from "@/components/blocks/donors/donor-list-block";
import { DonorMapBlock } from "@/components/blocks/donors/donor-map-block";
import { DonorRequestsBlock } from "@/components/blocks/donors/donor-requests-block";
import { getBlockBackground, getContainerClass, withHeroOverlay } from "@/modules/page-builder/block-utils";

interface PageBlockProps {
  block: Block;
  identityLogo?: string | null;
  identityLogoDark?: string | null;
}

async function ServerBlock({ block, identityLogo, identityLogoDark }: PageBlockProps) {
  const bgStyle = getBlockBackground(withHeroOverlay(block));
  const paddingStyle = {
    paddingTop: block.padding?.top,
    paddingRight: block.padding?.right,
    paddingBottom: block.padding?.bottom,
    paddingLeft: block.padding?.left,
    marginTop: block.margin?.top,
    marginBottom: block.margin?.bottom,
  };

  let content: React.ReactNode;
  switch (block.type) {
    case "hero":             content = <HeroBlock block={block} />; break;
    case "slider":           content = <SliderBlock block={block} />; break;
    case "navigation":       content = <NavigationBlock block={block} identityLogo={identityLogo} identityLogoDark={identityLogoDark} />; break;
    case "text":             content = <TextBlock block={block} />; break;
    case "services":         content = await ServicesBlock({ block: block as import("@/types/cms").ServicesBlockProps }); break;
    case "item_box":         content = await ItemBoxBlock({ block: block as import("@/types/cms").ItemBoxBlockProps }); break;
    case "blog":             content = await BlogBlock({ block }); break;
    case "gallery":          content = <GalleryBlock block={block} />; break;
    case "cta":              content = <CTABlock block={block} />; break;
    case "testimonials":     content = <TestimonialsBlock block={block} />; break;
    case "divider":          content = <DividerBlock block={block} />; break;
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
    case "steps":            content = <StepsBlock block={block} />; break;
    case "icon_grid":        content = <IconGridBlock block={block} />; break;
    case "enm_lead_form":    content = <EnmLeadFormBlock block={block} />; break;
    case "enm_booking_widget": content = <EnmBookingWidgetBlock block={block} />; break;
    case "footer":           content = <FooterBlock block={block as import("@/types/cms").FooterBlockProps} />; break;
    case "country_grid":     content = <CountryGridBlock block={block} />; break;
    case "eligibility_checker": content = <EligibilityCheckerBlock block={block} />; break;
    case "status_tracker":   content = <StatusTrackerBlock block={block} />; break;
    case "booking":          content = <BookingBlock block={block} />; break;
    case "marketplace_booking": content = <MarketplaceBookingBlock block={block} />; break;
    case "marketplace_request": content = <MarketplaceRequestBlock block={block} />; break;
    case "donor_group_cards": content = <DonorGroupCardsBlock block={block} />; break;
    case "donor_list":       content = <DonorListBlock block={block} />; break;
    case "donor_map":        content = <DonorMapBlock block={block} />; break;
    case "donor_requests":   content = <DonorRequestsBlock block={block} />; break;
    case "ecommerce_cart":   content = null; break; // cart is injected by layout
    default:                 content = null;
  }

  if (!content) return null;

  return (
    <div style={{ ...bgStyle, ...paddingStyle }} className={cn("w-full", hideOnClasses(block.hideOn))}>
      <div className={getContainerClass(block.width)}>{content}</div>
    </div>
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
  const hasNav = visible.some((b) => b.type === "navigation");
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
    }
  }

  return (
    <>
      {await Promise.all(visible.map((block) => (
        <ServerBlock key={block.id} block={block} identityLogo={identityLogo} identityLogoDark={identityLogoDark} />
      )))}
    </>
  );
}

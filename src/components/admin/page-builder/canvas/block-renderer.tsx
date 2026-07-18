"use client";

import React from "react";
import type { Block } from "@/types/cms";
import { HeroBlock } from "@/components/blocks/hero/hero-block";
import { SliderBlock } from "@/components/blocks/slider/slider-block";
import { NavigationBlock } from "@/components/blocks/navigation/navigation-block";
import { TextBlock } from "@/components/blocks/text/text-block";
import { ServicesBlock } from "@/components/blocks/services/services-block";
import { GalleryBlock } from "@/components/blocks/gallery/gallery-block";
import { CTABlock } from "@/components/blocks/cta/cta-block";
import { TestimonialsBlock } from "@/components/blocks/testimonials/testimonials-block";
import { DividerBlock } from "@/components/blocks/divider/divider-block";
import { SpacerBlock } from "@/components/blocks/spacer/spacer-block";
import { CustomHtmlBlock } from "@/components/blocks/custom-html/custom-html-block";
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
import { DonorGroupCardsBlock } from "@/components/blocks/donors/donor-group-cards-block";
import { DonorListBlock } from "@/components/blocks/donors/donor-list-block";
import { DonorMapBlock } from "@/components/blocks/donors/donor-map-block";
import { DonorRequestsBlock } from "@/components/blocks/donors/donor-requests-block";
import { ContainerBlock } from "./container-block";
import { getBlockBackground } from "@/modules/page-builder/block-utils";
import type { FooterBlockProps, ContainerBlockProps } from "@/types/cms";
import { BookOpen, ShoppingBag, Heart } from "lucide-react";

interface BlockRendererProps {
  block: Block;
  isPreview?: boolean;
}

// Placeholder for server-data blocks in the client builder
function DataBlockPlaceholder({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-16 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50">
      <Icon className="h-10 w-10 text-blue-400 mb-3" />
      <p className="text-sm font-medium text-blue-600">{label}</p>
      <p className="text-xs text-blue-400 mt-1">Renders live data on the public site</p>
    </div>
  );
}

export function BlockRenderer({ block, isPreview = false }: BlockRendererProps) {
  const bgStyle = getBlockBackground(block.background);
  const paddingStyle = {
    paddingTop: block.padding.top,
    paddingRight: block.padding.right,
    paddingBottom: block.padding.bottom,
    paddingLeft: block.padding.left,
    marginTop: block.margin.top,
    marginBottom: block.margin.bottom,
  };

  const renderBlock = () => {
    switch (block.type) {
      case "hero": return <HeroBlock block={block} />;
      case "slider": return <SliderBlock block={block} />;
      case "navigation": return <NavigationBlock block={block} />;
      case "text": return <TextBlock block={block} />;
      case "services": return <ServicesBlock block={block} />;
      case "gallery": return <GalleryBlock block={block} />;
      case "cta": return <CTABlock block={block} />;
      case "testimonials": return <TestimonialsBlock block={block} />;
      case "divider": return <DividerBlock block={block} />;
      case "spacer": return <SpacerBlock block={block} />;
      case "custom_html": return <CustomHtmlBlock block={block} />;
      case "team": return <TeamBlock block={block} />;
      case "faq": return <FAQBlock block={block} />;
      case "pricing": return <PricingBlock block={block} />;
      case "features": return <FeaturesBlock block={block} />;
      case "stats": return <StatsBlock block={block} />;
      case "contact": return <ContactBlock block={block} />;
      case "embed": return <EmbedBlock block={block} />;
      case "video": return <VideoBlock block={block} />;
      case "timeline": return <TimelineBlock block={block} />;
      case "columns": return <ColumnsBlock block={block} />;
      case "newsletter": return <NewsletterBlock block={block} />;
      case "countdown": return <CountdownBlock block={block} />;
      case "steps": return <StepsBlock block={block} />;
      case "icon_grid": return <IconGridBlock block={block} />;
      case "enm_lead_form": return <EnmLeadFormBlock block={block} />;
      case "enm_booking_widget": return <EnmBookingWidgetBlock block={block} />;
      case "footer": return <FooterBlock block={block as FooterBlockProps} />;
      case "country_grid": return <CountryGridBlock block={block} />;
      case "eligibility_checker": return <EligibilityCheckerBlock block={block} />;
      case "status_tracker": return <StatusTrackerBlock block={block} />;
      case "booking": return <BookingBlock block={block} />;
      case "donor_group_cards": return <DonorGroupCardsBlock block={block} />;
      case "donor_list": return <DonorListBlock block={block} />;
      case "donor_map": return <DonorMapBlock block={block} />;
      case "donor_requests": return <DonorRequestsBlock block={block} />;
      case "container": return <ContainerBlock block={block as ContainerBlockProps} isPreview={isPreview} />;
      // Server data blocks show placeholders in builder
      case "ecommerce_cart":
        return <DataBlockPlaceholder icon={ShoppingBag} label="Shopping Cart — live cart on the public site" />;
      case "blog":
        return <DataBlockPlaceholder icon={BookOpen} label="Blog Posts Block — live data in preview" />;
      case "ecommerce_products":
        return <DataBlockPlaceholder icon={ShoppingBag} label="Products Block — live data in preview" />;
      case "accounting_feed":
        return <DataBlockPlaceholder icon={Heart} label="Donation / Transaction Feed — live data in preview" />;
      default:
        return (
          <div className="flex items-center justify-center h-20 bg-muted text-muted-foreground text-sm border-2 border-dashed rounded">
            Unknown block: {(block as Block).type}
          </div>
        );
    }
  };

  return (
    <div style={{ ...bgStyle, ...paddingStyle }} className="w-full">
      {renderBlock()}
    </div>
  );
}

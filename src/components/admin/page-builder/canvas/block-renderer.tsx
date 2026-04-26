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
import { getBlockBackground } from "@/modules/page-builder/block-utils";
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
      // Server data blocks show placeholders in builder
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

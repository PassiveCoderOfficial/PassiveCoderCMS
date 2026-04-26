import React from "react";
import type { Block } from "@/types/cms";
import { HeroBlock } from "@/components/blocks/hero/hero-block";
import { SliderBlock } from "@/components/blocks/slider/slider-block";
import { NavigationBlock } from "@/components/blocks/navigation/navigation-block";
import { TextBlock } from "@/components/blocks/text/text-block";
import { ServicesBlock } from "@/components/blocks/services/services-block";
import { BlogBlock } from "@/components/blocks/blog/blog-block";
import { GalleryBlock } from "@/components/blocks/gallery/gallery-block";
import { CTABlock } from "@/components/blocks/cta/cta-block";
import { TestimonialsBlock } from "@/components/blocks/testimonials/testimonials-block";
import { DividerBlock } from "@/components/blocks/divider/divider-block";
import { SpacerBlock } from "@/components/blocks/spacer/spacer-block";
import { CustomHtmlBlock } from "@/components/blocks/custom-html/custom-html-block";
import { EcommerceProductsBlock } from "@/components/blocks/ecommerce/ecommerce-products-block";
import { AccountingFeedBlock } from "@/components/blocks/accounting/accounting-feed-block";
import { getBlockBackground } from "@/modules/page-builder/block-utils";

interface PageBlockProps {
  block: Block;
}

async function ServerBlock({ block }: PageBlockProps) {
  const bgStyle = getBlockBackground(block.background);
  const paddingStyle = {
    paddingTop: block.padding.top,
    paddingRight: block.padding.right,
    paddingBottom: block.padding.bottom,
    paddingLeft: block.padding.left,
    marginTop: block.margin.top,
    marginBottom: block.margin.bottom,
  };

  let content: React.ReactNode;
  switch (block.type) {
    case "hero": content = <HeroBlock block={block} />; break;
    case "slider": content = <SliderBlock block={block} />; break;
    case "navigation": content = <NavigationBlock block={block} />; break;
    case "text": content = <TextBlock block={block} />; break;
    case "services": content = <ServicesBlock block={block} />; break;
    case "blog": content = await BlogBlock({ block }); break;
    case "gallery": content = <GalleryBlock block={block} />; break;
    case "cta": content = <CTABlock block={block} />; break;
    case "testimonials": content = <TestimonialsBlock block={block} />; break;
    case "divider": content = <DividerBlock block={block} />; break;
    case "spacer": content = <SpacerBlock block={block} />; break;
    case "custom_html": content = <CustomHtmlBlock block={block} />; break;
    case "ecommerce_products": content = await EcommerceProductsBlock({ block }); break;
    case "accounting_feed": content = await AccountingFeedBlock({ block }); break;
    default: content = null;
  }

  if (!content) return null;

  return <div style={{ ...bgStyle, ...paddingStyle }} className="w-full">{content}</div>;
}

export async function PageRenderer({ blocks }: { blocks: Block[] }) {
  const visible = blocks
    .filter((b) => b.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <>
      {await Promise.all(visible.map((block) => <ServerBlock key={block.id} block={block} />))}
    </>
  );
}

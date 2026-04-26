"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeroSettings } from "./hero-settings";
import { SliderSettings } from "./slider-settings";
import { TextSettings } from "./text-settings";
import { ServicesSettings } from "./services-settings";
import { BlogSettings } from "./blog-settings";
import { GallerySettings } from "./gallery-settings";
import { CTASettings } from "./cta-settings";
import { NavigationSettings } from "./navigation-settings";
import { SpacerSettings } from "./spacer-settings";
import { EcommerceProductsSettings } from "./ecommerce-products-settings";
import { AccountingFeedSettings } from "./accounting-feed-settings";
import { BlockLayoutSettings } from "./block-layout-settings";
import { Layers } from "lucide-react";
import type { Block } from "@/types/cms";

export function SettingsPanel() {
  const { selectedBlockId, blocks } = useBuilderStore();
  const block = blocks.find((b) => b.id === selectedBlockId);

  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Layers className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Select a block to edit its settings</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {block.type.replace(/_/g, " ")} settings
        </p>
      </div>
      <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2 mb-0">
          <TabsTrigger value="content" className="text-xs flex-1">Content</TabsTrigger>
          <TabsTrigger value="layout" className="text-xs flex-1">Layout</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="content" className="p-3 mt-0">
            <BlockContentSettings block={block} />
          </TabsContent>
          <TabsContent value="layout" className="p-3 mt-0">
            <BlockLayoutSettings block={block} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function BlockContentSettings({ block }: { block: Block }) {
  switch (block.type) {
    case "hero": return <HeroSettings block={block} />;
    case "slider": return <SliderSettings block={block} />;
    case "text": return <TextSettings block={block} />;
    case "services": return <ServicesSettings block={block} />;
    case "blog": return <BlogSettings block={block} />;
    case "gallery": return <GallerySettings block={block} />;
    case "cta": return <CTASettings block={block} />;
    case "navigation": return <NavigationSettings block={block} />;
    case "spacer": return <SpacerSettings block={block} />;
    case "ecommerce_products": return <EcommerceProductsSettings block={block} />;
    case "accounting_feed": return <AccountingFeedSettings block={block} />;
    default:
      return <p className="text-xs text-muted-foreground">No settings for this block type.</p>;
  }
}

"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import type { MarketplaceBookingBlockProps, MarketplaceRequestBlockProps, MarketplaceVendorDirectoryBlockProps } from "@/types/cms";

type MarketplaceBlockUnion = MarketplaceBookingBlockProps | MarketplaceRequestBlockProps | MarketplaceVendorDirectoryBlockProps;

/** Shared settings UI for marketplace-facing blocks (booking, open request,
 *  provider directory) — same title/subtitle/accent fields on all three;
 *  Button Label only applies to the two form blocks (directory has no
 *  submit action), rendered conditionally since it's not on that data shape. */
export function MarketplaceBookingSettings({ block }: { block: MarketplaceBlockUnion }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const hasSubmitLabel = "submitLabel" in block.data;

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      {hasSubmitLabel && (
        <div><Label className="text-xs">Button Label</Label><Input value={(block.data as MarketplaceBookingBlockProps["data"]).submitLabel} onChange={e => update("submitLabel", e.target.value)} className="h-8 text-xs mt-1" /></div>
      )}
      <div>
        <Label className="text-xs">Accent Color</Label>
        <ColorPicker value={block.data.accentColor ?? "#4f46e5"} onChange={v => update("accentColor", v)} className="mt-1" />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Services, vendors and prices are managed in Dashboard → Marketplace.
      </p>
    </div>
  );
}

"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import type { MarketplaceBookingBlockProps, MarketplaceRequestBlockProps } from "@/types/cms";

/** Shared settings UI for both marketplace-facing forms (booking + open
 *  request) — same title/subtitle/button/accent fields on both block types. */
export function MarketplaceBookingSettings({ block }: { block: MarketplaceBookingBlockProps | MarketplaceRequestBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Button Label</Label><Input value={block.data.submitLabel} onChange={e => update("submitLabel", e.target.value)} className="h-8 text-xs mt-1" /></div>
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

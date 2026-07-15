"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { DonorGroupCardsBlockProps, DonorListBlockProps, DonorMapBlockProps } from "@/types/cms";

export function DonorGroupCardsSettings({ block }: { block: DonorGroupCardsBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Accent Color</Label><Input type="color" value={block.data.accentColor ?? "#dc2626"} onChange={e => update("accentColor", e.target.value)} className="h-8 mt-1 p-1" /></div>
      <div><Label className="text-xs">Scroll Target</Label><Input value={block.data.linkTarget ?? "#donor-list"} onChange={e => update("linkTarget", e.target.value)} className="h-8 text-xs mt-1" placeholder="#donor-list" /></div>
      <p className="text-[11px] text-muted-foreground">Cards show live donor counts and filter the Donor List block on the same page.</p>
    </div>
  );
}

export function DonorMapSettings({ block }: { block: DonorMapBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Height (px)</Label><Input type="number" min={240} max={800} value={block.data.height} onChange={e => update("height", parseInt(e.target.value, 10) || 420)} className="h-8 text-xs mt-1" /></div>
    </div>
  );
}

export function DonorListSettings({ block }: { block: DonorListBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Accent Color</Label><Input type="color" value={block.data.accentColor ?? "#dc2626"} onChange={e => update("accentColor", e.target.value)} className="h-8 mt-1 p-1" /></div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Filter bar</Label>
        <Switch checked={block.data.showFilters} onCheckedChange={v => update("showFilters", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Add-donor button</Label>
        <Switch checked={block.data.showAddButton} onCheckedChange={v => update("showAddButton", v)} />
      </div>
      {block.data.showAddButton && (
        <div><Label className="text-xs">Button Label</Label><Input value={block.data.addButtonLabel} onChange={e => update("addButtonLabel", e.target.value)} className="h-8 text-xs mt-1" /></div>
      )}
    </div>
  );
}

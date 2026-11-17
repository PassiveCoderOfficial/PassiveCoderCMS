"use client";

import React from "react";
import Link from "next/link";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import type { MarketplaceBookingBlockProps, MarketplaceRequestBlockProps, MarketplaceVendorDirectoryBlockProps } from "@/types/cms";
import { UiTextFields } from "./ui-text-fields";

type MarketplaceBlockUnion = MarketplaceBookingBlockProps | MarketplaceRequestBlockProps | MarketplaceVendorDirectoryBlockProps;

/** Shared settings UI for marketplace-facing blocks (booking, open request,
 *  provider directory) — same title/subtitle/accent fields on all three;
 *  Button Label only applies to the two form blocks (directory has no
 *  submit action). Every built-in word of the forms is under "Words". */
export function MarketplaceBookingSettings({ block }: { block: MarketplaceBlockUnion }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const directory = block.type === "marketplace_vendor_directory";
  const dir = block.data as MarketplaceVendorDirectoryBlockProps["data"];

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      {!directory && (
        <div><Label className="text-xs">Button Label</Label><Input value={(block.data as MarketplaceBookingBlockProps["data"]).submitLabel ?? ""} placeholder={block.type === "marketplace_request" ? "Post Request" : "Book Now!"} onChange={e => update("submitLabel", e.target.value)} className="h-8 text-xs mt-1" /></div>
      )}
      {directory && (
        <>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs">Show provider cards</Label>
            <Switch checked={dir.showCards !== false} onCheckedChange={(v) => update("showCards", v)} />
          </div>
          <p className="text-[10px] text-muted-foreground -mt-2">Off = only the map of where providers work.</p>
          <div><Label className="text-xs">Map height (px)</Label><Input type="number" min={200} max={800} value={dir.mapHeight ?? ""} placeholder="360" onChange={(e) => update("mapHeight", e.target.value ? Number(e.target.value) : undefined)} className="h-8 text-xs mt-1" /></div>
        </>
      )}
      <div>
        <Label className="text-xs">Accent Color</Label>
        <ColorPicker value={block.data.accentColor ?? (directory ? "" : "#4f46e5")} onChange={v => update("accentColor", v || undefined)} className="mt-1" />
      </div>
      <UiTextFields block={block} title={directory ? "Words on this section" : "Form words"} />
      <p className="text-[11px] text-muted-foreground">
        Services, providers and prices are managed in{" "}
        <Link href="/dashboard/marketplace/catalog" className="underline">Dashboard &gt; Marketplace</Link>
        {directory ? <> (<Link href="/dashboard/marketplace/vendors" className="underline">Providers</Link>)</> : null}.
      </p>
    </div>
  );
}

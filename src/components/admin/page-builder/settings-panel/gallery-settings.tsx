"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import type { GalleryBlockProps } from "@/types/cms";
import { fetchPortfolioGroups } from "@/components/blocks/gallery/gallery-block-canvas";
import { renderedVariant } from "./rendered-variant";

/** Images typed in here, or live from a Portfolio group the client manages in the dashboard. */
function GallerySourcePicker({ block, update }: { block: GalleryBlockProps; update: (field: string, value: unknown) => void }) {
  const fromPortfolio = block.data.source === "portfolio";
  const [groups, setGroups] = useState<{ id: string; name: string; portfolio_items?: unknown[] }[]>([]);
  useEffect(() => {
    if (!fromPortfolio) return;
    let live = true;
    fetchPortfolioGroups(true).then((g) => live && setGroups(g));
    return () => { live = false; };
  }, [fromPortfolio]);

  return (
    <div className="space-y-2 rounded-lg border p-2.5 bg-muted/20">
      <div>
        <Label className="text-xs">Images come from</Label>
        <Select value={fromPortfolio ? "portfolio" : "manual"} onValueChange={(v) => update("source", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="manual" className="text-xs">Images added here</SelectItem>
            <SelectItem value="portfolio" className="text-xs">Portfolio group (updates automatically)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {fromPortfolio && (
        <>
          <div>
            <Label className="text-xs">Portfolio group</Label>
            <Select value={block.data.portfolioGroupId ?? ""} onValueChange={(v) => update("portfolioGroupId", v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Choose a group" /></SelectTrigger>
              <SelectContent>
                {groups.map((g) => <SelectItem key={g.id} value={g.id} className="text-xs">{g.name} ({g.portfolio_items?.length ?? 0})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug">
            Newest first. Items added in <Link href="/dashboard/portfolio" target="_blank" className="underline">Dashboard &gt; Portfolio</Link> appear here without editing this page; their captions are the item titles. Filter tabs use each item&apos;s country.
          </p>
        </>
      )}
    </div>
  );
}

export function GallerySettings({ block }: { block: GalleryBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (field: string, value: unknown) =>
    updateBlock(block.id, { data: { ...block.data, [field]: value } });

  const addImage = () => {
    update("images", [...(block.data.images ?? []), { id: generateId(), url: "", alt: "", caption: "" }]);
  };

  const images = block.data.images ?? [];
  const updateImage = (id: string, field: string, value: unknown) => {
    update("images", images.map((img) => img.id === id ? { ...img, [field]: value } : img));
  };

  const removeImage = (id: string) => {
    update("images", images.filter((img) => img.id !== id));
  };

  // Unknown saved variants draw the default grid.
  const v = renderedVariant("gallery", block.templateVariant);
  const docs = v === "document-cards";
  // Only the default grid and Masonry read the gap; the other designs fix their own spacing.
  const gapApplies = (v === "" || v === "masonry-captioned") && block.data.columns !== 1;

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Small label above title</Label><Input value={block.data.eyebrow ?? ""} onChange={(e) => update("eyebrow", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Button label</Label><Input value={block.data.link?.label ?? ""} onChange={(e) => update("link", { ...block.data.link, label: e.target.value })} className="h-8 text-xs mt-1" placeholder="See all" /></div>
        <div><Label className="text-xs">Button link</Label><Input value={block.data.link?.url ?? ""} onChange={(e) => update("link", { ...block.data.link, url: e.target.value })} className="h-8 text-xs mt-1" placeholder="/gallery" /></div>
      </div>
      {/* No Layout dropdown: the gallery's look comes from the Layout picker
          (Style tab); the old data.layout field was never read. */}
      <div>
        <Label className="text-xs">Columns</Label>
        <Select value={String(block.data.columns)} onValueChange={(v) => update("columns", Number(v))}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["1","2","3","4","5","6"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c === "1" ? "1 (wide, uncropped)" : c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {gapApplies && (
        <div>
          <Label className="text-xs">Space between photos</Label>
          <Select value={block.data.gap ?? "md"} onValueChange={(v) => update("gap", v)}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">None</SelectItem>
              <SelectItem value="sm" className="text-xs">Small</SelectItem>
              <SelectItem value="md" className="text-xs">Normal</SelectItem>
              <SelectItem value="lg" className="text-xs">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <GallerySourcePicker block={block} update={update} />
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Show first (0 = all)</Label><Input type="number" min={0} value={block.data.limit ?? 0} onChange={(e) => update("limit", Math.max(0, Number(e.target.value) || 0))} className="h-8 text-xs mt-1" /></div>
        <div><Label className="text-xs">Load more label</Label><Input value={block.data.loadMoreLabel ?? ""} onChange={(e) => update("loadMoreLabel", e.target.value)} className="h-8 text-xs mt-1" placeholder="Load more" /></div>
      </div>
      <div className="flex items-center justify-between"><Label className="text-xs">Lightbox</Label><Switch checked={block.data.lightbox} onCheckedChange={(v) => update("lightbox", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Filter tabs by category</Label><Switch checked={!!block.data.showFilter} onCheckedChange={(v) => update("showFilter", v)} /></div>
      {block.data.showFilter && block.data.source !== "portfolio" && <p className="text-[10px] text-muted-foreground">Give each photo a category below (e.g. Offices, Retail). Tabs appear when 2 or more categories are used.</p>}
      {block.data.showFilter && (
        <div><Label className="text-xs">First tab text</Label><Input value={block.data.filterAllLabel ?? ""} onChange={(e) => update("filterAllLabel", e.target.value || undefined)} className="h-8 text-xs mt-1" placeholder="All" /></div>
      )}
      <div><Label className="text-xs">Text when there are no photos</Label><Input value={block.data.emptyText ?? ""} onChange={(e) => update("emptyText", e.target.value || undefined)} className="h-8 text-xs mt-1" placeholder="No images added yet" /></div>

      {block.data.source !== "portfolio" && <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">Images ({images.length})</Label>
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={addImage}><Plus className="h-3 w-3 mr-1" /> Add</Button>
        </div>
        <div className="space-y-2">
          {images.map((img, i) => (
            <div key={img.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">#{i + 1}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeImage(img.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
              <MediaPickerInput compact value={img.url} onChange={(url) => updateImage(img.id, "url", url)} focus={img.imageFocus} onFocusChange={(f) => updateImage(img.id, "imageFocus", f)} />
              <Input value={img.alt ?? ""} onChange={(e) => updateImage(img.id, "alt", e.target.value)} className="h-7 text-xs" placeholder="Alt text" />
              <Input value={img.caption ?? ""} onChange={(e) => updateImage(img.id, "caption", e.target.value)} className="h-7 text-xs" placeholder={docs ? "Title (e.g. Work visa, Germany)" : "Caption (optional)"} />
              {(block.data.showFilter || docs) && <Input value={img.category ?? ""} onChange={(e) => updateImage(img.id, "category", e.target.value)} className="h-7 text-xs" placeholder={docs ? "Country chip (also the filter tab)" : "Category (filter tab)"} />}
              {docs && <Input value={img.note ?? ""} onChange={(e) => updateImage(img.id, "note", e.target.value || undefined)} className="h-7 text-xs" placeholder="Small line under the title (e.g. Work visa, 1 Jun 2026)" />}
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}

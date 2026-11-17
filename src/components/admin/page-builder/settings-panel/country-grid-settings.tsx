"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import { LinesField } from "./showcase-fields";
import type { CountryGridBlockProps, CountryGridItem } from "@/types/cms";

/** Country grid had no settings panel at all — found in the full
 *  block-editor audit. */
export function CountryGridSettings({ block }: { block: CountryGridBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const items = block.data.items ?? [];

  const addItem = () => {
    const item: CountryGridItem = { id: generateId(), country: "Country Name" };
    update("items", [...items, item]);
  };
  const updateItem = (id: string, f: keyof CountryGridItem, v: unknown) => {
    update("items", items.map((i) => (i.id === id ? { ...i, [f]: v } : i)));
  };
  const removeItem = (id: string) => update("items", items.filter((i) => i.id !== id));
  const chips = block.data.display === "chips";
  // Regions are shown as headings when grouping (cards) or always (chips).
  const regionsShown = chips || !!block.data.groupByRegion;
  const hasOther = items.some((i) => !i.region);

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Small label above title</Label>
        <Input value={block.data.eyebrow ?? ""} onChange={(e) => update("eyebrow", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Subtitle</Label>
        <Input value={block.data.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Display</Label>
        <Select value={block.data.display ?? "cards"} onValueChange={(v) => update("display", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cards" className="text-xs">Country cards</SelectItem>
            <SelectItem value="chips" className="text-xs">Region panels with country chips</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {!chips && (
        <>
          <div>
            <Label className="text-xs">Columns</Label>
            <Select value={String(block.data.columns ?? 4)} onValueChange={(v) => update("columns", Number(v))}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{[2, 3, 4].map((c) => <SelectItem key={c} value={String(c)} className="text-xs">{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Group by Region</Label>
            <Switch checked={!!block.data.groupByRegion} onCheckedChange={(v) => update("groupByRegion", v)} />
          </div>
          <div>
            <Label className="text-xs">Link text on cards</Label>
            <Input value={block.data.linkLabel ?? ""} onChange={(e) => update("linkLabel", e.target.value || undefined)} className="h-8 text-xs mt-1" placeholder="View details" />
          </div>
        </>
      )}
      {regionsShown && hasOther && (
        <div>
          <Label className="text-xs">Heading for countries without a region</Label>
          <Input value={block.data.otherRegionLabel ?? ""} onChange={(e) => update("otherRegionLabel", e.target.value || undefined)} className="h-8 text-xs mt-1" placeholder="Other" />
        </div>
      )}
      {chips && (
        <div className="space-y-1.5 border-t pt-3">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Region panels</p>
          {Array.from(new Set(items.map((i) => i.region ?? "Other"))).map((name) => {
            const meta = block.data.regions?.find((r) => r.name === name) ?? { name };
            const setMeta = (f: "badge" | "description", v: string) =>
              update("regions", [...(block.data.regions ?? []).filter((r) => r.name !== name), { ...meta, [f]: v }]);
            return (
              <div key={name} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
                <p className="text-xs font-medium">{name === "Other" ? block.data.otherRegionLabel || "Other" : name}</p>
                <Input value={meta.badge ?? ""} onChange={(e) => setMeta("badge", e.target.value)} className="h-7 text-xs" placeholder="Badge, e.g. 29 countries" />
                <Input value={meta.description ?? ""} onChange={(e) => setMeta("description", e.target.value)} className="h-7 text-xs" placeholder="Short description" />
              </div>
            );
          })}
        </div>
      )}
      <div>
        <Label className="text-xs">&quot;See all&quot; button (optional)</Label>
        <div className="flex gap-1 mt-1">
          <Input value={block.data.allLink?.label ?? ""} onChange={(e) => update("allLink", { ...block.data.allLink, label: e.target.value })} className="h-7 text-xs flex-1" placeholder="See all" />
          <Input value={block.data.allLink?.url ?? ""} onChange={(e) => update("allLink", { ...block.data.allLink, url: e.target.value })} className="h-7 text-xs flex-1" placeholder="/countries" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Accent Color</Label>
        {/* The block draws #1e3a8a until a colour is saved; show that, not a different blue. */}
        <ColorPicker value={block.data.accentColor ?? "#1e3a8a"} onChange={(v) => update("accentColor", v)} className="mt-0.5" />
      </div>
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Countries</p>
          <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex items-center gap-1">
                <Input value={item.country} onChange={(e) => updateItem(item.id, "country", e.target.value)} className="h-7 text-xs flex-1" placeholder="Country" />
                <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)} className="h-7 w-7 shrink-0 text-destructive hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Input value={item.flagEmoji ?? ""} onChange={(e) => updateItem(item.id, "flagEmoji", e.target.value)} className="h-7 text-xs" placeholder="Flag emoji" />
                <Input value={item.region ?? ""} onChange={(e) => updateItem(item.id, "region", e.target.value || undefined)} className="h-7 text-xs" placeholder="Region" />
              </div>
              <Input value={item.href ?? ""} onChange={(e) => updateItem(item.id, "href", e.target.value)} className="h-7 text-xs" placeholder="Link URL" />
              {/* Chips show only the flag and name; the card details below belong to the cards display. */}
              {!chips && (
                <>
                  <MediaPickerInput compact value={item.image ?? ""} onChange={(url) => updateItem(item.id, "image", url)} placeholder="Photo (optional)" />
                  <Input value={item.processingTime ?? ""} onChange={(e) => updateItem(item.id, "processingTime", e.target.value)} className="h-7 text-xs" placeholder="Processing time (shown on the photo)" />
                  <Input value={item.summary ?? ""} onChange={(e) => updateItem(item.id, "summary", e.target.value)} className="h-7 text-xs" placeholder="Summary" />
                  <LinesField label="Visa types (first 3 show as chips)" value={item.visaTypes} onChange={(v) => updateItem(item.id, "visaTypes", v)} rows={2} />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

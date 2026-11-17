"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import type { IconGridBlockProps, IconGridItem } from "@/types/cms";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { renderedVariant } from "./rendered-variant";

/** Designs that size their icons from "Icon size". */
const ICON_SIZE_VARIANTS = ["", "colored-tiles", "minimal-inline"];
/** Designs that size item images (logos) from "Image size". */
const IMAGE_SIZE_VARIANTS = ["", "colored-tiles", "minimal-inline", "outlined-cards", "circle-icons", "dark-tiles", "bordered-matrix"];
/** Designs that use the item colour. */
const COLOUR_VARIANTS = ["", "colored-tiles", "minimal-inline", "circle-icons", "grouped-list"];

export function IconGridSettings({ block }: { block: IconGridBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const items = block.data.items ?? [];

  const addItem = () => {
    const item: IconGridItem = { id: generateId(), icon: "Star", label: "Item" };
    update("items", [...items, item]);
  };

  const updateItem = (id: string, f: keyof IconGridItem, v: string) => {
    update("items", items.map(i => i.id === id ? { ...i, [f]: v || (f === "color" || f === "tileColor" ? undefined : v) } : i));
  };
  // Unknown saved variants draw the default grid.
  const variant = renderedVariant("icon_grid", block.templateVariant);
  const descToggle = variant === "bordered-matrix" || variant === "minimal-inline";
  const tiles = variant === "colored-tiles";
  const grouped = variant === "grouped-list";
  const columnsApply = variant !== "minimal-inline" && variant !== "pill-row";
  const iconApplies = variant !== "numbered-features";
  const descApplies = variant !== "pill-row";

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      {columnsApply && (
        <div>
          <Label className="text-xs">Columns</Label>
          <Select value={String(block.data.columns)} onValueChange={v => update("columns", Number(v))}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{[2,3,4,5,6].map(c => <SelectItem key={c} value={String(c)} className="text-xs">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {/* Style shapes the default grid only; the named layouts fix their own look. */}
      {!variant && (
        <div>
          <Label className="text-xs">Style</Label>
          <Select value={block.data.style} onValueChange={v => update("style", v)}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{["plain","card","colored"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {ICON_SIZE_VARIANTS.includes(variant) && (
        <div>
          <Label className="text-xs">Icon Size</Label>
          <Select value={block.data.iconSize} onValueChange={v => update("iconSize", v)}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{["sm","md","lg"].map(s => <SelectItem key={s} value={s} className="text-xs uppercase">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {IMAGE_SIZE_VARIANTS.includes(variant) && (
        <div>
          <Label className="text-xs">Image size (logos, badges)</Label>
          <Select value={String(block.data.imageSize ?? 0)} onValueChange={v => update("imageSize", Number(v) || undefined)}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0" className="text-xs">Same as icon size</SelectItem>
              {[48, 64, 80, 96, 120].map(s => <SelectItem key={s} value={String(s)} className="text-xs">{s}px</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {descToggle && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show descriptions</Label>
          <Switch checked={!!block.data.showDescriptions} onCheckedChange={v => update("showDescriptions", v || undefined)} />
        </div>
      )}
      {grouped && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Hide the count</Label>
          <Switch checked={!!block.data.hideCount} onCheckedChange={v => update("hideCount", v || undefined)} />
        </div>
      )}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">{grouped ? "Groups" : "Items"}</p>
          <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1">
                <Input value={item.label} onChange={e => updateItem(item.id, "label", e.target.value)} className="h-7 text-xs flex-1" placeholder={grouped ? "Group title" : "Label"} />
                <Button size="icon" variant="ghost" onClick={() => update("items", items.filter(i => i.id !== item.id))} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
              {iconApplies && (
                <>
                  <Input value={item.icon} onChange={e => updateItem(item.id, "icon", e.target.value)} className="h-7 text-xs" placeholder="Lucide icon (e.g. Star)" />
                  <MediaPickerInput compact value={item.imageUrl ?? ""} onChange={v => updateItem(item.id, "imageUrl", v)} placeholder="Image instead of icon (logo)" />
                </>
              )}
              {variant === "outlined-cards" && (
                <MediaPickerInput compact value={item.thumbUrl ?? ""} onChange={v => updateItem(item.id, "thumbUrl", v)} placeholder="Thumbnail photo (left edge)" />
              )}
              {descApplies && (
                // Multi-line: the descriptions keep line breaks, and Grouped List reads one name per line.
                <Textarea value={item.description ?? ""} onChange={e => updateItem(item.id, "description", e.target.value)} className="text-xs resize-none" rows={grouped ? 4 : 2}
                  placeholder={grouped ? "Names in this group, one per line" : descToggle && !block.data.showDescriptions ? "Optional description (turn on Show descriptions)" : "Optional description"} />
              )}
              <Input value={item.url ?? ""} onChange={e => updateItem(item.id, "url", e.target.value)} className="h-7 text-xs" placeholder="Link URL" />
              {(COLOUR_VARIANTS.includes(variant) || tiles) && (
                <div className="grid grid-cols-2 gap-1.5">
                  <div><Label className="text-[10px] text-muted-foreground">{tiles ? "Icon badge colour" : "Colour"}</Label><ColorPicker value={item.color ?? ""} onChange={v => updateItem(item.id, "color", v)} className="h-7 mt-0.5" /></div>
                  {tiles && <div><Label className="text-[10px] text-muted-foreground">Tile colour</Label><ColorPicker value={item.tileColor ?? ""} onChange={v => updateItem(item.id, "tileColor", v)} className="h-7 mt-0.5" /></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

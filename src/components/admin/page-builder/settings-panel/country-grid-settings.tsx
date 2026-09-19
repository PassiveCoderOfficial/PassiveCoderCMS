"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { CountryGridBlockProps, CountryGridItem } from "@/types/cms";

/** Country grid had no settings panel at all — found in the full
 *  block-editor audit. */
export function CountryGridSettings({ block }: { block: CountryGridBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const addItem = () => {
    const item: CountryGridItem = { id: generateId(), country: "Country Name" };
    update("items", [...block.data.items, item]);
  };
  const updateItem = (id: string, f: keyof CountryGridItem, v: unknown) => {
    update("items", block.data.items.map((i) => (i.id === id ? { ...i, [f]: v } : i)));
  };
  const removeItem = (id: string) => update("items", block.data.items.filter((i) => i.id !== id));

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Subtitle</Label>
        <Input value={block.data.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Columns</Label>
        <Select value={String(block.data.columns ?? 3)} onValueChange={(v) => update("columns", Number(v))}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{[2, 3, 4].map((c) => <SelectItem key={c} value={String(c)} className="text-xs">{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Group by Region</Label>
        <Switch checked={!!block.data.groupByRegion} onCheckedChange={(v) => update("groupByRegion", v)} />
      </div>
      <div>
        <Label className="text-xs">Accent Color</Label>
        <ColorPicker value={block.data.accentColor ?? "#2563eb"} onChange={(v) => update("accentColor", v)} className="mt-0.5" />
      </div>
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Countries</p>
          <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-3">
          {block.data.items.map((item) => (
            <div key={item.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex items-center gap-1">
                <Input value={item.country} onChange={(e) => updateItem(item.id, "country", e.target.value)} className="h-7 text-xs flex-1" placeholder="Country" />
                <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)} className="h-7 w-7 shrink-0 text-destructive hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Input value={item.flagEmoji ?? ""} onChange={(e) => updateItem(item.id, "flagEmoji", e.target.value)} className="h-7 text-xs" placeholder="Flag emoji" />
                <Input value={item.region ?? ""} onChange={(e) => updateItem(item.id, "region", e.target.value)} className="h-7 text-xs" placeholder="Region" />
              </div>
              <Input value={item.image ?? ""} onChange={(e) => updateItem(item.id, "image", e.target.value)} className="h-7 text-xs" placeholder="Image URL" />
              <Input value={item.processingTime ?? ""} onChange={(e) => updateItem(item.id, "processingTime", e.target.value)} className="h-7 text-xs" placeholder="Processing time" />
              <Input value={item.summary ?? ""} onChange={(e) => updateItem(item.id, "summary", e.target.value)} className="h-7 text-xs" placeholder="Summary" />
              <Input value={item.href ?? ""} onChange={(e) => updateItem(item.id, "href", e.target.value)} className="h-7 text-xs" placeholder="Link URL" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

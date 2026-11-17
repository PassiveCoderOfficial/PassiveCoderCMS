"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import { ColorPicker } from "@/components/ui/color-picker";
import type { StatsBlockProps, StatItem } from "@/types/cms";

// Designs that draw an icon above the number; the others never show one.
const ICON_DESIGNS = ["", "colored-row", "gradient-numbers"];

export function StatsSettings({ block }: { block: StatsBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const known = ["colored-row", "plain-dark", "navy-row", "gradient-numbers", "bold-dark-row", "warm-row", "dark-band"];
  const design = known.includes(block.templateVariant ?? "") ? block.templateVariant! : "";
  const showIcon = ICON_DESIGNS.includes(design);
  // The default design lays a "row" out as 4 across whatever Columns says.
  const columnsApply = design !== "" || block.data.layout === "grid";
  // Any edit opts the block into the Nov 2026 rendering (title / prefix / suffix
  // shown); the canvas shows the result straight away. Untouched saved blocks keep their look.
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, showAllText: true, [f]: v } });

  const addStat = () => {
    const s: StatItem = { id: generateId(), value: "100+", label: "Stat Label" };
    update("items", [...block.data.items, s]);
  };

  const updateStat = (id: string, f: keyof StatItem, v: string) => {
    update("items", block.data.items.map(s => s.id === id ? { ...s, [f]: v } : s));
  };

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      {/* Style + Layout only affect StatsLegacy (no templateVariant set) —
          the 7 designed variants have a fixed look and never read these
          fields. Animate Count-Up is read universally and stays visible. */}
      {!block.templateVariant && (
        <>
          <div>
            <Label className="text-xs">Style</Label>
            <Select value={block.data.style} onValueChange={v => update("style", v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{["plain","cards","colored"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Layout</Label>
            <Select value={block.data.layout} onValueChange={v => update("layout", v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{["row","grid"].map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </>
      )}
      {columnsApply && (
        <div>
          <Label className="text-xs">Columns</Label>
          <Select value={String(block.data.columns ?? 4)} onValueChange={v => update("columns", Number(v))}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{[2, 3, 4].map(c => <SelectItem key={c} value={String(c)} className="text-xs">{c} across</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1">Phones always show 2 across.</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Animate Count-Up</Label>
        <Switch checked={block.data.animate} onCheckedChange={v => update("animate", v)} />
      </div>
      {block.templateVariant === "dark-band" && (
        <div><Label className="text-xs">Band colour (blank = theme)</Label><ColorPicker value={block.data.bandColor ?? ""} onChange={v => update("bandColor", v)} allowAlpha={false} className="mt-1" /></div>
      )}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Stats</p>
          <Button size="sm" variant="outline" onClick={addStat} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-2">
          {block.data.items.map(s => (
            <div key={s.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1">
                <Input value={s.value} onChange={e => updateStat(s.id, "value", e.target.value)} className="h-7 text-xs flex-1" placeholder="100+" />
                <Button size="icon" variant="ghost" onClick={() => update("items", block.data.items.filter(i => i.id !== s.id))} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Input value={s.label} onChange={e => updateStat(s.id, "label", e.target.value)} className="h-7 text-xs" placeholder="Label" />
              {showIcon && <Input value={s.icon ?? ""} onChange={e => updateStat(s.id, "icon", e.target.value)} className="h-7 text-xs" placeholder="Icon (e.g. Users)" />}
              <div className="flex gap-1">
                <Input value={s.prefix ?? ""} onChange={e => updateStat(s.id, "prefix", e.target.value)} className="h-7 text-xs" placeholder="Before the number ($)" />
                <Input value={s.suffix ?? ""} onChange={e => updateStat(s.id, "suffix", e.target.value)} className="h-7 text-xs" placeholder="After the number (+)" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

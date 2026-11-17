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
import { renderedVariant } from "./rendered-variant";
import type { StepsBlockProps, StepItem } from "@/types/cms";

/** Designs that draw each step's photo (the default only in its top-to-bottom list). */
const PHOTO_VARIANTS = ["timeline-connected", "split-media"];
/** Designs that draw each step's icon (the default and Connected Timeline put it in place of the number). */
const ICON_VARIANTS = ["", "timeline-connected", "numbered-cards", "icon-row"];

export function StepsSettings({ block }: { block: StepsBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const items = block.data.items ?? [];

  const addStep = () => {
    const s: StepItem = { id: generateId(), title: "New Step" };
    update("items", [...items, s]);
  };

  const updateStep = (id: string, f: keyof StepItem, v: string) => {
    update("items", items.map(s => s.id === id ? { ...s, [f]: v } : s));
  };

  // Unknown saved variants draw the default layout.
  const v = renderedVariant("steps", block.templateVariant);
  const photo = PHOTO_VARIANTS.includes(v) || (v === "" && block.data.layout !== "horizontal");
  const icon = ICON_VARIANTS.includes(v);
  const number = v !== "icon-row";
  const stepWord = v === "dark-cards" || v === "split-media";

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      {/* Layout and Style shape the default design only; the named layouts fix their own. */}
      {!v && (
        <>
          <div>
            <Label className="text-xs">Layout</Label>
            <Select value={block.data.layout} onValueChange={v => update("layout", v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{["horizontal","vertical","numbered"].map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Style</Label>
            <Select value={block.data.style} onValueChange={v => update("style", v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{["plain","connected","card"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </>
      )}
      {stepWord && (
        <div><Label className="text-xs">Word before each number</Label><Input value={block.data.stepLabel ?? ""} onChange={e => update("stepLabel", e.target.value || undefined)} className="h-8 text-xs mt-1" placeholder="Step" /></div>
      )}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Steps</p>
          <Button size="sm" variant="outline" onClick={addStep} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-3">
          {items.map(s => (
            <div key={s.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1">
                <Input value={s.title} onChange={e => updateStep(s.id, "title", e.target.value)} className="h-7 text-xs flex-1" placeholder="Step title" />
                <Button size="icon" variant="ghost" onClick={() => update("items", items.filter(i => i.id !== s.id))} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Textarea value={s.description ?? ""} onChange={e => updateStep(s.id, "description", e.target.value)} className="text-xs resize-none" rows={2} placeholder="Description" />
              {photo && (
                <>
                  <p className="text-[10px] text-muted-foreground">Photo (optional)</p>
                  <MediaPickerInput compact value={s.imageUrl ?? ""} onChange={url => updateStep(s.id, "imageUrl", url)} />
                </>
              )}
              {icon && <Input value={s.icon ?? ""} onChange={e => updateStep(s.id, "icon", e.target.value)} className="h-7 text-xs" placeholder={v === "icon-row" || v === "numbered-cards" ? "Icon (e.g. CheckCircle)" : "Icon instead of the number (e.g. CheckCircle)"} />}
              {number && <Input value={s.number ?? ""} onChange={e => updateStep(s.id, "number", e.target.value)} className="h-7 text-xs" placeholder="Custom number/label" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

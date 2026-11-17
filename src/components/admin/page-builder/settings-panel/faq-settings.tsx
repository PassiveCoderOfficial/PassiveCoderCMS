"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { FAQBlockProps, FAQItem } from "@/types/cms";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { renderedVariant } from "./rendered-variant";

/** Designs that open and close answers (the default only as an accordion). */
const ACCORDION_VARIANTS = ["accordion-bordered", "split-heading", "dark-accordion", "minimal-lines"];

export function FAQSettings({ block }: { block: FAQBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const items = block.data.items ?? [];

  const addItem = () => {
    const item: FAQItem = { id: generateId(), question: "New Question?", answer: "Answer goes here." };
    update("items", [...items, item]);
  };

  const updateItem = (id: string, f: keyof FAQItem, v: string) => {
    update("items", items.map(i => i.id === id ? { ...i, [f]: v } : i));
  };

  // Unknown saved variants (e.g. "accordion-dark") draw the default layout.
  const v = renderedVariant("faq", block.templateVariant);
  const opens = ACCORDION_VARIANTS.includes(v) || (!v && block.data.layout !== "grid" && block.data.layout !== "simple");

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      {v === "split-heading" && (
        <>
          <div><Label className="text-xs">Photo under the heading (optional)</Label><div className="mt-1"><MediaPickerInput compact value={block.data.sideImage ?? ""} onChange={v => update("sideImage", v || undefined)} /></div></div>
          {block.data.sideImage && (
            <div><Label className="text-xs">Photo description (for search engines)</Label><Input value={block.data.sideImageAlt ?? ""} onChange={e => update("sideImageAlt", e.target.value || undefined)} className="h-8 text-xs mt-1" placeholder={block.data.title || "Describe the photo"} /></div>
          )}
        </>
      )}
      {/* Layout shapes the default design only; the named layouts fix their own. */}
      {!v && (
        <div>
          <Label className="text-xs">Layout</Label>
          <Select value={block.data.layout} onValueChange={v => update("layout", v)}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{["accordion","grid","simple"].map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {opens && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Allow Multiple Open</Label>
          <Switch checked={block.data.allowMultiple} onCheckedChange={v => update("allowMultiple", v)} />
        </div>
      )}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Questions</p>
          <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1">
                <Input value={item.question} onChange={e => updateItem(item.id, "question", e.target.value)} className="h-7 text-xs flex-1" placeholder="Question" />
                <Button size="icon" variant="ghost" onClick={() => update("items", items.filter(i => i.id !== item.id))} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Textarea value={item.answer} onChange={e => updateItem(item.id, "answer", e.target.value)} className="text-xs resize-none" rows={3} placeholder="Answer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

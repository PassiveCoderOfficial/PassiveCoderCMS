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
import type { FeaturesBlockProps, FeatureItem } from "@/types/cms";

export function FeaturesSettings({ block }: { block: FeaturesBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const addItem = () => {
    const item: FeatureItem = { id: generateId(), icon: "Star", title: "New Feature", description: "Describe this feature." };
    update("items", [...block.data.items, item]);
  };

  const updateItem = (id: string, f: keyof FeatureItem, v: string) => {
    update("items", block.data.items.map(i => i.id === id ? { ...i, [f]: v } : i));
  };

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      {/* Layout, Style, and Columns only affect FeaturesLegacy (no
          templateVariant) — "dark" is a fixed two-column checklist layout
          and never reads any of these fields. */}
      {!block.templateVariant && (
        <>
          <div>
            <Label className="text-xs">Layout</Label>
            <Select value={block.data.layout} onValueChange={v => update("layout", v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{["grid","alternating","icon-list","centered"].map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Style</Label>
            <Select value={block.data.style} onValueChange={v => update("style", v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{["minimal","card","gradient"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Columns</Label>
            <Select value={String(block.data.columns)} onValueChange={v => update("columns", Number(v))}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{[2,3,4].map(c => <SelectItem key={c} value={String(c)} className="text-xs">{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </>
      )}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Features</p>
          <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-3">
          {block.data.items.map(item => (
            <div key={item.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1">
                <Input value={item.title} onChange={e => updateItem(item.id, "title", e.target.value)} className="h-7 text-xs flex-1" placeholder="Title" />
                <Button size="icon" variant="ghost" onClick={() => update("items", block.data.items.filter(i => i.id !== item.id))} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Input value={item.icon ?? ""} onChange={e => updateItem(item.id, "icon", e.target.value)} className="h-7 text-xs" placeholder="Lucide icon name (e.g. Star)" />
              <Textarea value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} className="text-xs resize-none" rows={2} placeholder="Description" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
import type { StepsBlockProps, StepItem } from "@/types/cms";

export function StepsSettings({ block }: { block: StepsBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const addStep = () => {
    const s: StepItem = { id: generateId(), title: "New Step" };
    update("items", [...block.data.items, s]);
  };

  const updateStep = (id: string, f: keyof StepItem, v: string) => {
    update("items", block.data.items.map(s => s.id === id ? { ...s, [f]: v } : s));
  };

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
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
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Steps</p>
          <Button size="sm" variant="outline" onClick={addStep} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-3">
          {block.data.items.map(s => (
            <div key={s.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1">
                <Input value={s.title} onChange={e => updateStep(s.id, "title", e.target.value)} className="h-7 text-xs flex-1" placeholder="Step title" />
                <Button size="icon" variant="ghost" onClick={() => update("items", block.data.items.filter(i => i.id !== s.id))} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Textarea value={s.description ?? ""} onChange={e => updateStep(s.id, "description", e.target.value)} className="text-xs resize-none" rows={2} placeholder="Description" />
              <Input value={s.icon ?? ""} onChange={e => updateStep(s.id, "icon", e.target.value)} className="h-7 text-xs" placeholder="Icon (e.g. CheckCircle)" />
              <Input value={s.number ?? ""} onChange={e => updateStep(s.id, "number", e.target.value)} className="h-7 text-xs" placeholder="Custom number/label" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

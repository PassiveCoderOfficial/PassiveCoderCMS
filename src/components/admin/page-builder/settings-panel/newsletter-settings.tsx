"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { NewsletterBlockProps } from "@/types/cms";

export function NewsletterSettings({ block }: { block: NewsletterBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Description</Label><Input value={block.data.description ?? ""} onChange={e => update("description", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Placeholder</Label><Input value={block.data.placeholder} onChange={e => update("placeholder", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Button Label</Label><Input value={block.data.submitLabel} onChange={e => update("submitLabel", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Success Message</Label><Input value={block.data.successMessage} onChange={e => update("successMessage", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={v => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["inline","stacked","card"].map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Webhook URL (optional)</Label><Input value={block.data.webhookUrl ?? ""} onChange={e => update("webhookUrl", e.target.value)} className="h-8 text-xs mt-1" placeholder="https://..." /></div>
    </div>
  );
}

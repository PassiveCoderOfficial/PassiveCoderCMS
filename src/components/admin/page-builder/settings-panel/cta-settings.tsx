"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CTABlockProps } from "@/types/cms";

export function CTASettings({ block }: { block: CTABlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const updateBtn = (btn: "primaryButton" | "secondaryButton", f: string, v: string) => {
    const ex = block.data[btn] ?? { label: "", url: "" };
    update(btn, { ...ex, [f]: v });
  };

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Description</Label><Textarea value={block.data.description ?? ""} onChange={(e) => update("description", e.target.value)} className="text-xs resize-none mt-1" rows={3} /></div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["centered","left","split"].map((l) => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="border-t pt-2">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Primary Button</p>
        <Input value={block.data.primaryButton?.label ?? ""} onChange={(e) => updateBtn("primaryButton", "label", e.target.value)} className="h-7 text-xs mb-1.5" placeholder="Label" />
        <Input value={block.data.primaryButton?.url ?? ""} onChange={(e) => updateBtn("primaryButton", "url", e.target.value)} className="h-7 text-xs" placeholder="URL" />
      </div>
      <div className="border-t pt-2">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Secondary Button</p>
        <Input value={block.data.secondaryButton?.label ?? ""} onChange={(e) => updateBtn("secondaryButton", "label", e.target.value)} className="h-7 text-xs mb-1.5" placeholder="Label" />
        <Input value={block.data.secondaryButton?.url ?? ""} onChange={(e) => updateBtn("secondaryButton", "url", e.target.value)} className="h-7 text-xs" placeholder="URL" />
      </div>
    </div>
  );
}

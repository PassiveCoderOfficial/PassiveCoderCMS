"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HeaderCtaBlockProps } from "@/types/cms";

export function HeaderCtaSettings({ block }: { block: HeaderCtaBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Label</Label><Input value={block.data.label} onChange={(e) => update("label", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Link URL</Label><Input value={block.data.url} onChange={(e) => update("url", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div>
        <Label className="text-xs">Style</Label>
        <Select value={block.data.variant} onValueChange={(v) => update("variant", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="gradient" className="text-xs">Gradient</SelectItem>
            <SelectItem value="solid" className="text-xs">Solid</SelectItem>
            <SelectItem value="outline" className="text-xs">Outline</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { EmbedBlockProps } from "@/types/cms";

export function EmbedSettings({ block }: { block: EmbedBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Embed Type</Label>
        <Select value={block.data.embedType} onValueChange={v => update("embedType", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["youtube","vimeo","iframe","spotify"].map(t => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">URL</Label><Input value={block.data.url} onChange={e => update("url", e.target.value)} className="h-8 text-xs mt-1" placeholder="Embed URL" /></div>
      <div>
        <Label className="text-xs">Aspect Ratio</Label>
        <Select value={block.data.aspectRatio} onValueChange={v => update("aspectRatio", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["16:9","4:3","1:1","9:16"].map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Caption</Label><Input value={block.data.caption ?? ""} onChange={e => update("caption", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Autoplay</Label><Switch checked={block.data.autoplay ?? false} onCheckedChange={v => update("autoplay", v)} /></div>
    </div>
  );
}

"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { VideoBlockProps } from "@/types/cms";

export function VideoSettings({ block }: { block: VideoBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Video Type</Label>
        <Select value={block.data.videoType} onValueChange={v => update("videoType", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["youtube","vimeo","mp4"].map(t => <SelectItem key={t} value={t} className="text-xs uppercase">{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Video URL</Label><Input value={block.data.url} onChange={e => update("url", e.target.value)} className="h-8 text-xs mt-1" placeholder="YouTube/Vimeo URL or .mp4 URL" /></div>
      <div>
        <Label className="text-xs">Aspect Ratio</Label>
        <Select value={block.data.aspectRatio} onValueChange={v => update("aspectRatio", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["16:9","4:3","1:1"].map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Max Width (e.g. 800px)</Label><Input value={block.data.maxWidth ?? ""} onChange={e => update("maxWidth", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Caption</Label><Input value={block.data.caption ?? ""} onChange={e => update("caption", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Autoplay</Label><Switch checked={block.data.autoplay} onCheckedChange={v => update("autoplay", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Muted</Label><Switch checked={block.data.muted} onCheckedChange={v => update("muted", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Loop</Label><Switch checked={block.data.loop} onCheckedChange={v => update("loop", v)} /></div>
      {block.data.videoType === "mp4" && (
        <>
          <div className="flex items-center justify-between"><Label className="text-xs">Controls</Label><Switch checked={block.data.controls} onCheckedChange={v => update("controls", v)} /></div>
          <div><Label className="text-xs">Poster Image URL</Label><Input value={block.data.poster ?? ""} onChange={e => update("poster", e.target.value)} className="h-8 text-xs mt-1" /></div>
        </>
      )}
    </div>
  );
}

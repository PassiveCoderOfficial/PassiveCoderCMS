"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { VideoBlockProps } from "@/types/cms";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/utils";

export function VideoSettings({ block }: { block: VideoBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const multi = block.templateVariant === "gallery" || block.templateVariant === "playlist";
  const videos = block.data.videos ?? [];
  const setVideos = (v: typeof videos) => update("videos", v);

  if (multi) {
    return (
      <div className="space-y-3">
        <div><Label className="text-xs">Section title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
        <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
        {block.templateVariant === "gallery" && (
          <div>
            <Label className="text-xs">Columns</Label>
            <Select value={String(block.data.galleryColumns ?? 3)} onValueChange={v => update("galleryColumns", Number(v))}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{[2, 3, 4].map(c => <SelectItem key={c} value={String(c)} className="text-xs">{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Videos ({videos.length})</p>
            <Button size="sm" variant="outline" onClick={() => setVideos([...videos, { id: generateId(), url: "", title: "" }])} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
          </div>
          <div className="space-y-2">
            {videos.map(v => (
              <div key={v.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
                <div className="flex gap-1">
                  <Input value={v.url} onChange={e => setVideos(videos.map(x => x.id === v.id ? { ...x, url: e.target.value } : x))} className="h-7 text-xs flex-1" placeholder="YouTube / Vimeo link or .mp4" />
                  <Button size="icon" variant="ghost" onClick={() => setVideos(videos.filter(x => x.id !== v.id))} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
                </div>
                <Input value={v.title ?? ""} onChange={e => setVideos(videos.map(x => x.id === v.id ? { ...x, title: e.target.value } : x))} className="h-7 text-xs" placeholder="Title (optional)" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import type { ScrollStoryBlockProps } from "@/types/cms";

type D = ScrollStoryBlockProps["data"];
const selectCls = "w-full h-8 text-xs mt-1 rounded-md border bg-background px-2";

export function ScrollStorySettings({ block }: { block: ScrollStoryBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data;
  const set = <K extends keyof D>(k: K, v: D[K]) => updateBlock(block.id, { data: { ...d, [k]: v } } as Partial<ScrollStoryBlockProps>);
  const bgs = d.backgrounds ?? [];
  const scenes = d.scenes ?? [];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Background photos (in order)</Label>
        <div className="space-y-2 mt-1">
          {bgs.map((b, i) => (
            <div key={i} className="flex gap-1 items-start">
              <div className="flex-1"><MediaPickerInput compact value={b.imageUrl} onChange={(v) => set("backgrounds", bgs.map((x, j) => (j === i ? { imageUrl: v } : x)))} /></div>
              <button type="button" className="p-1.5 text-muted-foreground hover:text-destructive" onClick={() => set("backgrounds", bgs.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <button type="button" className="text-xs text-primary flex items-center gap-1" onClick={() => set("backgrounds", [...bgs, { imageUrl: "" }])}><Plus className="w-3 h-3" />Add photo</button>
        </div>
      </div>

      <div>
        <Label className="text-xs">Portrait cut-out (transparent PNG/WebP)</Label>
        <div className="mt-1"><MediaPickerInput compact value={d.portraitImage ?? ""} onChange={(v) => set("portraitImage", v)} /></div>
        <select className={selectCls} value={d.portraitSide ?? "center"} onChange={(e) => set("portraitSide", e.target.value as D["portraitSide"])}>
          <option value="center">Portrait: center</option><option value="left">Portrait: left</option><option value="right">Portrait: right</option>
        </select>
      </div>

      <div>
        <Label className="text-xs">Headline scenes</Label>
        <div className="space-y-3 mt-1">
          {scenes.map((s, i) => {
            const upd = (patch: Partial<NonNullable<D["scenes"]>[number]>) => set("scenes", scenes.map((x, j) => (j === i ? { ...x, ...patch } : x)));
            return (
              <div key={i} className="rounded-md border p-2 space-y-1.5">
                <div className="flex gap-1">
                  <Input value={s.eyebrow ?? ""} placeholder="Eyebrow" onChange={(e) => upd({ eyebrow: e.target.value })} className="h-7 text-xs" />
                  <select className="h-7 text-xs rounded-md border bg-background px-1" value={s.side ?? (i % 2 ? "right" : "left")} onChange={(e) => upd({ side: e.target.value as "left" | "right" })}>
                    <option value="left">Left</option><option value="right">Right</option>
                  </select>
                  <button type="button" className="px-1 text-muted-foreground hover:text-destructive" onClick={() => set("scenes", scenes.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <Textarea value={s.title} placeholder="Headline" rows={2} onChange={(e) => upd({ title: e.target.value })} className="text-xs" />
                <Input value={s.text ?? ""} placeholder="Optional line" onChange={(e) => upd({ text: e.target.value })} className="h-7 text-xs" />
              </div>
            );
          })}
          <button type="button" className="text-xs text-primary flex items-center gap-1" onClick={() => set("scenes", [...scenes, { title: "New scene" }])}><Plus className="w-3 h-3" />Add scene</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Height (vh)</Label><Input type="number" value={d.heightVh ?? 500} onChange={(e) => set("heightVh", Number(e.target.value))} className="h-8 text-xs mt-1" /></div>
        <div><Label className="text-xs">Darkness (0-1)</Label><Input type="number" step="0.05" value={d.overlayOpacity ?? 0.45} onChange={(e) => set("overlayOpacity", Number(e.target.value))} className="h-8 text-xs mt-1" /></div>
        <div><Label className="text-xs">Accent colour</Label><Input value={d.accentColor ?? ""} placeholder="#C8A96A" onChange={(e) => set("accentColor", e.target.value)} className="h-8 text-xs mt-1" /></div>
        <div><Label className="text-xs">Fade into colour</Label><Input value={d.blendColor ?? ""} placeholder="next section bg" onChange={(e) => set("blendColor", e.target.value)} className="h-8 text-xs mt-1" /></div>
      </div>
      <div className="flex items-center justify-between"><Label className="text-xs">Gold line grid</Label><Switch checked={d.showLines !== false} onCheckedChange={(v) => set("showLines", v)} /></div>

      {(["primaryCta", "secondaryCta"] as const).map((k) => (
        <div key={k} className="grid grid-cols-2 gap-2">
          <Input value={d[k]?.label ?? ""} placeholder={k === "primaryCta" ? "Main button" : "Second button"} onChange={(e) => set(k, { label: e.target.value, url: d[k]?.url ?? "" })} className="h-8 text-xs" />
          <Input value={d[k]?.url ?? ""} placeholder="/contact" onChange={(e) => set(k, { label: d[k]?.label ?? "", url: e.target.value })} className="h-8 text-xs" />
        </div>
      ))}
    </div>
  );
}

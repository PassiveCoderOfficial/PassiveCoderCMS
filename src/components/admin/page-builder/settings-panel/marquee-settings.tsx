"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { MarqueeBlockProps } from "@/types/cms";

type D = MarqueeBlockProps["data"];
const selectCls = "w-full h-8 text-xs mt-1 rounded-md border bg-background px-2";

export function MarqueeSettings({ block }: { block: MarqueeBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data;
  const set = <K extends keyof D>(k: K, v: D[K]) => updateBlock(block.id, { data: { ...d, [k]: v } } as Partial<MarqueeBlockProps>);
  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Words (one per line)</Label>
        <Textarea rows={5} value={(d.items ?? []).join("\n")} onChange={(e) => set("items", e.target.value.split("\n"))} className="text-xs mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Separator</Label><Input value={d.separator ?? "✦"} onChange={(e) => set("separator", e.target.value)} className="h-8 text-xs mt-1" /></div>
        <div><Label className="text-xs">Speed (px/s)</Label><Input type="number" value={d.speed ?? 40} onChange={(e) => set("speed", Number(e.target.value))} className="h-8 text-xs mt-1" /></div>
        <div><Label className="text-xs">Size</Label>
          <select className={selectCls} value={d.size ?? "lg"} onChange={(e) => set("size", e.target.value as D["size"])}><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option></select></div>
        <div><Label className="text-xs">Direction</Label>
          <select className={selectCls} value={d.direction ?? "left"} onChange={(e) => set("direction", e.target.value as D["direction"])}><option value="left">Left</option><option value="right">Right</option></select></div>
        <div><Label className="text-xs">Text colour</Label><Input value={d.color ?? ""} placeholder="theme" onChange={(e) => set("color", e.target.value)} className="h-8 text-xs mt-1" /></div>
        <div><Label className="text-xs">Separator colour</Label><Input value={d.accentColor ?? ""} placeholder="theme" onChange={(e) => set("accentColor", e.target.value)} className="h-8 text-xs mt-1" /></div>
      </div>
      <div className="flex items-center justify-between"><Label className="text-xs">Outline every other word</Label><Switch checked={d.outlineAlternate !== false} onCheckedChange={(v) => set("outlineAlternate", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">React to scrolling</Label><Switch checked={d.scrollBoost !== false} onCheckedChange={(v) => set("scrollBoost", v)} /></div>
    </div>
  );
}

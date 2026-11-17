"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CountdownBlockProps } from "@/types/cms";
import { DateTimeField } from "@/components/ui/date-time-field";

export function CountdownSettings({ block }: { block: CountdownBlockProps }) {
  const { updateBlock } = useBuilderStore();
  // Any edit opts the block into the Nov 2026 rendering (title / prefix / suffix
  // shown); the canvas shows the result straight away. Untouched saved blocks keep their look.
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, showAllText: true, [f]: v } });
  // Saved blocks without a labels object get the built-in names first.
  const BUILT_IN_LABELS: Record<string, string> = { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" };
  const updateLabel = (f: string, v: string) => update("labels", { ...BUILT_IN_LABELS, ...(block.data.labels as Record<string, string> | undefined), [f]: v });

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" placeholder="Shown above the clock (optional)" /></div>
      <div>
        <Label className="text-xs">Target Date</Label>
        <DateTimeField type="datetime-local" value={block.data.targetDate} onChange={e => update("targetDate", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={v => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{/* "flip" was listed but never built (drew a plain row); kept for saved blocks only. */}{[["boxes", "Boxes"], ["minimal", "Minimal"]].map(([l, name]) => <SelectItem key={l} value={l} className="text-xs">{name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Expired Message</Label><Input value={block.data.expiredMessage ?? ""} onChange={e => update("expiredMessage", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Show Seconds</Label><Switch checked={block.data.showSeconds} onCheckedChange={v => update("showSeconds", v)} /></div>
      <div className="border-t pt-2">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Labels</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(["days","hours","minutes","seconds"] as const).filter((k) => k !== "seconds" || block.data.showSeconds).map(k => (
            <div key={k}><Label className="text-[10px] capitalize">{k}</Label><Input value={block.data.labels?.[k] ?? ""} placeholder={k[0].toUpperCase() + k.slice(1)} onChange={e => updateLabel(k, e.target.value)} className="h-7 text-xs mt-0.5" /></div>
          ))}
        </div>
      </div>
    </div>
  );
}

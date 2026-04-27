"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CountdownBlockProps } from "@/types/cms";

export function CountdownSettings({ block }: { block: CountdownBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const updateLabel = (f: string, v: string) => update("labels", { ...block.data.labels, [f]: v });

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div>
        <Label className="text-xs">Target Date</Label>
        <Input type="datetime-local" value={block.data.targetDate} onChange={e => update("targetDate", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={v => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["boxes","minimal","flip"].map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Expired Message</Label><Input value={block.data.expiredMessage ?? ""} onChange={e => update("expiredMessage", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Show Seconds</Label><Switch checked={block.data.showSeconds} onCheckedChange={v => update("showSeconds", v)} /></div>
      <div className="border-t pt-2">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Labels</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(["days","hours","minutes","seconds"] as const).map(k => (
            <div key={k}><Label className="text-[10px]">{k}</Label><Input value={block.data.labels[k]} onChange={e => updateLabel(k, e.target.value)} className="h-7 text-xs mt-0.5" /></div>
          ))}
        </div>
      </div>
    </div>
  );
}

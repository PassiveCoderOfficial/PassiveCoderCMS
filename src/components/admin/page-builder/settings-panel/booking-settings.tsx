"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { BookingBlockProps } from "@/types/cms";

export function BookingSettings({ block }: { block: BookingBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Button Label</Label><Input value={block.data.submitLabel} onChange={e => update("submitLabel", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div>
        <Label className="text-xs">Accent Color</Label>
        <Input type="color" value={block.data.accentColor ?? "#4f46e5"} onChange={e => update("accentColor", e.target.value)} className="h-8 mt-1 p-1" />
      </div>
      <div>
        <Label className="text-xs">Days Shown</Label>
        <Input type="number" min={3} max={60} value={block.data.daysToShow}
          onChange={e => update("daysToShow", parseInt(e.target.value, 10) || 14)} className="h-8 text-xs mt-1" />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Phone field</Label>
        <Switch checked={block.data.showPhone} onCheckedChange={v => update("showPhone", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Message field</Label>
        <Switch checked={block.data.showMessage} onCheckedChange={v => update("showMessage", v)} />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Hours, slot length and confirmations are managed in Dashboard → Bookings.
      </p>
    </div>
  );
}

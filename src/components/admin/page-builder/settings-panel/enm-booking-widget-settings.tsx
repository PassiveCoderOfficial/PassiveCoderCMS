"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { EnmBookingWidgetBlockProps } from "@/types/cms";

export function EnmBookingWidgetSettings({ block }: { block: EnmBookingWidgetBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const upd = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Expert Slug</Label>
        <Input
          value={block.data.expertSlug}
          onChange={e => upd("expertSlug", e.target.value)}
          className="h-8 text-xs mt-1"
          placeholder="john-doe-architect"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Your ENM profile slug (expertnear.me/experts/your-slug)
        </p>
      </div>

      <div>
        <Label className="text-xs">Label (optional)</Label>
        <Input
          value={block.data.label ?? ""}
          onChange={e => upd("label", e.target.value)}
          className="h-8 text-xs mt-1"
          placeholder="Book a Session"
        />
      </div>

      <div>
        <Label className="text-xs">Height (px)</Label>
        <Input
          type="number"
          min={200}
          max={1200}
          value={block.data.height}
          onChange={e => upd("height", Number(e.target.value))}
          className="h-8 text-xs mt-1"
        />
      </div>

      <div>
        <Label className="text-xs">Max Width (px)</Label>
        <Input
          type="number"
          min={200}
          max={1200}
          value={block.data.maxWidth}
          onChange={e => upd("maxWidth", Number(e.target.value))}
          className="h-8 text-xs mt-1"
        />
      </div>

      <div>
        <Label className="text-xs">Border Radius (px)</Label>
        <Input
          type="number"
          min={0}
          max={48}
          value={block.data.borderRadius}
          onChange={e => upd("borderRadius", Number(e.target.value))}
          className="h-8 text-xs mt-1"
        />
      </div>
    </div>
  );
}

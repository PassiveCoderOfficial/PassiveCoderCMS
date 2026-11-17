"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import type { DividerBlockProps } from "@/types/cms";

/** Divider had no settings panel at all — found in the full block-editor
 *  audit. */
export function DividerSettings({ block }: { block: DividerBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Style</Label>
        <Select value={block.data.style} onValueChange={(v) => update("style", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["solid", "dashed", "dotted", "wave", "zigzag"].map((s) => (
              <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Width</Label>
        <Select value={block.data.width} onValueChange={(v) => update("width", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["full", "wide", "normal"].map((w) => (
              <SelectItem key={w} value={w} className="text-xs capitalize">{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Thickness (px)</Label>
        <Input
          type="number" min={1} max={20}
          value={block.data.thickness}
          onChange={(e) => update("thickness", Number(e.target.value))}
          className="h-8 text-xs mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Color</Label>
        <ColorPicker value={block.data.color} onChange={(v) => update("color", v)} className="mt-0.5" />
      </div>
    </div>
  );
}

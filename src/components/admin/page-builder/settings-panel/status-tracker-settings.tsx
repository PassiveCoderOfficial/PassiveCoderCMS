"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import type { StatusTrackerBlockProps } from "@/types/cms";

/** Status tracker had no settings panel at all — found in the full
 *  block-editor audit. */
export function StatusTrackerSettings({ block }: { block: StatusTrackerBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Subtitle</Label>
        <Input value={block.data.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Input Placeholder</Label>
        <Input value={block.data.placeholder ?? ""} onChange={(e) => update("placeholder", e.target.value)} className="h-8 text-xs mt-1" placeholder="Enter your reference number" />
      </div>
      <div>
        <Label className="text-xs">Help Text</Label>
        <Input value={block.data.helpText ?? ""} onChange={(e) => update("helpText", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Submit Button Label</Label>
        <Input value={block.data.submitLabel ?? ""} onChange={(e) => update("submitLabel", e.target.value)} className="h-8 text-xs mt-1" placeholder="Check Status" />
      </div>
      <div>
        <Label className="text-xs">Accent Color</Label>
        <ColorPicker value={block.data.accentColor ?? "#2563eb"} onChange={(v) => update("accentColor", v)} className="mt-0.5" />
      </div>
    </div>
  );
}

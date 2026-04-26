"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { SpacerBlockProps } from "@/types/cms";

export function SpacerSettings({ block }: { block: SpacerBlockProps }) {
  const { updateBlock } = useBuilderStore();
  return (
    <div className="space-y-2">
      <Label className="text-xs">Height (px)</Label>
      <Input type="number" value={block.data.height} onChange={(e) => updateBlock(block.id, { data: { height: Number(e.target.value) } })} className="h-8 text-xs" min={0} />
    </div>
  );
}

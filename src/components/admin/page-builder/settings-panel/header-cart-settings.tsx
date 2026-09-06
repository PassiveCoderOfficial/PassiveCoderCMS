"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { HeaderCartBlockProps } from "@/types/cms";

export function HeaderCartSettings({ block }: { block: HeaderCartBlockProps }) {
  const { updateBlock } = useBuilderStore();
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">Show &quot;Cart&quot; label</Label>
      <Switch
        checked={!!block.data.showLabel}
        onCheckedChange={(v) => updateBlock(block.id, { data: { ...block.data, showLabel: v } })}
      />
    </div>
  );
}

"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { HeaderCartBlockProps } from "@/types/cms";
import { UiTextFields } from "./ui-text-fields";

export function HeaderCartSettings({ block }: { block: HeaderCartBlockProps }) {
  const { updateBlock } = useBuilderStore();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">Show text beside the icon</Label>
        <Switch
          checked={!!block.data.showLabel}
          onCheckedChange={(v) => updateBlock(block.id, { data: { ...block.data, showLabel: v } })}
        />
      </div>
      <UiTextFields block={block} title="Text" open />
    </div>
  );
}

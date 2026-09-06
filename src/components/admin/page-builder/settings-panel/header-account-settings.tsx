"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { HeaderAccountBlockProps } from "@/types/cms";

export function HeaderAccountSettings({ block }: { block: HeaderAccountBlockProps }) {
  const { updateBlock } = useBuilderStore();
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">Show &quot;Account&quot; / &quot;Sign in&quot; label</Label>
      <Switch
        checked={!!block.data.showLabel}
        onCheckedChange={(v) => updateBlock(block.id, { data: { ...block.data, showLabel: v } })}
      />
    </div>
  );
}

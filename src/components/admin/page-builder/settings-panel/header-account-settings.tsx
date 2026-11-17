"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { HeaderAccountBlockProps } from "@/types/cms";
import { UiTextFields } from "./ui-text-fields";

export function HeaderAccountSettings({ block }: { block: HeaderAccountBlockProps }) {
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
      <p className="text-[10px] text-muted-foreground">Signed-out visitors see the sign-in text, signed-in customers the account text. The editor always shows the signed-out look.</p>
      <UiTextFields block={block} title="Text" open />
    </div>
  );
}

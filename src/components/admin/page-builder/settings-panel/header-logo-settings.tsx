"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import type { HeaderLogoBlockProps } from "@/types/cms";

export function HeaderLogoSettings({ block }: { block: HeaderLogoBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (field: string, value: unknown) => {
    updateBlock(block.id, { data: { ...block.data, [field]: value } });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Logo override (optional)</Label>
        <p className="text-[10px] text-muted-foreground">Leave empty to use your site's uploaded logo automatically.</p>
        <MediaPickerInput compact value={block.data.imageUrl ?? ""} onChange={(url) => update("imageUrl", url)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Height (px)</Label>
        <Input type="number" value={block.data.height ?? 34} onChange={(e) => update("height", Number(e.target.value))} className="h-8 text-xs" min={16} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Link (defaults to home)</Label>
        <Input value={block.data.linkUrl ?? ""} onChange={(e) => update("linkUrl", e.target.value)} className="h-8 text-xs" placeholder="/" />
      </div>
    </div>
  );
}

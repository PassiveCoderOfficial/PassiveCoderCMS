"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { ColorPicker } from "@/components/ui/color-picker";
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
        <p className="text-[10px] text-muted-foreground">Leave empty to use your site&apos;s uploaded logo automatically.</p>
        <MediaPickerInput compact value={block.data.imageUrl ?? ""} onChange={(url) => update("imageUrl", url)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Logo for dark mode (optional)</Label>
        <MediaPickerInput compact value={block.data.imageDarkUrl ?? ""} onChange={(url) => update("imageDarkUrl", url || undefined)} />
      </div>
      {/* The name shows beside an image logo (switch below), on its own when no
          logo exists at all, and is the logo's description for search engines. */}
      <div className="space-y-1.5">
        <Label className="text-xs">Business name</Label>
        <Input value={block.data.text ?? ""} onChange={(e) => update("text", e.target.value)} className="h-8 text-xs" placeholder="Brand" />
        <p className="text-[10px] text-muted-foreground">Shown instead of a logo when none is uploaded, and beside the logo when the switch below is on.</p>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show business name beside logo</Label>
        <Switch checked={!!block.data.showName} onCheckedChange={(v) => update("showName", v)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Name colour (when no logo is uploaded)</Label>
        <ColorPicker value={block.data.textColor ?? ""} onChange={(v) => update("textColor", v)} />
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

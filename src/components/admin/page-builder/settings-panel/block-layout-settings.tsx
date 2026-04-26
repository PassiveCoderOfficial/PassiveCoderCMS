"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import type { Block, BlockBackground } from "@/types/cms";

interface LayoutSettingsProps {
  block: Block;
}

export function BlockLayoutSettings({ block }: LayoutSettingsProps) {
  const { updateBlock } = useBuilderStore();

  const update = (field: string, value: unknown) => {
    updateBlock(block.id, { [field]: value });
  };

  const updatePadding = (side: "top" | "right" | "bottom" | "left", value: number) => {
    updateBlock(block.id, { padding: { ...block.padding, [side]: value } });
  };

  const updateMargin = (side: "top" | "bottom", value: number) => {
    updateBlock(block.id, { margin: { ...block.margin, [side]: value } });
  };

  const updateBg = (field: keyof BlockBackground, value: unknown) => {
    updateBlock(block.id, { background: { ...block.background, [field]: value } });
  };

  return (
    <div className="space-y-5">
      {/* Width */}
      <div className="space-y-1.5">
        <Label className="text-xs">Container Width</Label>
        <Select value={block.width} onValueChange={(v) => update("width", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["full", "wide", "normal", "narrow"].map((w) => (
              <SelectItem key={w} value={w} className="text-xs capitalize">{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Padding */}
      <div className="space-y-1.5">
        <Label className="text-xs">Padding (px)</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <div key={side}>
              <Label className="text-[10px] text-muted-foreground capitalize">{side}</Label>
              <Input
                type="number"
                value={block.padding[side]}
                onChange={(e) => updatePadding(side, Number(e.target.value))}
                className="h-7 text-xs"
                min={0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Margin */}
      <div className="space-y-1.5">
        <Label className="text-xs">Margin (px)</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["top", "bottom"] as const).map((side) => (
            <div key={side}>
              <Label className="text-[10px] text-muted-foreground capitalize">{side}</Label>
              <Input
                type="number"
                value={block.margin[side]}
                onChange={(e) => updateMargin(side, Number(e.target.value))}
                className="h-7 text-xs"
                min={0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Background */}
      <div className="space-y-2">
        <Label className="text-xs">Background</Label>
        <Select value={block.background.type} onValueChange={(v) => updateBg("type", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["none", "color", "gradient", "image"].map((t) => (
              <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {block.background.type === "color" && (
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={block.background.color ?? "#ffffff"}
              onChange={(e) => updateBg("color", e.target.value)}
              className="h-8 w-8 rounded border cursor-pointer"
            />
            <Input
              value={block.background.color ?? "#ffffff"}
              onChange={(e) => updateBg("color", e.target.value)}
              className="h-8 text-xs"
              placeholder="#ffffff"
            />
          </div>
        )}
        {block.background.type === "gradient" && (
          <Input
            value={block.background.gradient ?? ""}
            onChange={(e) => updateBg("gradient", e.target.value)}
            className="h-8 text-xs"
            placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
        )}
        {block.background.type === "image" && (
          <MediaPickerInput
            compact
            value={block.background.imageUrl ?? ""}
            onChange={(url) => updateBg("imageUrl", url)}
          />
        )}
      </div>

      {/* Animation */}
      <div className="space-y-1.5">
        <Label className="text-xs">Animation</Label>
        <Select value={block.animation ?? "none"} onValueChange={(v) => update("animation", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["none", "fade", "slide-up", "slide-left", "zoom"].map((a) => (
              <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

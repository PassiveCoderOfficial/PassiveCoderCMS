"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { ColorPicker } from "@/components/ui/color-picker";
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

  // Gradient was a raw "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  // text field — nobody hand-writes CSS gradient syntax. Parse the existing
  // string into angle + two colors for two color pickers, and always write
  // back a normalized string so both directions round-trip cleanly.
  const gradientMatch = /linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{3,8})[^,]*,\s*(#[0-9a-fA-F]{3,8})/.exec(
    block.background.gradient ?? "",
  );
  const gradientAngle = gradientMatch ? Number(gradientMatch[1]) : 135;
  const gradientFrom = gradientMatch?.[2] ?? "#667eea";
  const gradientTo = gradientMatch?.[3] ?? "#764ba2";
  const setGradient = (angle: number, from: string, to: string) => {
    updateBg("gradient", `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`);
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
        <Select
          value={block.background.type}
          onValueChange={(v) => {
            const needsDefaultGradient = v === "gradient" && !block.background.gradient;
            updateBlock(block.id, {
              background: {
                ...block.background,
                type: v as BlockBackground["type"],
                ...(needsDefaultGradient
                  ? { gradient: `linear-gradient(${gradientAngle}deg, ${gradientFrom} 0%, ${gradientTo} 100%)` }
                  : {}),
              },
            });
          }}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["none", "color", "gradient", "image"].map((t) => (
              <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {block.background.type === "color" && (
          <ColorPicker value={block.background.color ?? "#ffffff"} onChange={(v) => updateBg("color", v)} />
        )}
        {block.background.type === "gradient" && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">From</Label>
                <ColorPicker value={gradientFrom} onChange={(v) => setGradient(gradientAngle, v, gradientTo)} className="mt-0.5" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">To</Label>
                <ColorPicker value={gradientTo} onChange={(v) => setGradient(gradientAngle, gradientFrom, v)} className="mt-0.5" />
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Angle ({gradientAngle}°)</Label>
              <Input
                type="range"
                min={0}
                max={360}
                step={5}
                value={gradientAngle}
                onChange={(e) => setGradient(Number(e.target.value), gradientFrom, gradientTo)}
                className="h-8"
              />
            </div>
          </div>
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

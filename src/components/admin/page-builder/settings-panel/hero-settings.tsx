"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { ColorPicker } from "@/components/ui/color-picker";
import type { HeroBlockProps } from "@/types/cms";

export function HeroSettings({ block }: { block: HeroBlockProps }) {
  const { updateBlock } = useBuilderStore();

  const update = (field: string, value: unknown) => {
    updateBlock(block.id, { data: { ...block.data, [field]: value } });
  };

  // "fullscreen-overlay" renders its photo as the whole section's background
  // (painted by the shared BlockRenderer wrapper via block.background so it
  // covers padding too — see block-utils.ts getBlockBackground()), not as an
  // inline content image. Keep block.background in sync here so picking a
  // photo from this Content tab actually shows up section-wide.
  const isFullscreen = block.templateVariant === "fullscreen-overlay";
  const updateImage = (url: string) => {
    if (isFullscreen) {
      updateBlock(block.id, {
        data: { ...block.data, imageUrl: url },
        background: { ...block.background, type: "image", imageUrl: url },
      });
    } else {
      update("imageUrl", url);
    }
  };

  // "centered-bold" and "corporate" are single-column, always-centered
  // designs by intent (no image split, no side-pinned text) — Layout has
  // nothing to control there, so hide it instead of showing a dropdown that
  // silently does nothing when changed.
  const layoutApplies = !["centered-bold", "corporate"].includes(block.templateVariant ?? "");

  return (
    <div className="space-y-4">
      {layoutApplies && (
        <div className="space-y-1.5">
          <Label className="text-xs">Layout</Label>
          <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["centered", "left", "right", "split"].map((l) => (
                <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <FieldGroup label="Badge text">
        <Input value={block.data.badge ?? ""} onChange={(e) => update("badge", e.target.value)} className="h-8 text-xs" placeholder="Optional badge" />
      </FieldGroup>

      <FieldGroup label="Title">
        <Input value={block.data.title} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs" />
      </FieldGroup>

      <FieldGroup label="Subtitle">
        <Input value={block.data.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs" />
      </FieldGroup>

      <FieldGroup label="Description">
        <Textarea value={block.data.description ?? ""} onChange={(e) => update("description", e.target.value)} className="text-xs resize-none" rows={3} />
      </FieldGroup>

      <FieldGroup label="Image">
        <MediaPickerInput compact value={block.data.imageUrl ?? ""} onChange={updateImage} />
      </FieldGroup>

    </div>
  );
}

export function HeroStyleSettings({ block }: { block: HeroBlockProps }) {
  const { updateBlock } = useBuilderStore();

  const update = (field: string, value: unknown) => {
    updateBlock(block.id, { data: { ...block.data, [field]: value } });
  };

  const updateTypo = (field: string, value: string) => {
    updateBlock(block.id, { data: { ...block.data, typography: { ...block.data.typography, [field]: value } } });
  };

  const updateButton = (btn: "primaryButton" | "secondaryButton", field: string, value: string) => {
    const existing = block.data[btn] ?? { label: "", url: "", variant: "primary" };
    updateBlock(block.id, { data: { ...block.data, [btn]: { ...existing, [field]: value } } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Badge Style</p>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Background" value={block.data.badgeBgColor ?? "#ffffff"} onChange={(v) => update("badgeBgColor", v)} />
          <ColorField label="Text Color" value={block.data.badgeTextColor ?? "#000000"} onChange={(v) => update("badgeTextColor", v)} />
        </div>
        {(block.data.badgeBgColor || block.data.badgeTextColor) && (
          <button onClick={() => { update("badgeBgColor", ""); update("badgeTextColor", ""); }} className="text-[11px] text-muted-foreground underline">Use theme default instead</button>
        )}
      </div>

      <div className="pt-1 border-t space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Section Overlay</p>
        <p className="text-[10px] text-muted-foreground">Tints the whole section — covers the background image set in the Layout tab. Set a color to apply it.</p>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Overlay Color" value={block.data.overlayColor ?? "#000000"} onChange={(v) => update("overlayColor", v)} />
          <ColorField label="Gradient To (optional)" value={block.data.overlayColorTo || block.data.overlayColor || "#000000"} onChange={(v) => update("overlayColorTo", v)} />
        </div>
        {block.data.overlayColorTo && (
          <button onClick={() => update("overlayColorTo", "")} className="text-[11px] text-muted-foreground underline">Clear gradient</button>
        )}
        <FieldGroup label={`Overlay Opacity (${Math.round((block.data.overlayOpacity ?? 0.55) * 100)}%)`}>
          <Input type="range" min={0} max={1} step={0.05} value={block.data.overlayOpacity ?? 0.55}
            onChange={(e) => update("overlayOpacity", parseFloat(e.target.value))} className="h-8" />
        </FieldGroup>
      </div>

      <div className="pt-1 border-t">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Primary Button</p>
        <div className="space-y-1.5">
          <Input value={block.data.primaryButton?.label ?? ""} onChange={(e) => updateButton("primaryButton", "label", e.target.value)} className="h-7 text-xs" placeholder="Label" />
          <Input value={block.data.primaryButton?.url ?? ""} onChange={(e) => updateButton("primaryButton", "url", e.target.value)} className="h-7 text-xs" placeholder="URL" />
          <div className="grid grid-cols-2 gap-1.5">
            <ColorPicker value={block.data.primaryButton?.bgColor || "#ffffff"} onChange={(v) => updateButton("primaryButton", "bgColor", v)} className="h-7" />
            <ColorPicker value={block.data.primaryButton?.textColor || "#000000"} onChange={(v) => updateButton("primaryButton", "textColor", v)} className="h-7" />
          </div>
          {block.data.primaryButton?.bgColor && (
            <button onClick={() => { updateButton("primaryButton", "bgColor", ""); updateButton("primaryButton", "textColor", ""); }} className="text-[11px] text-muted-foreground underline">Use theme default instead</button>
          )}
        </div>
      </div>

      <div className="pt-1 border-t">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Secondary Button</p>
        <div className="space-y-1.5">
          <Input value={block.data.secondaryButton?.label ?? ""} onChange={(e) => updateButton("secondaryButton", "label", e.target.value)} className="h-7 text-xs" placeholder="Label" />
          <Input value={block.data.secondaryButton?.url ?? ""} onChange={(e) => updateButton("secondaryButton", "url", e.target.value)} className="h-7 text-xs" placeholder="URL" />
          <div className="grid grid-cols-2 gap-1.5">
            <ColorPicker value={block.data.secondaryButton?.bgColor || "#00000000"} onChange={(v) => updateButton("secondaryButton", "bgColor", v)} className="h-7" />
            <ColorPicker value={block.data.secondaryButton?.textColor || "#ffffff"} onChange={(v) => updateButton("secondaryButton", "textColor", v)} className="h-7" />
          </div>
          {block.data.secondaryButton?.bgColor && (
            <button onClick={() => { updateButton("secondaryButton", "bgColor", ""); updateButton("secondaryButton", "textColor", ""); }} className="text-[11px] text-muted-foreground underline">Use theme default instead</button>
          )}
        </div>
      </div>

      <div className="pt-1 border-t">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Typography</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">Title Size</Label>
            <Select value={block.data.typography.titleSize} onValueChange={(v) => updateTypo("titleSize", v)}>
              <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["3xl","4xl","5xl","6xl","7xl"].map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <ColorField label="Title Color" value={block.data.typography.titleColor} onChange={(v) => updateTypo("titleColor", v)} />
          <ColorField label="Subtitle Color" value={block.data.typography.subtitleColor} onChange={(v) => updateTypo("subtitleColor", v)} />
          <ColorField label="Description Color" value={block.data.typography.descColor} onChange={(v) => updateTypo("descColor", v)} />
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <ColorPicker value={value} onChange={onChange} className="h-7 mt-0.5" />
    </div>
  );
}

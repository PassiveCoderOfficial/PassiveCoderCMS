"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import type { HeroBlockProps } from "@/types/cms";

export function HeroSettings({ block }: { block: HeroBlockProps }) {
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
        <MediaPickerInput compact value={block.data.imageUrl ?? ""} onChange={(url) => update("imageUrl", url)} />
      </FieldGroup>

      {block.data.imageUrl && (
        <div className="pt-1 border-t space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Image Overlay</p>
          <p className="text-[10px] text-muted-foreground">Only used by the fullscreen-overlay layout.</p>
          <div className="grid grid-cols-2 gap-2">
            <FieldGroup label="Overlay Color">
              <Input type="color" value={block.data.overlayColor ?? "#000000"} onChange={(e) => update("overlayColor", e.target.value)} className="h-8 p-1" />
            </FieldGroup>
            <FieldGroup label="Gradient To (optional)">
              <Input type="color" value={block.data.overlayColorTo || block.data.overlayColor || "#000000"} onChange={(e) => update("overlayColorTo", e.target.value)} className="h-8 p-1" />
            </FieldGroup>
          </div>
          {block.data.overlayColorTo && (
            <button onClick={() => update("overlayColorTo", "")} className="text-[11px] text-muted-foreground underline">Clear gradient</button>
          )}
          <FieldGroup label={`Overlay Opacity (${Math.round((block.data.overlayOpacity ?? 0.55) * 100)}%)`}>
            <Input type="range" min={0} max={1} step={0.05} value={block.data.overlayOpacity ?? 0.55}
              onChange={(e) => update("overlayOpacity", parseFloat(e.target.value))} className="h-8" />
          </FieldGroup>
        </div>
      )}

      <div className="pt-1 border-t">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Primary Button</p>
        <div className="space-y-1.5">
          <Input value={block.data.primaryButton?.label ?? ""} onChange={(e) => updateButton("primaryButton", "label", e.target.value)} className="h-7 text-xs" placeholder="Label" />
          <Input value={block.data.primaryButton?.url ?? ""} onChange={(e) => updateButton("primaryButton", "url", e.target.value)} className="h-7 text-xs" placeholder="URL" />
        </div>
      </div>

      <div className="pt-1 border-t">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Secondary Button</p>
        <div className="space-y-1.5">
          <Input value={block.data.secondaryButton?.label ?? ""} onChange={(e) => updateButton("secondaryButton", "label", e.target.value)} className="h-7 text-xs" placeholder="Label" />
          <Input value={block.data.secondaryButton?.url ?? ""} onChange={(e) => updateButton("secondaryButton", "url", e.target.value)} className="h-7 text-xs" placeholder="URL" />
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
      <div className="flex gap-2 items-center mt-0.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-7 rounded border cursor-pointer" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-7 text-xs" />
      </div>
    </div>
  );
}

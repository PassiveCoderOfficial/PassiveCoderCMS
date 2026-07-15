"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import type { NavigationBlockProps } from "@/types/cms";

export function NavigationSettings({ block }: { block: NavigationBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const updateItem = (id: string, f: string, v: string) => {
    update("items", block.data.items.map((it) => it.id === id ? { ...it, [f]: v } : it));
  };

  const addItem = () => {
    update("items", [...block.data.items, { id: generateId(), label: "New Link", url: "#" }]);
  };

  const removeItem = (id: string) => {
    update("items", block.data.items.filter((it) => it.id !== id));
  };

  const PRESETS: Array<{ label: string; bg: string; gradientTo?: string; fg: string; accent: string }> = [
    { label: "Forest", bg: "#1a5c38", fg: "#ffffff", accent: "#c9a84c" },
    { label: "Blood Red", bg: "#b91c1c", gradientTo: "#dc2626", fg: "#ffffff", accent: "#fecaca" },
    { label: "Midnight", bg: "#0f172a", fg: "#e2e8f0", accent: "#60a5fa" },
    { label: "Clean White", bg: "#ffffff", fg: "#111827", accent: "#dc2626" },
    { label: "Ocean", bg: "#0369a1", gradientTo: "#0ea5e9", fg: "#ffffff", accent: "#facc15" },
  ];

  function applyPreset(p: typeof PRESETS[number]) {
    updateBlock(block.id, {
      data: {
        ...block.data,
        backgroundColor: p.bg,
        backgroundGradientTo: p.gradientTo ?? "",
        textColor: p.fg,
        activeColor: p.accent,
      },
    });
  }

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Logo Text</Label><Input value={block.data.logoText ?? ""} onChange={(e) => update("logoText", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Logo Image</Label><MediaPickerInput compact value={block.data.logo ?? ""} onChange={(url) => update("logo", url)} className="mt-1" /></div>
      <div><Label className="text-xs">Logo Height (px)</Label><Input type="number" min={24} max={80} value={block.data.logoHeight ?? 40} onChange={(e) => update("logoHeight", parseInt(e.target.value, 10) || 40)} className="h-8 text-xs mt-1" /></div>
      <div>
        <Label className="text-xs">Style</Label>
        <Select value={block.data.style} onValueChange={(v) => update("style", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["default","centered","split","minimal"].map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="border-t pt-3">
        <Label className="text-xs font-semibold">Color Presets</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] hover:border-primary transition-colors"
              style={{ background: p.gradientTo ? `linear-gradient(to right, ${p.bg}, ${p.gradientTo})` : p.bg, color: p.fg }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">Background</Label><Input type="color" value={block.data.backgroundColor ?? "#1a5c38"} onChange={(e) => update("backgroundColor", e.target.value)} className="h-8 mt-1 p-1" /></div>
          <div><Label className="text-xs">Gradient To (optional)</Label><Input type="color" value={block.data.backgroundGradientTo || block.data.backgroundColor || "#1a5c38"} onChange={(e) => update("backgroundGradientTo", e.target.value)} className="h-8 mt-1 p-1" /></div>
        </div>
        {block.data.backgroundGradientTo && (
          <button onClick={() => update("backgroundGradientTo", "")} className="text-[11px] text-muted-foreground underline">Clear gradient</button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">Text Color</Label><Input type="color" value={block.data.textColor ?? "#ffffff"} onChange={(e) => update("textColor", e.target.value)} className="h-8 mt-1 p-1" /></div>
          <div><Label className="text-xs">Active Link Color</Label><Input type="color" value={block.data.activeColor ?? block.data.textColor ?? "#ffffff"} onChange={(e) => update("activeColor", e.target.value)} className="h-8 mt-1 p-1" /></div>
        </div>
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between"><Label className="text-xs">Sticky</Label><Switch checked={block.data.sticky} onCheckedChange={(v) => update("sticky", v)} /></div>
        <div className="flex items-center justify-between"><Label className="text-xs">Transparent</Label><Switch checked={!!block.data.transparent} onCheckedChange={(v) => update("transparent", v)} /></div>
        <div className="flex items-center justify-between"><Label className="text-xs">Shadow</Label><Switch checked={!!block.data.shadow} onCheckedChange={(v) => update("shadow", v)} /></div>
        <div className="flex items-center justify-between"><Label className="text-xs">Bottom Border</Label><Switch checked={!!block.data.borderBottom} onCheckedChange={(v) => update("borderBottom", v)} /></div>
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between"><Label className="text-xs">Show CTA Button</Label><Switch checked={!!block.data.showCta} onCheckedChange={(v) => update("showCta", v)} /></div>
        {block.data.showCta && (
          <>
            <div><Label className="text-xs">CTA Label</Label><Input value={block.data.ctaLabel ?? ""} onChange={(e) => update("ctaLabel", e.target.value)} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">CTA URL</Label><Input value={block.data.ctaUrl ?? ""} onChange={(e) => update("ctaUrl", e.target.value)} className="h-8 text-xs mt-1" /></div>
            <div>
              <Label className="text-xs">CTA Style</Label>
              <Select value={block.data.ctaStyle ?? "solid"} onValueChange={(v) => update("ctaStyle", v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid" className="text-xs">Solid</SelectItem>
                  <SelectItem value="outline" className="text-xs">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">Nav Items ({block.data.items.length})</Label>
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add</Button>
        </div>
        <div className="space-y-2">
          {block.data.items.map((item, i) => (
            <div key={item.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
              <Input value={item.label} onChange={(e) => updateItem(item.id, "label", e.target.value)} className="h-7 text-xs" placeholder="Label" />
              <Input value={item.url} onChange={(e) => updateItem(item.id, "url", e.target.value)} className="h-7 text-xs" placeholder="URL" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

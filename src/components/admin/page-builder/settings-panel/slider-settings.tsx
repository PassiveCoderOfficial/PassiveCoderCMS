"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { generateId } from "@/lib/utils";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import type { SliderBlockProps } from "@/types/cms";
import { InlineLeadFormSettings } from "./lead-form-settings";
import { ColorPicker } from "@/components/ui/color-picker";

export function SliderSettings({ block }: { block: SliderBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (field: string, value: unknown) =>
    updateBlock(block.id, { data: { ...block.data, [field]: value } });

  const updateSlide = (slideId: string, field: string, value: unknown) => {
    update("slides", block.data.slides.map((s) => s.id === slideId ? { ...s, [field]: value } : s));
  };

  const addSlide = () => {
    update("slides", [...block.data.slides, { id: generateId(), title: "New Slide", subtitle: "", imageUrl: "", buttonLabel: "Learn More", buttonUrl: "#", overlay: true }]);
  };

  // Reorder: drag a slide card onto another, or use the arrows.
  const [dragId, setDragId] = React.useState<string | null>(null);
  const moveTo = (from: number, to: number) => {
    if (to < 0 || to >= block.data.slides.length || from === to) return;
    const next = [...block.data.slides];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    update("slides", next);
  };

  const removeSlide = (id: string) => {
    update("slides", block.data.slides.filter((s) => s.id !== id));
  };

  // Split and Minimal draw the copy on their own panel / caption bar in fixed
  // colours and button styles; the per-slide text colour and the button look
  // only apply to the centred and left-copy designs.
  const copyOverPhoto = !["split", "minimal"].includes(block.templateVariant ?? "");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Slider Height</Label>
        <Input value={block.data.height} onChange={(e) => update("height", e.target.value)} className="h-8 text-xs" placeholder="600px" />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Height on phones</Label>
        <Input value={block.data.mobileHeight ?? ""} onChange={(e) => update("mobileHeight", e.target.value || undefined)} className="h-8 text-xs" placeholder="Same as above" />
      </div>
      {copyOverPhoto && (
        <div className="space-y-2">
          <Label className="text-xs">Button style</Label>
          <select value={block.data.buttonStyle ?? "white"} onChange={(e) => update("buttonStyle", e.target.value)} className="w-full h-8 text-xs rounded-md border bg-background px-2">
            <option value="white">White</option><option value="primary">Brand colour</option>
          </select>
        </div>
      )}
      {block.templateVariant === "split" ? (
        <InlineLeadFormSettings value={block.data.leadForm} onChange={(v) => update("leadForm", v)} />
      ) : (
        <p className="text-[10px] text-muted-foreground rounded-lg border p-2">Want an enquiry form in this banner? Switch the style to <b>Split</b> (photo one side, text the other) on the Style tab.</p>
      )}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Auto Play</Label>
        <Switch checked={block.data.autoPlay} onCheckedChange={(v) => update("autoPlay", v)} />
      </div>
      {block.data.autoPlay && (
        <div className="space-y-2">
          <Label className="text-xs">Seconds per slide</Label>
          <select value={String(Math.round((block.data.autoPlayInterval ?? 5000) / 1000))} onChange={(e) => update("autoPlayInterval", Number(e.target.value) * 1000)} className="w-full h-8 text-xs rounded-md border bg-background px-2">
            {[2, 3, 4, 5, 6, 7, 8, 10, 12, 15].map((n) => <option key={n} value={n}>{n} seconds</option>)}
            {![2, 3, 4, 5, 6, 7, 8, 10, 12, 15].includes(Math.round((block.data.autoPlayInterval ?? 5000) / 1000)) && (
              <option value={Math.round((block.data.autoPlayInterval ?? 5000) / 1000)}>{Math.round((block.data.autoPlayInterval ?? 5000) / 1000)} seconds</option>
            )}
          </select>
        </div>
      )}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Arrows</Label>
        <Switch checked={block.data.showArrows} onCheckedChange={(v) => update("showArrows", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Dots</Label>
        <Switch checked={block.data.showDots} onCheckedChange={(v) => update("showDots", v)} />
      </div>
      {block.data.showDots && (
        <div className="space-y-1">
          <Label className="text-xs">Dot colour</Label>
          <div className="flex items-center gap-2">
            <ColorPicker value={block.data.dotColor ?? ""} onChange={(v) => update("dotColor", v || undefined)} className="flex-1" />
            {block.data.dotColor && <button type="button" onClick={() => update("dotColor", undefined)} className="text-[11px] text-muted-foreground underline shrink-0">Reset</button>}
          </div>
        </div>
      )}

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">Slides ({block.data.slides.length})</Label>
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={addSlide}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {block.data.slides.map((slide, i) => (
            <div key={slide.id}
              draggable
              onDragStart={(e) => { setDragId(slide.id); e.dataTransfer.effectAllowed = "move"; }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
              onDrop={(e) => { e.preventDefault(); const from = block.data.slides.findIndex((x) => x.id === dragId); moveTo(from, i); setDragId(null); }}
              onDragEnd={() => setDragId(null)}
              className={`border rounded-lg p-3 space-y-2 bg-muted/20 ${dragId === slide.id ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-medium cursor-grab active:cursor-grabbing"><GripVertical className="h-3.5 w-3.5 text-muted-foreground" />Slide {i + 1}</span>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === 0} onClick={() => moveTo(i, i - 1)} aria-label="Move up"><ChevronUp className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === block.data.slides.length - 1} onClick={() => moveTo(i, i + 1)} aria-label="Move down"><ChevronDown className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeSlide(slide.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
              <Input value={slide.title} onChange={(e) => updateSlide(slide.id, "title", e.target.value)} className="h-7 text-xs" placeholder="Title" />
              <Input value={slide.subtitle ?? ""} onChange={(e) => updateSlide(slide.id, "subtitle", e.target.value)} className="h-7 text-xs" placeholder="Subtitle" />
              <MediaPickerInput compact value={slide.imageUrl ?? ""} onChange={(url) => updateSlide(slide.id, "imageUrl", url)} focus={slide.imageFocus} onFocusChange={(f) => updateSlide(slide.id, "imageFocus", f)} />
              <Input value={slide.buttonLabel ?? ""} onChange={(e) => updateSlide(slide.id, "buttonLabel", e.target.value)} className="h-7 text-xs" placeholder="Button Label" />
              <Input value={slide.buttonUrl ?? ""} onChange={(e) => updateSlide(slide.id, "buttonUrl", e.target.value)} className="h-7 text-xs" placeholder="Button URL" />
              <Input value={slide.linkUrl ?? ""} onChange={(e) => updateSlide(slide.id, "linkUrl", e.target.value)} className="h-7 text-xs" placeholder="Whole-slide link (image-only slides)" />
              {slide.linkUrl && (
                <Input value={slide.description ?? ""} onChange={(e) => updateSlide(slide.id, "description", e.target.value || undefined)} className="h-7 text-xs" placeholder="Link description for screen readers (default: View)" />
              )}
              {copyOverPhoto && (
                <Input value={slide.textColor ?? ""} onChange={(e) => updateSlide(slide.id, "textColor", e.target.value)} className="h-7 text-xs" placeholder="Text colour (e.g. #202020; default white)" />
              )}
              <label className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={slide.overlay ?? false} onChange={(e) => updateSlide(slide.id, "overlay", e.target.checked)} /> Darken photo</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

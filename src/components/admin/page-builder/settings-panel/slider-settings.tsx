"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import type { SliderBlockProps } from "@/types/cms";

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

  const removeSlide = (id: string) => {
    update("slides", block.data.slides.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Slider Height</Label>
        <Input value={block.data.height} onChange={(e) => update("height", e.target.value)} className="h-8 text-xs" placeholder="600px" />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Auto Play</Label>
        <Switch checked={block.data.autoPlay} onCheckedChange={(v) => update("autoPlay", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Arrows</Label>
        <Switch checked={block.data.showArrows} onCheckedChange={(v) => update("showArrows", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Dots</Label>
        <Switch checked={block.data.showDots} onCheckedChange={(v) => update("showDots", v)} />
      </div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">Slides ({block.data.slides.length})</Label>
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={addSlide}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {block.data.slides.map((slide, i) => (
            <div key={slide.id} className="border rounded-lg p-3 space-y-2 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Slide {i + 1}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeSlide(slide.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              <Input value={slide.title} onChange={(e) => updateSlide(slide.id, "title", e.target.value)} className="h-7 text-xs" placeholder="Title" />
              <Input value={slide.subtitle ?? ""} onChange={(e) => updateSlide(slide.id, "subtitle", e.target.value)} className="h-7 text-xs" placeholder="Subtitle" />
              <MediaPickerInput compact value={slide.imageUrl ?? ""} onChange={(url) => updateSlide(slide.id, "imageUrl", url)} />
              <Input value={slide.buttonLabel ?? ""} onChange={(e) => updateSlide(slide.id, "buttonLabel", e.target.value)} className="h-7 text-xs" placeholder="Button Label" />
              <Input value={slide.buttonUrl ?? ""} onChange={(e) => updateSlide(slide.id, "buttonUrl", e.target.value)} className="h-7 text-xs" placeholder="Button URL" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

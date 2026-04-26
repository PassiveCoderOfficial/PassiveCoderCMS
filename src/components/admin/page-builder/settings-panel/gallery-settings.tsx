"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import type { GalleryBlockProps } from "@/types/cms";

export function GallerySettings({ block }: { block: GalleryBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (field: string, value: unknown) =>
    updateBlock(block.id, { data: { ...block.data, [field]: value } });

  const addImage = () => {
    update("images", [...block.data.images, { id: generateId(), url: "", alt: "", caption: "" }]);
  };

  const updateImage = (id: string, field: string, value: string) => {
    update("images", block.data.images.map((img) => img.id === id ? { ...img, [field]: value } : img));
  };

  const removeImage = (id: string) => {
    update("images", block.data.images.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["grid","masonry","carousel","justified"].map((l) => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Columns</Label>
        <Select value={String(block.data.columns)} onValueChange={(v) => update("columns", Number(v))}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["2","3","4","5","6"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between"><Label className="text-xs">Lightbox</Label><Switch checked={block.data.lightbox} onCheckedChange={(v) => update("lightbox", v)} /></div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">Images ({block.data.images.length})</Label>
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={addImage}><Plus className="h-3 w-3 mr-1" /> Add</Button>
        </div>
        <div className="space-y-2">
          {block.data.images.map((img, i) => (
            <div key={img.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">#{i + 1}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeImage(img.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
              <MediaPickerInput compact value={img.url} onChange={(url) => updateImage(img.id, "url", url)} />
              <Input value={img.alt ?? ""} onChange={(e) => updateImage(img.id, "alt", e.target.value)} className="h-7 text-xs" placeholder="Alt text" />
              <Input value={img.caption ?? ""} onChange={(e) => updateImage(img.id, "caption", e.target.value)} className="h-7 text-xs" placeholder="Caption (optional)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

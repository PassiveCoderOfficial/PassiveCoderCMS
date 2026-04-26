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

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Logo Text</Label><Input value={block.data.logoText ?? ""} onChange={(e) => update("logoText", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Logo Image</Label><MediaPickerInput compact value={block.data.logo ?? ""} onChange={(url) => update("logo", url)} className="mt-1" /></div>
      <div>
        <Label className="text-xs">Style</Label>
        <Select value={block.data.style} onValueChange={(v) => update("style", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["default","centered","split","minimal"].map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between"><Label className="text-xs">Sticky</Label><Switch checked={block.data.sticky} onCheckedChange={(v) => update("sticky", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Show CTA Button</Label><Switch checked={!!block.data.showCta} onCheckedChange={(v) => update("showCta", v)} /></div>
      {block.data.showCta && (
        <>
          <div><Label className="text-xs">CTA Label</Label><Input value={block.data.ctaLabel ?? ""} onChange={(e) => update("ctaLabel", e.target.value)} className="h-8 text-xs mt-1" /></div>
          <div><Label className="text-xs">CTA URL</Label><Input value={block.data.ctaUrl ?? ""} onChange={(e) => update("ctaUrl", e.target.value)} className="h-8 text-xs mt-1" /></div>
        </>
      )}

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

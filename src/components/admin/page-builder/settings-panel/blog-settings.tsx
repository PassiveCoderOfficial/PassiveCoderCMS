"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { BlogBlockProps } from "@/types/cms";

export function BlogSettings({ block }: { block: BlogBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (field: string, value: unknown) =>
    updateBlock(block.id, { data: { ...block.data, [field]: value } });

  const toggles = [
    { key: "showExcerpt", label: "Show Excerpt" },
    { key: "showDate", label: "Show Date" },
    { key: "showAuthor", label: "Show Author" },
    { key: "showCategory", label: "Show Category" },
    { key: "showReadMore", label: "Show Read More" },
  ] as const;

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Section Title</Label><Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Display Count</Label><Input type="number" value={block.data.displayCount} onChange={(e) => update("displayCount", Number(e.target.value))} className="h-8 text-xs mt-1" min={1} max={12} /></div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["grid","list","featured","masonry"].map((l) => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Columns</Label>
        <Select value={String(block.data.columns)} onValueChange={(v) => update("columns", Number(v))}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["2","3","4"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">View All URL</Label><Input value={block.data.viewAllUrl ?? ""} onChange={(e) => update("viewAllUrl", e.target.value)} className="h-8 text-xs mt-1" placeholder="/blog" /></div>
      {toggles.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between">
          <Label className="text-xs">{label}</Label>
          <Switch checked={block.data[key]} onCheckedChange={(v) => update(key, v)} />
        </div>
      ))}
    </div>
  );
}

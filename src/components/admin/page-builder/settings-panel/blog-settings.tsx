"use client";

import React from "react";
import Link from "next/link";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ExternalLink } from "lucide-react";
import type { BlogBlockProps } from "@/types/cms";

export function BlogSettings({ block }: { block: BlogBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (field: string, value: unknown) =>
    updateBlock(block.id, { data: { ...block.data, [field]: value } });

  // Show author / Show category were never drawn by the block, so they are not offered.
  const toggles = [
    { key: "showExcerpt", label: "Show Excerpt" },
    { key: "showDate", label: "Show Date" },
    { key: "showReadMore", label: "Show Read More" },
  ] as const;
  const list = block.data.layout === "list";
  // Only Grid and List are drawn; older blocks saved "featured" / "masonry", which show as Grid.
  const layouts = ["grid", "list", ...(["grid", "list"].includes(block.data.layout) ? [] : [block.data.layout])];

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Section Title</Label><Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Small line above the title</Label><Input value={block.data.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <p className="text-[10px] text-muted-foreground">
        Posts show automatically, newest first. Their titles, excerpts and photos are edited in{" "}
        <Link href="/dashboard/posts" target="_blank" className="inline-flex items-center gap-0.5 text-primary underline">Dashboard &gt; Posts<ExternalLink className="h-2.5 w-2.5" /></Link>.
      </p>
      <div><Label className="text-xs">Display Count</Label><Input type="number" value={block.data.displayCount} onChange={(e) => update("displayCount", Number(e.target.value))} className="h-8 text-xs mt-1" min={1} max={12} /></div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{layouts.map((l) => <SelectItem key={l} value={l} className="text-xs capitalize">{l === "grid" || l === "list" ? l : `${l} (shows as grid)`}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {!list && (
        <div>
          <Label className="text-xs">Columns</Label>
          <Select value={String(block.data.columns)} onValueChange={(v) => update("columns", Number(v))}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{["2","3","4"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">View All button</Label><Input value={block.data.viewAllLabel ?? ""} onChange={(e) => update("viewAllLabel", e.target.value || undefined)} className="h-8 text-xs mt-1" placeholder="View All" /></div>
        <div><Label className="text-xs">View All link</Label><Input value={block.data.viewAllUrl ?? ""} onChange={(e) => update("viewAllUrl", e.target.value)} className="h-8 text-xs mt-1" placeholder="/blog" /></div>
      </div>
      {toggles.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between">
          <Label className="text-xs">{label}</Label>
          <Switch checked={block.data[key]} onCheckedChange={(v) => update(key, v)} />
        </div>
      ))}
      {block.data.showReadMore && (
        <div><Label className="text-xs">Read More text</Label><Input value={block.data.readMoreLabel ?? ""} onChange={(e) => update("readMoreLabel", e.target.value || undefined)} className="h-8 text-xs mt-1" placeholder="Read More" /></div>
      )}
      <div><Label className="text-xs">Text when there are no posts</Label><Input value={block.data.emptyText ?? ""} onChange={(e) => update("emptyText", e.target.value || undefined)} className="h-8 text-xs mt-1" placeholder="No posts published yet." /></div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { generateId } from "@/lib/utils";
import { ContentPicker } from "@/components/admin/content-picker";
import type { ItemBoxBlockProps, ItemBoxSource } from "@/types/cms";

interface GroupOption {
  id: string;
  name: string;
}

const GROUP_ENDPOINT: Partial<Record<ItemBoxSource, string>> = {
  services: "/api/services",
  features: "/api/features",
  portfolio: "/api/portfolio",
  testimonials: "/api/testimonials",
};

const SOURCE_LABELS: Record<ItemBoxSource, string> = {
  inline: "Inline (manual)",
  services: "Services",
  features: "Features",
  portfolio: "Portfolio",
  testimonials: "Testimonials",
  blog: "Blog Posts",
  pages: "Pages",
};

// Where "Manage X" / "Add New" jumps to for each non-inline source — the
// dashboard section that actually owns that content.
const MANAGE_LINK: Partial<Record<ItemBoxSource, { href: string; label: string }>> = {
  services: { href: "/dashboard/services", label: "Manage Service Groups" },
  features: { href: "/dashboard/features", label: "Manage Feature Groups" },
  portfolio: { href: "/dashboard/portfolio", label: "Manage Portfolio Groups" },
  testimonials: { href: "/dashboard/testimonials", label: "Manage Testimonial Groups" },
  blog: { href: "/dashboard/posts/new", label: "Add New Post" },
  pages: { href: "/dashboard/pages/new", label: "Add New Page" },
};

export function ItemBoxSettings({ block }: { block: ItemBoxBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (field: string, value: unknown) =>
    updateBlock(block.id, { data: { ...block.data, [field]: value } });

  const source = block.data.source ?? "inline";
  const groupEndpoint = GROUP_ENDPOINT[source];
  const [groups, setGroups] = useState<GroupOption[]>([]);

  useEffect(() => {
    if (!groupEndpoint) return;
    fetch(groupEndpoint)
      .then((r) => r.json())
      .then((data) => setGroups(Array.isArray(data) ? data.map((g) => ({ id: g.id, name: g.name })) : []))
      .catch(() => setGroups([]));
  }, [groupEndpoint]);

  const updateItem = (itemId: string, field: string, value: unknown) => {
    update("items", block.data.items.map((it) => (it.id === itemId ? { ...it, [field]: value } : it)));
  };

  const addItem = () => {
    update("items", [...block.data.items, { id: generateId(), title: "New Item", description: "Description here" }]);
  };

  const removeItem = (id: string) => {
    update("items", block.data.items.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5"><Label className="text-xs">Section Title</Label><Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs" /></div>
      <div className="space-y-1.5"><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs" /></div>

      <div className="space-y-1.5">
        <Label className="text-xs">Content Source</Label>
        <Select value={source} onValueChange={(v) => update("source", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(SOURCE_LABELS) as ItemBoxSource[]).map((s) => (
              <SelectItem key={s} value={s} className="text-xs">{SOURCE_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groupEndpoint && (
        <div className="space-y-1.5">
          <Label className="text-xs">{SOURCE_LABELS[source]} Group</Label>
          <Select value={block.data.source_group_id ?? ""} onValueChange={(v) => update("source_group_id", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a group..." /></SelectTrigger>
            <SelectContent>
              {groups.map((g) => <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>)}
              {!groups.length && <SelectItem value="_none" className="text-xs text-muted-foreground" disabled>No groups found</SelectItem>}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">Items load live from the {SOURCE_LABELS[source]} dashboard.</p>
          {MANAGE_LINK[source] && (
            <a href={MANAGE_LINK[source]!.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> {MANAGE_LINK[source]!.label}
            </a>
          )}
        </div>
      )}

      {(source === "blog" || source === "pages") && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground">Shows your published {source === "blog" ? "blog posts" : "pages"} automatically — most recent first.</p>
          {MANAGE_LINK[source] && (
            <a href={MANAGE_LINK[source]!.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> {MANAGE_LINK[source]!.label}
            </a>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{["grid", "list"].map((l) => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Columns</Label>
        <Select value={String(block.data.columns)} onValueChange={(v) => update("columns", Number(v))}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{["2", "3", "4"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Card Style</Label>
        <Select value={block.data.cardStyle} onValueChange={(v) => update("cardStyle", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{["flat", "elevated", "bordered", "gradient"].map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {source === "inline" && (
        <div className="space-y-1.5 border-t pt-3">
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs font-semibold">Items ({block.data.items.length})</Label>
            <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add</Button>
          </div>
          <div className="space-y-3">
            {block.data.items.map((item, i) => (
              <div key={item.id} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Item {i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
                <Input value={item.title} onChange={(e) => updateItem(item.id, "title", e.target.value)} className="h-7 text-xs" placeholder="Title" />
                <Textarea value={item.description ?? ""} onChange={(e) => updateItem(item.id, "description", e.target.value)} className="text-xs resize-none" rows={2} placeholder="Description" />
                <Input
                  value={item.image?.type === "url" ? item.image.value ?? "" : item.image?.type === "icon" ? item.image.value ?? "" : ""}
                  onChange={(e) => updateItem(item.id, "image", e.target.value ? { type: "url", value: e.target.value } : { type: "none" })}
                  className="h-7 text-xs"
                  placeholder="Image URL (optional)"
                />
                <ContentPicker value={item.link} onChange={(link) => updateItem(item.id, "link", link)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

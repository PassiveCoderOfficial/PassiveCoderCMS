"use client";

import React, { useEffect, useState } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Database, Pencil } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { ServicesBlockProps } from "@/types/cms";

interface ServiceGroup {
  id: string;
  name: string;
  slug: string;
}

export function ServicesSettings({ block }: { block: ServicesBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (field: string, value: unknown) =>
    updateBlock(block.id, { data: { ...block.data, [field]: value } });

  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const source = block.data.source ?? "inline";

  useEffect(() => {
    fetch("/api/services")
      .then(r => r.json())
      .then(data => Array.isArray(data) && setGroups(data))
      .catch(() => {});
  }, []);

  const updateItem = (itemId: string, field: string, value: string) => {
    update("items", block.data.items.map((it) => it.id === itemId ? { ...it, [field]: value } : it));
  };

  const addItem = () => {
    update("items", [...block.data.items, { id: generateId(), icon: "Star", iconType: "lucide", title: "New Service", description: "Description here", link: "#", linkLabel: "Learn More" }]);
  };

  const removeItem = (id: string) => {
    update("items", block.data.items.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5"><Label className="text-xs">Section Title</Label><Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs" /></div>
      <div className="space-y-1.5"><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs" /></div>

      {/* Layout + Card Style only affect ServicesLegacy (no templateVariant
          set). The 7 designed variants have their own fixed card look and
          don't read these fields — showing dead dropdowns for them just
          confuses editors, so hide when a variant is active. Columns is
          read by 6 of 7 variants and stays visible always. */}
      {!block.templateVariant && (
        <div className="space-y-1.5">
          <Label className="text-xs">Layout</Label>
          <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["grid","list","cards","icon-list"].map((l) => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Columns</Label>
        <Select value={String(block.data.columns)} onValueChange={(v) => update("columns", Number(v))}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{["2","3","4"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!block.templateVariant && (
        <div className="space-y-1.5">
          <Label className="text-xs">Card Style</Label>
          <Select value={block.data.cardStyle} onValueChange={(v) => update("cardStyle", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["flat","elevated","bordered","gradient"].map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {/* Source toggle */}
      <div className="border-t pt-3">
        <Label className="text-xs font-semibold mb-2 block">Items Source</Label>
        <div className="flex gap-2">
          <button
            onClick={() => update("source", "inline")}
            className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded border transition-colors ${source === "inline" ? "bg-muted border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            <Pencil className="h-3 w-3" /> Inline
          </button>
          <button
            onClick={() => update("source", "group")}
            className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded border transition-colors ${source === "group" ? "bg-muted border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            <Database className="h-3 w-3" /> From Group
          </button>
        </div>
      </div>

      {source === "group" ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Service Group</Label>
          <Select value={block.data.source_group_id ?? ""} onValueChange={(v) => update("source_group_id", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a group..." /></SelectTrigger>
            <SelectContent>
              {groups.map(g => <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>)}
              {groups.length === 0 && <SelectItem value="_none" className="text-xs text-muted-foreground" disabled>No groups — create one in Services</SelectItem>}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Loads live from the Services dashboard.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between mb-2">
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
                <Input value={item.icon ?? ""} onChange={(e) => updateItem(item.id, "icon", e.target.value)} className="h-7 text-xs" placeholder="Icon name (e.g. Zap)" />
                <Input value={item.title} onChange={(e) => updateItem(item.id, "title", e.target.value)} className="h-7 text-xs" placeholder="Title" />
                <Textarea value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} className="text-xs resize-none" rows={2} placeholder="Description" />
                <Input value={item.link ?? ""} onChange={(e) => updateItem(item.id, "link", e.target.value)} className="h-7 text-xs" placeholder="Link URL" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

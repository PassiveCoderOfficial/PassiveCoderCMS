"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Star } from "lucide-react";
import { generateId, cn } from "@/lib/utils";
import type { TestimonialsBlockProps } from "@/types/cms";

type Item = TestimonialsBlockProps["data"]["items"][number];

/** Testimonials had no settings panel at all — hit "No settings for this
 *  block type" every time. Found in the full block-editor audit. */
export function TestimonialsSettings({ block }: { block: TestimonialsBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const addItem = () => {
    const item: Item = { id: generateId(), name: "Customer Name", content: "What they said about your business." };
    update("items", [...block.data.items, item]);
  };
  const updateItem = (id: string, f: keyof Item, v: unknown) => {
    update("items", block.data.items.map((i) => (i.id === id ? { ...i, [f]: v } : i)));
  };
  const removeItem = (id: string) => update("items", block.data.items.filter((i) => i.id !== id));

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["grid", "carousel", "masonry"].map((l) => (
              <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Testimonials</p>
          <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-3">
          {block.data.items.map((item) => (
            <div key={item.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex items-center gap-1">
                <Input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} className="h-7 text-xs flex-1" placeholder="Name" />
                <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)} className="h-7 w-7 shrink-0 text-destructive hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Input value={item.role ?? ""} onChange={(e) => updateItem(item.id, "role", e.target.value)} className="h-7 text-xs" placeholder="Role" />
                <Input value={item.company ?? ""} onChange={(e) => updateItem(item.id, "company", e.target.value)} className="h-7 text-xs" placeholder="Company" />
              </div>
              <Input value={item.avatar ?? ""} onChange={(e) => updateItem(item.id, "avatar", e.target.value)} className="h-7 text-xs" placeholder="Avatar URL" />
              <Textarea value={item.content} onChange={(e) => updateItem(item.id, "content", e.target.value)} className="text-xs min-h-16" placeholder="What they said" />
              <div className="flex items-center gap-1 pt-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updateItem(item.id, "rating", item.rating === n ? undefined : n)}
                    className="p-0.5"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  >
                    <Star className={cn("w-3.5 h-3.5", item.rating && n <= item.rating ? "fill-accent text-accent" : "text-muted-foreground/40")} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

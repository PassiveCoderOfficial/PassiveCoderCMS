"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { EcommerceProductsBlockProps } from "@/types/cms";

export function EcommerceProductsSettings({ block }: { block: EcommerceProductsBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Display Count</Label><Input type="number" value={block.data.displayCount} onChange={(e) => update("displayCount", Number(e.target.value))} className="h-8 text-xs mt-1" min={1} max={24} /></div>
      <div>
        <Label className="text-xs">Sort By</Label>
        <Select value={block.data.sortBy} onValueChange={(v) => update("sortBy", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="latest" className="text-xs">Latest</SelectItem>
            <SelectItem value="featured" className="text-xs">Featured</SelectItem>
            <SelectItem value="price_asc" className="text-xs">Price: Low to High</SelectItem>
            <SelectItem value="price_desc" className="text-xs">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Columns</Label>
        <Select value={String(block.data.columns)} onValueChange={(v) => update("columns", Number(v))}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["2","3","4"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between"><Label className="text-xs">Show Add to Cart</Label><Switch checked={block.data.showAddToCart} onCheckedChange={(v) => update("showAddToCart", v)} /></div>
    </div>
  );
}

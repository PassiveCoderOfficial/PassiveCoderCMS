"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ColumnsBlockProps } from "@/types/cms";

export function ColumnsSettings({ block }: { block: ColumnsBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const updateContent = (i: number, v: string) => {
    const c = [...block.data.content];
    c[i] = v;
    update("content", c);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Columns</Label>
        <Select value={String(block.data.columns)} onValueChange={v => update("columns", Number(v))}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{[2,3,4].map(c => <SelectItem key={c} value={String(c)} className="text-xs">{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Gap</Label>
        <Select value={block.data.gap} onValueChange={v => update("gap", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["sm","md","lg"].map(g => <SelectItem key={g} value={g} className="text-xs uppercase">{g}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Vertical Align</Label>
        <Select value={block.data.verticalAlign} onValueChange={v => update("verticalAlign", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["top","middle","bottom"].map(v => <SelectItem key={v} value={v} className="text-xs capitalize">{v}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="border-t pt-2">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Column Content (HTML)</p>
        {Array.from({ length: block.data.columns }).map((_, i) => (
          <div key={i} className="mb-2">
            <Label className="text-xs">Column {i + 1}</Label>
            <textarea
              value={block.data.content[i] ?? ""}
              onChange={e => updateContent(i, e.target.value)}
              className="w-full mt-1 text-xs border rounded p-1.5 resize-y bg-background font-mono"
              rows={4}
              placeholder="<p>HTML content…</p>"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ColumnsBlockProps } from "@/types/cms";
import { RichTextField } from "./rich-text-field";

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
      <div className="border-t pt-2 space-y-3">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Column text</p>
        {Array.from({ length: block.data.columns }).map((_, i) => (
          <RichTextField key={`${block.id}-${i}`} label={`Column ${i + 1}`} value={block.data.content[i] ?? ""} onChange={(v) => updateContent(i, v)} minHeight={110} />
        ))}
        <p className="text-[10px] text-muted-foreground">A newly added column shows &quot;Column content here...&quot; until you write in it.</p>
      </div>
    </div>
  );
}

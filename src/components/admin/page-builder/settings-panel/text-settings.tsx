"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TextBlockProps } from "@/types/cms";
import { RichTextField } from "./rich-text-field";

export function TextSettings({ block }: { block: TextBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (field: string, value: unknown) =>
    updateBlock(block.id, { data: { ...block.data, [field]: value } });

  return (
    <div className="space-y-3">
      {/* The text itself had no editor (the old note pointed at the canvas,
          which never had one); this is where it is written now. */}
      <RichTextField key={block.id} label="Text" value={block.data.content ?? ""} onChange={(v) => update("content", v)}
        hint="Headings, lists and links from the toolbar. HTML shows the code for tables, images and anything else." />
      <div className="space-y-1.5">
        <Label className="text-xs">Alignment</Label>
        <Select value={block.data.alignment} onValueChange={(v) => update("alignment", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["left","center","right"].map((a) => <SelectItem key={a} value={a} className="text-xs capitalize">{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Columns</Label>
        <Select value={String(block.data.columns)} onValueChange={(v) => update("columns", Number(v))}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["1","2","3","4"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c} Column{c !== "1" ? "s" : ""}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

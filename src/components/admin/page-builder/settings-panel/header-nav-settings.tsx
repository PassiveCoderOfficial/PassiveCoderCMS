"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NavItemsEditor } from "./nav-items-editor";
import type { HeaderNavBlockProps } from "@/types/cms";

export function HeaderNavSettings({ block }: { block: HeaderNavBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Style</Label>
        <Select value={block.data.style} onValueChange={(v) => update("style", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["default", "centered", "split", "minimal"].map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="border-t pt-3">
        <NavItemsEditor items={block.data.items} onChange={(items) => update("items", items)} />
      </div>
    </div>
  );
}

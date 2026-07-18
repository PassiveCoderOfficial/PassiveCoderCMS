"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { ContainerBlockProps } from "@/types/cms";

export function ContainerSettings({ block }: { block: ContainerBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  // Zustand/immer state is read-only outside set() — rebalancing widths must
  // produce new column objects, never mutate the ones read from block.data.
  const rebalanced = (cols: typeof block.data.columns) => {
    const evenWidth = Math.floor(100 / cols.length);
    return cols.map((c, i) => ({
      ...c,
      widthPct: i === cols.length - 1 ? 100 - evenWidth * (cols.length - 1) : evenWidth,
    }));
  };

  const addColumn = () => {
    const cols = rebalanced([...block.data.columns, { id: generateId(), widthPct: 0, blocks: [] }]);
    update("columns", cols);
  };

  const removeColumn = (i: number) => {
    if (block.data.columns.length <= 1) return;
    const cols = rebalanced(block.data.columns.filter((_, idx) => idx !== i));
    update("columns", cols);
  };

  const updateColumnWidth = (i: number, widthPct: number) => {
    const cols = block.data.columns.map((c, idx) => (idx === i ? { ...c, widthPct } : c));
    update("columns", cols);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Direction</Label>
        <Select value={block.data.direction} onValueChange={(v) => update("direction", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="row" className="text-xs">Row (side by side)</SelectItem>
            <SelectItem value="column" className="text-xs">Column (stacked)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Gap</Label>
        <Select value={block.data.gap} onValueChange={(v) => update("gap", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["none", "sm", "md", "lg"].map((g) => <SelectItem key={g} value={g} className="text-xs uppercase">{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Vertical Align (cross-axis)</Label>
        <Select value={block.data.align} onValueChange={(v) => update("align", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["start", "center", "end", "stretch"].map((a) => <SelectItem key={a} value={a} className="text-xs capitalize">{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Horizontal Align (main-axis)</Label>
        <Select value={block.data.justify} onValueChange={(v) => update("justify", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["start", "center", "end", "between"].map((j) => <SelectItem key={j} value={j} className="text-xs capitalize">{j}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Stack on mobile</Label>
        <Switch checked={block.data.wrapOnMobile} onCheckedChange={(v) => update("wrapOnMobile", v)} />
      </div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Columns</p>
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={addColumn}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {block.data.columns.map((col, i) => (
          <div key={col.id} className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-muted-foreground w-14 shrink-0">Col {i + 1}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={col.widthPct}
              onChange={(e) => updateColumnWidth(i, Number(e.target.value))}
              className="w-16 h-7 text-xs border rounded px-2 bg-background"
            />
            <span className="text-xs text-muted-foreground">%</span>
            <span className="text-[10px] text-muted-foreground ml-auto mr-1">{col.blocks.length} block{col.blocks.length === 1 ? "" : "s"}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive"
              disabled={block.data.columns.length <= 1}
              onClick={() => removeColumn(i)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

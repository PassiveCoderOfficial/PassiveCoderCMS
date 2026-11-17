"use client";

import React, { useState } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Plus, Trash2, ClipboardPaste } from "lucide-react";
import type { TableBlockProps } from "@/types/cms";

/** Table editor: columns, rows as a cell grid, and paste-from-Excel. */
export function TableSettings({ block }: { block: TableBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data;
  const set = (patch: Partial<TableBlockProps["data"]>) => updateBlock(block.id, { data: { ...d, ...patch } });
  const cols = d.columns ?? [];
  const rows = d.rows ?? [];
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);

  const setCell = (ri: number, ci: number, v: string) => set({ rows: rows.map((r, i) => (i === ri ? cols.map((_, j) => (j === ci ? v : r[j] ?? "")) : r)) });
  const applyPaste = () => {
    // Excel / Google Sheets copy = tab-separated; also accept CSV-ish commas.
    const lines = paste.replace(/\r/g, "").split("\n").filter((l) => l.trim());
    if (!lines.length) return;
    const sep = lines[0].includes("\t") ? "\t" : ",";
    const grid = lines.map((l) => l.split(sep).map((c) => c.trim()));
    set({ columns: grid[0], rows: grid.slice(1) });
    setPaste(""); setShowPaste(false);
  };

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Small label above title</Label><Input value={d.eyebrow ?? ""} onChange={(e) => set({ eyebrow: e.target.value })} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Title</Label><Input value={d.title ?? ""} onChange={(e) => set({ title: e.target.value })} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Textarea value={d.subtitle ?? ""} onChange={(e) => set({ subtitle: e.target.value })} className="text-xs mt-1" rows={2} /></div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Columns</p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setShowPaste((v) => !v)} className="h-6 text-xs px-2 gap-1"><ClipboardPaste className="w-3 h-3" />Paste</Button>
            <Button size="sm" variant="outline" onClick={() => set({ columns: [...cols, `Column ${cols.length + 1}`], rows: rows.map((r) => [...r, ""]) })} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" />Col</Button>
          </div>
        </div>
        {showPaste && (
          <div className="space-y-1.5">
            <Textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={5} className="text-xs font-mono" placeholder="Copy cells from Excel or Google Sheets and paste here. First line = column headings." />
            <Button size="sm" onClick={applyPaste} className="h-7 text-xs w-full">Replace table with pasted cells</Button>
          </div>
        )}
        {cols.map((c, ci) => (
          <div key={ci} className="flex gap-1">
            <Input value={c} onChange={(e) => set({ columns: cols.map((x, j) => (j === ci ? e.target.value : x)) })} className="h-7 text-xs flex-1" />
            <Button size="icon" variant="ghost" onClick={() => set({ columns: cols.filter((_, j) => j !== ci), rows: rows.map((r) => r.filter((_, j) => j !== ci)) })} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Rows ({rows.length})</p>
          <Button size="sm" variant="outline" onClick={() => set({ rows: [...rows, cols.map(() => "")] })} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" />Row</Button>
        </div>
        {rows.map((r, ri) => (
          <div key={ri} className="border rounded-lg p-2 space-y-1 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Row {ri + 1}</span>
              <Button size="icon" variant="ghost" onClick={() => set({ rows: rows.filter((_, i) => i !== ri) })} className="h-6 w-6 text-destructive"><Trash2 className="w-3 h-3" /></Button>
            </div>
            {cols.map((c, ci) => (
              <Input key={ci} value={r[ci] ?? ""} onChange={(e) => setCell(ri, ci, e.target.value)} className="h-7 text-xs" placeholder={c} />
            ))}
          </div>
        ))}
      </div>

      <div className="border-t pt-3 space-y-2">
        <div><Label className="text-xs">Design</Label>
          <select className="w-full h-8 text-xs mt-1 rounded-md border bg-background px-2" value={d.design ?? "default"} onChange={(e) => set({ design: e.target.value === "compare" ? "compare" : undefined })}>
            <option value="default">Classic table</option>
            <option value="compare">Comparison (ticks and crosses)</option>
          </select>
        </div>
        {d.design === "compare" && (
          <>
            <p className="text-[10px] text-muted-foreground">Type yes or no in a cell for a tick or a cross; add a note after a colon (yes: daily). A row with only its first cell filled is a group heading.</p>
            <div><Label className="text-xs">Highlighted column</Label>
              <select className="w-full h-8 text-xs mt-1 rounded-md border bg-background px-2" value={String(d.highlightColumn ?? 0)} onChange={(e) => set({ highlightColumn: Number(e.target.value) || undefined })}>
                <option value="0">None</option>
                {cols.slice(1).map((c, i) => <option key={i} value={String(i + 1)}>{c || `Column ${i + 2}`}</option>)}
              </select>
            </div>
            {cols.slice(1).map((c, i) => (
              <div key={i} className="border rounded-lg p-2 space-y-1 bg-muted/20">
                <span className="text-[10px] text-muted-foreground">{c || `Column ${i + 2}`}</span>
                <Input value={d.columnNotes?.[i + 1] ?? ""} onChange={(e) => set({ columnNotes: cols.map((_, j) => (j === i + 1 ? e.target.value : d.columnNotes?.[j] ?? "")) })} className="h-7 text-xs" placeholder="Small line under the heading" />
                <div className="flex gap-1">
                  <Input value={d.columnButtons?.[i + 1]?.label ?? ""} onChange={(e) => set({ columnButtons: cols.map((_, j) => ({ label: j === i + 1 ? e.target.value : d.columnButtons?.[j]?.label ?? "", url: d.columnButtons?.[j]?.url ?? "" })) })} className="h-7 text-xs flex-1" placeholder="Button text" />
                  <Input value={d.columnButtons?.[i + 1]?.url ?? ""} onChange={(e) => set({ columnButtons: cols.map((_, j) => ({ label: d.columnButtons?.[j]?.label ?? "", url: j === i + 1 ? e.target.value : d.columnButtons?.[j]?.url ?? "" })) })} className="h-7 text-xs flex-1" placeholder="Button link" />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="border-t pt-3 space-y-3">
        <div className="flex items-center justify-between"><Label className="text-xs">First column is the row label</Label><Switch checked={d.firstColumnHeader !== false} onCheckedChange={(v) => set({ firstColumnHeader: v })} /></div>
        <div className="flex items-center justify-between"><Label className="text-xs">Show header row</Label><Switch checked={!d.hideHeader} onCheckedChange={(v) => set({ hideHeader: v ? undefined : true })} /></div>
        <div className="flex items-center justify-between"><Label className="text-xs">Striped rows</Label><Switch checked={d.striped !== false} onCheckedChange={(v) => set({ striped: v })} /></div>
        <div><Label className="text-xs">On phones</Label>
          <select className="w-full h-8 text-xs mt-1 rounded-md border bg-background px-2" value={d.mobileLayout ?? "scroll"} onChange={(e) => set({ mobileLayout: e.target.value as "scroll" | "cards" })}>
            <option value="scroll">Scroll sideways</option>
            <option value="cards">One card per row</option>
          </select>
        </div>
        <div><Label className="text-xs">Header colour (blank = theme)</Label><ColorPicker value={d.headerColor ?? ""} onChange={(v) => set({ headerColor: v })} allowAlpha={false} className="mt-1" /></div>
        <div><Label className="text-xs">Note under the table</Label><Textarea value={d.note ?? ""} onChange={(e) => set({ note: e.target.value })} className="text-xs mt-1" rows={2} /></div>
      </div>

      {/* Search box, CSV / print buttons and pages are switched on above (Content from a collection box). */}
      {(d.searchable || d.exportable || (d.pageSize ?? 0) > 0) && (
        <div className="border-t pt-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Wording of the table tools (empty = the text shown)</p>
          {d.searchable && <Input value={d.searchPlaceholder ?? ""} onChange={(e) => set({ searchPlaceholder: e.target.value || undefined })} className="h-7 text-xs" placeholder="Search…" />}
          {d.exportable && (
            <div className="grid grid-cols-2 gap-1.5">
              <Input value={d.csvLabel ?? ""} onChange={(e) => set({ csvLabel: e.target.value || undefined })} className="h-7 text-xs" placeholder="CSV" />
              <Input value={d.printLabel ?? ""} onChange={(e) => set({ printLabel: e.target.value || undefined })} className="h-7 text-xs" placeholder="Print / PDF" />
            </div>
          )}
          {(d.pageSize ?? 0) > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              <Input value={d.prevLabel ?? ""} onChange={(e) => set({ prevLabel: e.target.value || undefined })} className="h-7 text-xs" placeholder="Previous" />
              <Input value={d.nextLabel ?? ""} onChange={(e) => set({ nextLabel: e.target.value || undefined })} className="h-7 text-xs" placeholder="Next" />
            </div>
          )}
          {(d.searchable || (d.pageSize ?? 0) > 0) && (
            <div className="flex items-center gap-2">
              <Label className="text-[11px] shrink-0">Word in &quot;3 of 12&quot;</Label>
              <Input value={d.ofLabel ?? ""} onChange={(e) => set({ ofLabel: e.target.value || undefined })} className="h-7 text-xs" placeholder="of" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

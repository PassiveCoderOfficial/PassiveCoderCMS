"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { ColorPicker } from "@/components/ui/color-picker";
import type { ResultsSearchBlockProps, ResultsCoursesBlockProps, ResultsAlumniBlockProps } from "@/types/cms";

type RBlock = ResultsSearchBlockProps | ResultsCoursesBlockProps | ResultsAlumniBlockProps;
const selectCls = "w-full h-8 text-xs mt-1 rounded-md border bg-background px-2";

/** Settings for the results module blocks. Results and courses themselves are
 *  managed in Dashboard → Results; lookup rules in Results Settings. */
export function ResultsBlockSettings({ block }: { block: RBlock }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data as Record<string, unknown>;
  const set = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } } as Partial<RBlock>);
  const text = (f: string, label: string) => (
    <div><Label className="text-xs">{label}</Label><Input value={String(d[f] ?? "")} onChange={(e) => set(f, e.target.value)} className="h-8 text-xs mt-1" /></div>
  );
  const select = (f: string, label: string, options: [string, string][]) => (
    <div><Label className="text-xs">{label}</Label>
      <select className={selectCls} value={String(d[f] ?? options[0][0])} onChange={(e) => set(f, e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
  const toggle = (f: string, label: string, dflt = false) => (
    <div className="flex items-center justify-between"><Label className="text-xs">{label}</Label><Switch checked={d[f] == null ? dflt : !!d[f]} onCheckedChange={(v) => set(f, v)} /></div>
  );

  return (
    <div className="space-y-3">
      {text("eyebrow", "Small label above title")}
      {text("title", "Title")}
      <div><Label className="text-xs">Subtitle</Label><Textarea value={String(d.subtitle ?? "")} onChange={(e) => set("subtitle", e.target.value)} className="text-xs mt-1" rows={2} /></div>

      {block.type === "results_search" && (
        <>
          {select("layout", "Layout", [["card", "Centred search card"], ["banner", "Full-width colour band"], ["split", "Text + image beside search"]])}
          {text("placeholder", "Search box placeholder")}
          {text("buttonLabel", "Button label")}
          {d.layout === "banner" && <div><Label className="text-xs">Background photo (faded)</Label><MediaPickerInput compact value={String(d.backgroundImage ?? "")} onChange={(v) => set("backgroundImage", v)} className="mt-1" /></div>}
          {d.layout === "split" && <div><Label className="text-xs">Side image</Label><MediaPickerInput compact value={String(d.sideImage ?? "")} onChange={(v) => set("sideImage", v)} className="mt-1" /></div>}
          <div><Label className="text-xs">Trust lines under the form (one per line)</Label>
            <Textarea value={((d.notes as string[]) ?? []).join("\n")} onChange={(e) => set("notes", e.target.value.split("\n"))} onBlur={(e) => set("notes", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} className="text-xs mt-1" rows={3} />
          </div>
          {toggle("showPrint", "Show 'Print result card' button", true)}
          <p className="text-[11px] text-muted-foreground">Lookup rules (certificate only, + DOB or + roll) and which fields are public are set in Dashboard → Results Settings.</p>
        </>
      )}

      {block.type === "results_courses" && (
        <>
          {select("style", "Style", [["cards", "Photo cards"], ["list", "Compact list"]])}
          <div><Label className="text-xs">Columns (cards)</Label>
            <select className={selectCls} value={String(d.columns ?? 3)} onChange={(e) => set("columns", Number(e.target.value))}>
              {[3, 2, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Max courses (0 = all)</Label><Input type="number" value={d.limit == null ? "" : String(d.limit)} onChange={(e) => set("limit", e.target.value === "" ? undefined : Number(e.target.value))} className="h-8 text-xs mt-1" /></div>
          {toggle("featuredOnly", "Featured courses only")}
          {text("linkLabel", "Link label")}
        </>
      )}

      {block.type === "results_alumni" && (
        <>
          <div><Label className="text-xs">Max students</Label><Input type="number" value={d.limit == null ? "" : String(d.limit)} onChange={(e) => set("limit", e.target.value === "" ? undefined : Number(e.target.value))} className="h-8 text-xs mt-1" /></div>
          <div><Label className="text-xs">Columns</Label>
            <select className={selectCls} value={String(d.columns ?? 4)} onChange={(e) => set("columns", Number(e.target.value))}>
              {[4, 3].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <p className="text-[11px] text-muted-foreground">Pick students in Dashboard → Results → open a result → Alumni showcase.</p>
        </>
      )}

      <div><Label className="text-xs">Accent colour (blank = theme)</Label>
        <ColorPicker value={String(d.accentColor ?? "")} onChange={(v) => set("accentColor", v)} allowAlpha={false} className="mt-1" />
      </div>
    </div>
  );
}

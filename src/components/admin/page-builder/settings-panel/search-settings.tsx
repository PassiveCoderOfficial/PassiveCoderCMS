"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { defaultSearchTypes, SEARCH_TYPE_LABEL, SEARCH_TYPE_MODULE, SEARCH_TYPES, type SearchType } from "@/lib/search/site-search";
import type { SearchBlockProps } from "@/types/cms";

/** Whether the site's Ecommerce module is on (decides product/category search). */
function useEcommerceOn() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/dashboard/modules").then((r) => r.json())
      .then((d: { modules?: { key: string; enabled: boolean }[] }) => setOn(!!d.modules?.find((m) => m.key === "ecommerce")?.enabled))
      .catch(() => setOn(false));
  }, []);
  return on;
}

/**
 * What a search box looks in, in what order, and how many suggestions it
 * shows. Only types the site's modules allow are offered; unset = the default
 * order for this kind of site (stores: products first).
 */
export function SearchTypesField({ value, onChange }: { value: SearchType[] | undefined; onChange: (v: SearchType[] | undefined) => void }) {
  const ecommerce = useEcommerceOn();
  if (ecommerce === null) return null;
  const available = SEARCH_TYPES.filter((t) => ecommerce || !SEARCH_TYPE_MODULE[t]);
  const current = (value?.length ? value : defaultSearchTypes(ecommerce)).filter((t) => available.includes(t));
  const off = available.filter((t) => !current.includes(t));
  const set = (list: SearchType[]) => onChange(list.length ? list : undefined);
  const move = (i: number, d: number) => { const l = [...current]; [l[i], l[i + d]] = [l[i + d], l[i]]; set(l); };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Search in (top shows first)</Label>
      <div className="rounded-md border divide-y">
        {current.map((t, i) => (
          <div key={t} className="flex items-center gap-2 px-2 py-1.5 text-xs">
            <input type="checkbox" checked onChange={() => current.length > 1 && set(current.filter((x) => x !== t))} />
            <span className="flex-1">{SEARCH_TYPE_LABEL[t]}s</span>
            <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="p-0.5 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
            <button type="button" aria-label="Move down" disabled={i === current.length - 1} onClick={() => move(i, 1)} className="p-0.5 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {off.map((t) => (
          <label key={t} className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={false} onChange={() => set([...current, t])} />
            <span>{SEARCH_TYPE_LABEL[t]}s</span>
          </label>
        ))}
      </div>
      {!ecommerce && <p className="text-[10px] text-muted-foreground">Products and categories appear here when the Ecommerce module is on.</p>}
      {value?.length ? <button type="button" className="text-[10px] underline text-muted-foreground" onClick={() => onChange(undefined)}>Use the default order</button> : null}
    </div>
  );
}

export function SuggestLimitField({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Suggestions while typing</Label>
      <div className="flex gap-1">
        {[3, 4, 5, 6, 8].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={cn("flex-1 rounded border py-1 text-xs", (value ?? 5) === n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{n}</button>
        ))}
      </div>
    </div>
  );
}

export function SearchSettings({ block }: { block: SearchBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data;
  const set = (patch: Partial<SearchBlockProps["data"]>) => updateBlock(block.id, { data: { ...d, ...patch } } as Partial<SearchBlockProps>);

  return (
    <div className="space-y-4">
      <SearchTypesField value={d.types} onChange={(types) => set({ types })} />
      <SuggestLimitField value={d.limit} onChange={(limit) => set({ limit })} />
      <div className="space-y-1.5">
        <Label className="text-xs">Look</Label>
        <div className="flex gap-1">
          {(["pill", "boxed", "plain"] as const).map((s) => (
            <button key={s} type="button" onClick={() => set({ style: s })}
              className={cn("flex-1 rounded border py-1 text-xs capitalize", (d.style ?? "pill") === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{s}</button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5"><Label className="text-xs">Placeholder</Label><Input value={d.placeholder ?? ""} placeholder="Search" onChange={(e) => set({ placeholder: e.target.value })} /></div>
      {(d.style ?? "pill") !== "plain" && (
        <>
          <div className="flex items-center justify-between"><Label className="text-xs">Show button</Label><Switch checked={d.showButton !== false} onCheckedChange={(v) => set({ showButton: v })} /></div>
          {d.showButton !== false && <div className="space-y-1.5"><Label className="text-xs">Button text</Label><Input value={d.buttonLabel ?? ""} placeholder="Search" onChange={(e) => set({ buttonLabel: e.target.value })} /></div>}
        </>
      )}
      <div className="space-y-1.5"><Label className="text-xs">Heading (pages only, optional)</Label><Input value={d.title ?? ""} onChange={(e) => set({ title: e.target.value })} /></div>
      {(d.title || d.subtitle) && <div className="space-y-1.5"><Label className="text-xs">Text under heading</Label><Input value={d.subtitle ?? ""} onChange={(e) => set({ subtitle: e.target.value })} /></div>}
      <p className="text-[10px] text-muted-foreground">The suggestion list under the box (Recent searches, No matches, See all results) uses the site&apos;s built-in wording.</p>
      <div className="space-y-1.5">
        <Label className="text-xs">Position</Label>
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <button key={a} type="button" onClick={() => set({ align: a })}
              className={cn("flex-1 rounded border py-1 text-xs capitalize", (d.align ?? "left") === a ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{a}</button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5"><Label className="text-xs">Max width (px)</Label><Input type="number" value={d.maxWidth ?? ""} placeholder={d.title ? "640" : "420"} onChange={(e) => set({ maxWidth: e.target.value ? Number(e.target.value) : undefined })} /></div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Database, ExternalLink, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
import type { Block } from "@/types/cms";
import type { CollectionBinding } from "@/lib/collections/binding";
import type { CollectionType } from "@/lib/collections/types";
import { fetchCollection, fetchCollectionTypes, useCollection } from "@/lib/collections/use-collection";
import { COLLECTION_BLOCK_TYPES } from "@/lib/collections/hydrate";

/**
 * "Show a collection" for Cards, Team, Gallery and Table. When a collection is
 * chosen, the block's items come from its entries (Dashboard > Collections)
 * and the client edits entries there, not here. Everything else about the
 * block (layout, colours, columns) keeps working as usual.
 */

const sel = "w-full h-8 rounded-md border border-input bg-background px-2 text-xs";

export function CollectionSourceSettings({ block }: { block: Block }) {
  const { updateBlock } = useBuilderStore();
  const [types, setTypes] = useState<CollectionType[] | null>(null);
  useEffect(() => { fetchCollectionTypes().then(setTypes); }, []);
  const data = block.data as Record<string, unknown> & { collection?: CollectionBinding };
  const b = data.collection;
  const r = useCollection(b?.typeId);

  if (!(COLLECTION_BLOCK_TYPES as readonly string[]).includes(block.type)) return null;
  if (types && !types.length && !b) return null; // site has no collections: nothing to offer

  const set = (patch: Partial<CollectionBinding> | null) => {
    const next = patch === null ? undefined : { ...(b ?? { typeId: "" }), ...patch };
    updateBlock(block.id, { data: { ...data, collection: next?.typeId ? next : undefined } } as Partial<Block>);
  };
  const setData = (patch: Record<string, unknown>) => updateBlock(block.id, { data: { ...data, ...patch } } as Partial<Block>);
  const fields = r?.type.fields ?? [];
  const keyOpts: [string, string][] = [["category", "Category"], ...fields.map((f) => [f.key, f.label] as [string, string])];

  return (
    <div className="mb-4 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3 space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold"><Database className="w-3.5 h-3.5 text-indigo-500" />Content from a collection</div>
      <select className={sel} value={b?.typeId ?? ""} onChange={(e) => set(e.target.value ? { typeId: e.target.value, categoryId: undefined, meta: undefined, kicker: undefined, columns: undefined } : null)}>
        <option value="">No, items typed in this block</option>
        {(types ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {b?.typeId && (
        <>
          {r && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{r.entries.filter((e) => e.status === "published").length} published entries</span>
              <span className="flex gap-2">
                <button type="button" title="Reload entries" onClick={() => fetchCollection(b.typeId, true).then(() => set({}))} className="hover:text-foreground"><RefreshCw className="w-3 h-3" /></button>
                <Link href={`/dashboard/collections/${r.type.slug}`} target="_blank" className="flex items-center gap-0.5 text-indigo-500 hover:underline">Edit entries<ExternalLink className="w-3 h-3" /></Link>
              </span>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">Items below are filled from the collection on the live site; edit the entries, not the items.</p>

          <div className="grid grid-cols-2 gap-2">
            {(r?.categories.length ?? 0) > 0 && (
              <div className="col-span-2"><Label className="text-[11px]">Category</Label>
                <select className={sel} value={b.categoryId ?? ""} onChange={(e) => set({ categoryId: e.target.value || undefined })}>
                  <option value="">All categories</option>
                  {r!.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div><Label className="text-[11px]">Order</Label>
              <select className={sel} value={b.sort ?? ""} onChange={(e) => set({ sort: (e.target.value || undefined) as CollectionBinding["sort"] })}>
                <option value="">Collection default</option><option value="manual">My order</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">A to Z</option>
              </select>
            </div>
            <div><Label className="text-[11px]">How many (blank = all)</Label>
              <Input type="number" min={0} value={b.limit ?? ""} onChange={(e) => set({ limit: e.target.value ? Number(e.target.value) : undefined })} className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex items-center justify-between"><Label className="text-[11px]">Featured entries only</Label><Switch checked={!!b.featuredOnly} onCheckedChange={(v) => set({ featuredOnly: v || undefined })} /></div>

          {block.type === "cards" && (
            <div className="border-t pt-2 space-y-2">
              <div><Label className="text-[11px]">Card text</Label>
                <select className={sel} value={b.description ?? "excerpt"} onChange={(e) => set({ description: e.target.value === "excerpt" ? undefined : e.target.value })}>
                  <option value="excerpt">Short summary</option><option value="body">Full description</option><option value="none">None</option>
                  {fields.filter((f) => ["text", "textarea", "list"].includes(f.type)).map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
              <div><Label className="text-[11px]">Small label above the title</Label>
                <select className={sel} value={b.kicker ?? ""} onChange={(e) => set({ kicker: e.target.value || undefined })}>
                  <option value="">None</option>{keyOpts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div><Label className="text-[11px]">Details listed on each card</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {keyOpts.map(([k, l]) => {
                    const on = b.meta?.includes(k);
                    return <button key={k} type="button" onClick={() => set({ meta: on ? b.meta!.filter((x) => x !== k) : [...(b.meta ?? []), k] })}
                      className={`px-2 py-0.5 rounded-full text-[11px] border ${on ? "bg-indigo-600 border-indigo-600 text-white" : "border-border"}`}>{l}</button>;
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-[11px]">Button text</Label><Input value={b.linkLabel ?? ""} placeholder="View details" onChange={(e) => set({ linkLabel: e.target.value || undefined })} className="h-8 text-xs" /></div>
                <div><Label className="text-[11px]">Card links to</Label>
                  <select className={sel} value={b.linkField ?? ""} onChange={(e) => set({ linkField: e.target.value || undefined })}>
                    <option value="">{r?.type.has_detail_page ? "Entry page" : "Nothing"}</option>
                    {fields.filter((f) => f.type === "url").map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {block.type === "team" && (
            <div className="border-t pt-2"><Label className="text-[11px]">Role / position field</Label>
              <select className={sel} value={b.roleField ?? ""} onChange={(e) => set({ roleField: e.target.value || undefined })}>
                <option value="">None</option>{fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
          )}

          {block.type === "gallery" && (
            <div className="border-t pt-2"><Label className="text-[11px]">Photos</Label>
              <select className={sel} value={b.galleryMode ?? "covers"} onChange={(e) => set({ galleryMode: e.target.value as CollectionBinding["galleryMode"] })}>
                <option value="covers">Main image of each entry</option><option value="all">Every photo of every entry</option>
              </select>
            </div>
          )}

          {block.type === "table" && (
            <div className="border-t pt-2 space-y-2">
              <Label className="text-[11px]">Columns</Label>
              <TableColumns options={[["title", r?.type.singular || "Title"], ["excerpt", "Summary"], ...keyOpts]} value={b.columns ?? ["title", ...fields.filter((f) => f.show_in_list).map((f) => f.key)]} onChange={(columns) => set({ columns })} />
            </div>
          )}
        </>
      )}

      {block.type === "table" && (
        <div className="border-t pt-2 space-y-2">
          <div className="flex items-center justify-between"><Label className="text-[11px]">Search box</Label><Switch checked={!!data.searchable} onCheckedChange={(v) => setData({ searchable: v })} /></div>
          <div className="flex items-center justify-between"><Label className="text-[11px]">CSV and print buttons</Label><Switch checked={!!data.exportable} onCheckedChange={(v) => setData({ exportable: v })} /></div>
          <div><Label className="text-[11px]">Rows per page (blank = all)</Label><Input type="number" min={0} value={(data.pageSize as number) || ""} onChange={(e) => setData({ pageSize: e.target.value ? Number(e.target.value) : undefined })} className="h-8 text-xs" /></div>
        </div>
      )}
    </div>
  );
}

function TableColumns({ options, value, onChange }: { options: [string, string][]; value: string[]; onChange: (v: string[]) => void }) {
  const label = new Map(options);
  const rest = options.filter(([k]) => !value.includes(k));
  const move = (i: number, d: -1 | 1) => { const n = [...value]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div className="space-y-1">
      {value.map((k, i) => (
        <div key={k} className="flex items-center gap-1 text-[11px] rounded border border-border px-2 py-1">
          <span className="flex-1 truncate">{label.get(k) ?? k}</span>
          <button type="button" onClick={() => move(i, -1)}><ArrowUp className="w-3 h-3" /></button>
          <button type="button" onClick={() => move(i, 1)}><ArrowDown className="w-3 h-3" /></button>
          <button type="button" onClick={() => onChange(value.filter((x) => x !== k))} className="text-red-500 px-1">×</button>
        </div>
      ))}
      {rest.length > 0 && (
        <select className={sel} value="" onChange={(e) => e.target.value && onChange([...value, e.target.value])}>
          <option value="">Add column…</option>
          {rest.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      )}
    </div>
  );
}

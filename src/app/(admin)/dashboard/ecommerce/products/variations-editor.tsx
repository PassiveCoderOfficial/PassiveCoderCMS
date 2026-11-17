"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Wand2, Download, Upload, Save, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { generateId } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { deletePreset, listPresets, presetLabel, presetToOption, savePreset as savePresetRow, type OptionPreset } from "@/lib/ecommerce/option-presets";
import {
  MAX_OPTIONS, UNLIMITED_STOCK_FALLBACK, combinations, comboKey, comboName, csvToVariantPatches, resolveOptions, isStockNotNullError, rulePrice, stockForEditor, stockOrFallback, variantAttrs, variantsToCsv,
  type OptionDisplay, type ProductOption, type VariantRecord,
} from "@/lib/ecommerce/variations";

import { saveVariationsWith, type VariationRow, type VariationsState } from "@/lib/ecommerce/save-variations";
export type { VariationRow, VariationsState };
export const EMPTY_VARIATIONS: VariationsState = { options: [], rows: [], defaultKey: null };


/** Load a product's options and variations for editing. */
export async function loadVariations(productId: string, attributes: Record<string, unknown> | null | undefined): Promise<VariationsState> {
  const { data, error } = await createClient().from("product_variants")
    .select("id, name, attributes, price, compare_price, stock_quantity, sku, barcode, weight, image, images, is_active, sort_order")
    .eq("product_id", productId).order("sort_order");
  // Never hand the editor an empty list on a failed read: saving that would delete every variation.
  if (error) throw error;
  const raw = (data ?? []) as VariantRecord[];
  const options = resolveOptions((attributes?.options as ProductOption[]) ?? null, raw);
  const rows: VariationRow[] = raw.map((v) => ({
    ...v, key: v.id, price: Number(v.price), compare_price: v.compare_price === null ? null : Number(v.compare_price),
    stock_quantity: stockForEditor(v.stock_quantity),
    attributes: variantAttrs(v, options), images: Array.isArray(v.images) ? v.images : [],
  }));
  const defId = attributes?.defaultVariantId as string | undefined;
  return { options, rows, defaultKey: rows.find((r) => r.id === defId)?.key ?? null };
}

/** Save variations with the browser client (see saveVariationsWith). */
export async function saveVariations(productId: string, s: VariationsState): Promise<{ minPrice: number | null; defaultVariantId: string | null }> {
  return saveVariationsWith(createClient(), productId, s);
}

const newRow = (attributes: Record<string, string>, price: number): VariationRow => ({
  key: generateId(), id: "", isNew: true, name: "", attributes, price, compare_price: null, stock_quantity: null,
  sku: null, barcode: null, weight: null, image: null, images: [], is_active: true, sort_order: 0,
});

/**
 * Options (up to three types, each shown as buttons, swatches or a dropdown)
 * and the variation table: price, sale price, stock, SKU, barcode, weight and
 * photos per combination, a default, bulk edits, price rules, presets and CSV.
 */
export function VariationsEditor({ value, onChange, basePrice }: { value: VariationsState; onChange: (v: VariationsState) => void; basePrice: number }) {
  const { options, rows } = value;
  const set = (patch: Partial<VariationsState>) => onChange({ ...value, ...patch });
  const [presets, setPresets] = useState<OptionPreset[]>([]);
  const [managePresets, setManagePresets] = useState(false);
  const [filter, setFilter] = useState<Record<string, string>>({});
  const [bulk, setBulk] = useState({ price: "", compare: "", stock: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageFor, setImageFor] = useState<string | null>(null);

  useEffect(() => {
    getClientTenantId().then((tid) => {
      if (!tid) return;
      listPresets(tid).then(setPresets).catch(() => {});
    });
  }, []);

  const setOption = (id: string, patch: Partial<ProductOption>) => set({ options: options.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  const renameOption = (o: ProductOption, name: string) => set({
    options: options.map((x) => (x.id === o.id ? { ...x, name } : x)),
    rows: rows.map((r) => { const a = { ...r.attributes }; if (o.name in a) { a[name] = a[o.name]; delete a[o.name]; } return { ...r, attributes: a }; }),
  });
  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    set({ options: [...options, { id: generateId(), name: options.length ? "Option " + (options.length + 1) : "Size", display: "buttons", values: [] }] });
  };
  /** Add a preset with all its values (fresh ids) and build the variations straight away. */
  const addPreset = (p: OptionPreset) => {
    if (options.length >= MAX_OPTIONS) return;
    if (!p.option.values.length) { toast.error(`The preset "${p.name}" has no values. Edit it in Ecommerce → Product Defaults.`); return; }
    if (options.some((o) => o.name.trim().toLowerCase() === p.name.toLowerCase())) { toast.error(`This product already has a "${p.name}" option.`); return; }
    const nextOptions = [...options, presetToOption(p)];
    set({ options: nextOptions, rows: buildRows(nextOptions) });
    toast.success(`Added ${p.name}: ${p.option.values.length} values`);
  };
  const removeOption = (o: ProductOption) => set({ options: options.filter((x) => x.id !== o.id), rows: [] });
  const addValue = (o: ProductOption, label: string) => {
    const l = label.trim(); if (!l || o.values.some((v) => v.label.toLowerCase() === l.toLowerCase())) return;
    setOption(o.id, { values: [...o.values, { id: generateId(), label: l }] });
  };

  /** Rows for every combination; existing rows (and their data) are kept. */
  const buildRows = (opts: ProductOption[]) => {
    const have = new Map(rows.map((r) => [comboKey(opts, r.attributes), r]));
    return combinations(opts).map((attrs) => have.get(comboKey(opts, attrs)) ?? newRow(attrs, rulePrice(basePrice, opts, attrs)));
  };
  const generate = () => {
    const next = buildRows(options);
    set({ rows: next });
    toast.success(`${next.length} variations`);
  };
  const applyRules = () => set({ rows: rows.map((r) => ({ ...r, price: rulePrice(basePrice, options, r.attributes) })) });

  const shown = useMemo(() => rows.filter((r) => Object.entries(filter).every(([k, v]) => !v || r.attributes[k] === v)), [rows, filter]);
  const patchRow = (key: string, p: Partial<VariationRow>) => set({ rows: rows.map((r) => (r.key === key ? { ...r, ...p } : r)) });
  const applyBulk = () => {
    const keys = new Set(shown.map((r) => r.key));
    set({ rows: rows.map((r) => !keys.has(r.key) ? r : {
      ...r,
      ...(bulk.price !== "" ? { price: Number(bulk.price) } : {}),
      ...(bulk.compare !== "" ? { compare_price: bulk.compare === "-" ? null : Number(bulk.compare) } : {}),
      ...(bulk.stock !== "" ? { stock_quantity: bulk.stock === "-" ? null : Number(bulk.stock) } : {}),
    }) });
    toast.success(`Updated ${keys.size} variations`);
  };

  const savePreset = async (o: ProductOption) => {
    const tid = await getClientTenantId(); if (!tid) return;
    try {
      const saved = await savePresetRow(tid, o);
      const existed = presets.some((p) => p.id === saved.id);
      setPresets((list) => [...list.filter((p) => p.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(existed ? `Updated the "${saved.name}" preset` : `Saved "${saved.name}" as a preset`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save the preset"); }
  };
  const removePreset = async (p: OptionPreset) => {
    const tid = await getClientTenantId(); if (!tid) return;
    try { await deletePreset(tid, p.id); setPresets((list) => list.filter((x) => x.id !== p.id)); toast.success(`Deleted the "${p.name}" preset`); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete the preset"); }
  };
  const exportCsv = () => {
    const blob = new Blob([variantsToCsv(options, rows)], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "variations.csv"; a.click(); URL.revokeObjectURL(a.href);
  };
  const importCsv = async (file: File) => {
    const patches = csvToVariantPatches(options, await file.text());
    let hit = 0;
    set({ rows: rows.map((r) => { const p = patches.get(comboKey(options, r.attributes)); if (p) hit++; return p ? { ...r, ...p } : r; }) });
    toast.success(`Updated ${hit} of ${rows.length} variations from the file`);
  };

  const cell = "h-8 text-xs px-2";
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Variations</CardTitle></CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <p className="text-xs text-muted-foreground">Add up to three option types (e.g. Size, Colour, Pack), then create the variations. Each one can have its own price, stock, SKU and photos. Leave empty to sell at the single price above.</p>

        {options.map((o) => (
          <div key={o.id} className="border rounded-lg p-3 space-y-2 bg-muted/20">
            <div className="flex flex-wrap gap-2 items-center">
              <Input value={o.name} onChange={(e) => renameOption(o, e.target.value)} className="h-8 text-xs w-40" placeholder="Option name" />
              <select value={o.display} onChange={(e) => setOption(o.id, { display: e.target.value as OptionDisplay })} className="h-8 text-xs rounded-md border bg-background px-2">
                <option value="buttons">Shown as buttons</option><option value="swatches">Shown as colour / image swatches</option><option value="dropdown">Shown as a dropdown</option>
              </select>
              <Button type="button" size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => savePreset(o)}><Save className="w-3 h-3" />Save as preset</Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive ml-auto" onClick={() => removeOption(o)} title="Remove this option (clears the variation list)"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {o.values.map((v) => (
                <span key={v.id} className="inline-flex items-center gap-1 rounded-full border bg-background pl-2 pr-1 py-0.5 text-xs">
                  {o.display === "swatches" && (
                    <input type="color" value={v.color ?? "#cccccc"} onChange={(e) => setOption(o.id, { values: o.values.map((x) => (x.id === v.id ? { ...x, color: e.target.value } : x)) })} className="w-4 h-4 p-0 border-0 bg-transparent" title="Swatch colour" />
                  )}
                  {v.label}
                  <input type="number" value={v.priceDelta ?? ""} placeholder="±" title="Price rule: added to the base price"
                    onChange={(e) => setOption(o.id, { values: o.values.map((x) => (x.id === v.id ? { ...x, priceDelta: e.target.value === "" ? undefined : Number(e.target.value) } : x)) })}
                    className="w-12 h-5 text-[10px] border rounded px-1 bg-background" />
                  <button type="button" onClick={() => setOption(o.id, { values: o.values.filter((x) => x.id !== v.id) })} aria-label={`Remove ${v.label}`}><X className="w-3 h-3" /></button>
                </span>
              ))}
              <input placeholder="Add value + Enter" className="h-7 text-xs border rounded-full px-3 bg-background w-36"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addValue(o, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; } }} />
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          {options.length < MAX_OPTIONS && <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => addOption()}><Plus className="w-3 h-3" />Add option type</Button>}
          {options.length < MAX_OPTIONS && presets.length > 0 && (
            <select value="" onChange={(e) => { const p = presets.find((x) => x.id === e.target.value); if (p) addPreset(p); }} className="h-8 text-xs rounded-md border bg-background px-2">
              <option value="">Add from preset…</option>
              {presets.map((p) => <option key={p.id} value={p.id} disabled={!p.option.values.length}>{presetLabel(p)}</option>)}
            </select>
          )}
          {presets.length > 0 && <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setManagePresets((m) => !m)}>{managePresets ? "Done" : "Manage presets"}</Button>}
          {options.some((o) => o.values.length) && <Button type="button" size="sm" className="gap-1" onClick={generate}><Wand2 className="w-3 h-3" />Create variations</Button>}
          {rows.length > 0 && options.some((o) => o.values.some((v) => v.priceDelta)) && <Button type="button" size="sm" variant="outline" onClick={applyRules}>Apply price rules to all</Button>}
          {rows.length > 0 && <Button type="button" size="sm" variant="ghost" className="gap-1" onClick={exportCsv}><Download className="w-3 h-3" />CSV</Button>}
          {rows.length > 0 && <Button type="button" size="sm" variant="ghost" className="gap-1" onClick={() => fileRef.current?.click()}><Upload className="w-3 h-3" />Import CSV</Button>}
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ""; }} />
        </div>

        {managePresets && presets.length > 0 && (
          <div className="rounded-lg border p-2 space-y-1 bg-muted/20">
            <p className="text-[11px] text-muted-foreground">Saved presets. Full editing is in Ecommerce → Product Defaults.</p>
            {presets.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate">{presetLabel(p)}</span>
                <button type="button" onClick={() => removePreset(p)} className="text-destructive hover:underline inline-flex items-center gap-0.5" aria-label={`Delete preset ${p.name}`}><X className="w-3 h-3" />Delete</button>
              </div>
            ))}
          </div>
        )}

        {rows.length > 0 && (
          <>
            <div className="flex flex-wrap items-end gap-2 rounded-lg border p-2 bg-muted/30">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground self-center">Bulk edit</span>
              {options.map((o) => (
                <select key={o.id} value={filter[o.name] ?? ""} onChange={(e) => setFilter({ ...filter, [o.name]: e.target.value })} className="h-8 text-xs rounded-md border bg-background px-2">
                  <option value="">All {o.name}</option>{o.values.map((v) => <option key={v.id} value={v.label}>{v.label}</option>)}
                </select>
              ))}
              <Input value={bulk.price} onChange={(e) => setBulk({ ...bulk, price: e.target.value })} placeholder="Price" className={`${cell} w-20`} />
              <Input value={bulk.compare} onChange={(e) => setBulk({ ...bulk, compare: e.target.value })} placeholder="Was (- clears)" className={`${cell} w-24`} />
              <Input value={bulk.stock} onChange={(e) => setBulk({ ...bulk, stock: e.target.value })} placeholder="Stock (- = unlimited)" className={`${cell} w-32`} />
              <Button type="button" size="sm" onClick={applyBulk}>Apply to {shown.length}</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground text-left">
                  <tr><th className="py-1 pr-2">Default</th><th className="pr-2">Variation</th><th className="pr-2">Price</th><th className="pr-2">Was</th><th className="pr-2">Stock</th><th className="pr-2">SKU</th><th className="pr-2">Barcode</th><th className="pr-2">Weight</th><th className="pr-2">Photos</th><th>On</th></tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <React.Fragment key={r.key}>
                      <tr className="border-t">
                        <td className="py-1.5 pr-2"><input type="radio" name="default-variant" checked={value.defaultKey === r.key} onChange={() => set({ defaultKey: r.key })} title="Selected when the page opens" /></td>
                        <td className="pr-2 font-medium whitespace-nowrap">{comboName(options, r.attributes)}</td>
                        <td className="pr-2"><Input value={String(r.price)} onChange={(e) => patchRow(r.key, { price: e.target.value as unknown as number })} className={`${cell} w-20`} /></td>
                        <td className="pr-2"><Input value={r.compare_price ?? ""} onChange={(e) => patchRow(r.key, { compare_price: e.target.value === "" ? null : (e.target.value as unknown as number) })} className={`${cell} w-20`} /></td>
                        <td className="pr-2"><Input value={r.stock_quantity ?? ""} placeholder="∞" onChange={(e) => patchRow(r.key, { stock_quantity: e.target.value === "" ? null : (e.target.value as unknown as number) })} className={`${cell} w-16`} /></td>
                        <td className="pr-2"><Input value={r.sku ?? ""} onChange={(e) => patchRow(r.key, { sku: e.target.value })} className={`${cell} w-24`} /></td>
                        <td className="pr-2"><Input value={r.barcode ?? ""} onChange={(e) => patchRow(r.key, { barcode: e.target.value })} className={`${cell} w-28`} /></td>
                        <td className="pr-2"><Input value={r.weight ?? ""} onChange={(e) => patchRow(r.key, { weight: e.target.value === "" ? null : (e.target.value as unknown as number) })} className={`${cell} w-16`} /></td>
                        <td className="pr-2">
                          <button type="button" onClick={() => setImageFor(imageFor === r.key ? null : r.key)} className="inline-flex items-center gap-1 rounded border px-2 h-8">
                            {r.images[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.images[0]} alt="" className="w-6 h-6 object-cover rounded" /> : <ImageIcon className="w-3.5 h-3.5" />}
                            <span>{r.images.length || ""}</span>
                          </button>
                        </td>
                        <td><input type="checkbox" checked={r.is_active !== false} onChange={(e) => patchRow(r.key, { is_active: e.target.checked })} /></td>
                      </tr>
                      {imageFor === r.key && (
                        <tr><td colSpan={10} className="pb-2">
                          <div className="flex flex-wrap gap-2 items-center p-2 rounded bg-muted/40">
                            {r.images.map((u) => (
                              <span key={u} className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={u} alt="" className="w-14 h-14 object-cover rounded border" />
                                <button type="button" onClick={() => patchRow(r.key, { images: r.images.filter((x) => x !== u) })} className="absolute -top-1.5 -right-1.5 bg-background border rounded-full p-0.5"><X className="w-3 h-3" /></button>
                              </span>
                            ))}
                            <div className="w-56"><MediaPickerInput compact value="" onChange={(u) => u && patchRow(r.key, { images: [...r.images, u] })} /></div>
                            <span className="text-[10px] text-muted-foreground">Shown when this variation is picked. First photo = main.</span>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground">Stock empty = always available. 0 = sold out (shoppers can ask to be told when it is back).</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

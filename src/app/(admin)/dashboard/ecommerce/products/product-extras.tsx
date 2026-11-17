"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { generateId } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export type OptionRow = { key: string; id?: string; name: string; price: string; compare_price: string; inStock: boolean };
export type Highlight = { label: string; value: string };

/** Load a product's sizes/options for the editor. */
export async function loadOptions(productId: string): Promise<OptionRow[]> {
  const supabase = createClient();
  const { data } = await supabase.from("product_variants").select("id, name, price, compare_price, stock_quantity, sort_order, is_active")
    .eq("product_id", productId).order("sort_order");
  return (data ?? []).filter((v) => v.is_active !== false).map((v) => ({
    key: v.id, id: v.id, name: v.name ?? "", price: String(v.price ?? ""), compare_price: v.compare_price ? String(v.compare_price) : "",
    inStock: v.stock_quantity === null || Number(v.stock_quantity) > 0,
  }));
}

/** Replace a product's options with the edited list. Returns the cheapest price (for listings). */
export async function saveOptions(productId: string, rows: OptionRow[]): Promise<number | null> {
  const supabase = createClient();
  const clean = rows.filter((r) => r.name.trim() && r.price !== "" && !Number.isNaN(Number(r.price)));
  const { error: delErr } = await supabase.from("product_variants").delete().eq("product_id", productId);
  if (delErr) throw delErr;
  if (!clean.length) return null;
  const { error } = await supabase.from("product_variants").insert(clean.map((r, i) => ({
    product_id: productId, name: r.name.trim(), price: Number(r.price),
    compare_price: r.compare_price ? Number(r.compare_price) : null,
    stock_quantity: r.inStock ? 999 : 0, sort_order: i, is_active: true, attributes: { option: r.name.trim() },
  })));
  if (error) throw error;
  return Math.min(...clean.map((r) => Number(r.price)));
}

function moveItem<T>(list: T[], i: number, d: number): T[] {
  const j = i + d; if (j < 0 || j >= list.length) return list;
  const next = [...list]; [next[i], next[j]] = [next[j], next[i]]; return next;
}

/** Sizes / options with their own prices (e.g. 100ml, 50ml). Empty = one price for the product. */
export function OptionsEditor({ rows, onChange }: { rows: OptionRow[]; onChange: (rows: OptionRow[]) => void }) {
  const set = (k: string, patch: Partial<OptionRow>) => onChange(rows.map((r) => (r.key === k ? { ...r, ...patch } : r)));
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Sizes / options</CardTitle></CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        <p className="text-xs text-muted-foreground">Add a row for each size or version with its own price. Leave empty to sell at the single price above. Shoppers must pick one before adding to cart.</p>
        {rows.map((r, i) => (
          <div key={r.key} className="grid grid-cols-[1fr_5.5rem_5.5rem_auto] gap-1.5 items-center">
            <Input value={r.name} onChange={(e) => set(r.key, { name: e.target.value })} placeholder="100ml" className="h-8 text-xs" />
            <Input value={r.price} onChange={(e) => set(r.key, { price: e.target.value })} placeholder="Price" inputMode="decimal" className="h-8 text-xs" />
            <Input value={r.compare_price} onChange={(e) => set(r.key, { compare_price: e.target.value })} placeholder="Was" inputMode="decimal" className="h-8 text-xs" />
            <div className="flex items-center">
              <label className="flex items-center gap-1 text-[11px] mr-1" title="In stock"><input type="checkbox" checked={r.inStock} onChange={(e) => set(r.key, { inStock: e.target.checked })} />Stock</label>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => onChange(moveItem(rows, i, -1))}><ChevronUp className="w-3 h-3" /></Button>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => onChange(moveItem(rows, i, 1))}><ChevronDown className="w-3 h-3" /></Button>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onChange(rows.filter((x) => x.key !== r.key))}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => onChange([...rows, { key: generateId(), name: "", price: "", compare_price: "", inStock: true }])}>
          <Plus className="w-3 h-3" /> Add size / option
        </Button>
      </CardContent>
    </Card>
  );
}

/** Short label/value facts shown as a grid on the product page (e.g. Top / Heart / Base notes). */
export function HighlightsEditor({ title, items, onTitle, onItems }: {
  title: string; items: Highlight[]; onTitle: (v: string) => void; onItems: (v: Highlight[]) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Highlights</CardTitle></CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        <p className="text-xs text-muted-foreground">Short facts shown in boxes on the product page, e.g. Top notes: Bergamot, Apple.</p>
        <div className="space-y-1"><Label className="text-xs">Heading</Label><Input value={title} onChange={(e) => onTitle(e.target.value)} placeholder="Fragrance Notes" className="h-8 text-xs" /></div>
        {items.map((h, i) => (
          <div key={i} className="grid grid-cols-[8rem_1fr_auto] gap-1.5">
            <Input value={h.label} onChange={(e) => onItems(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Top notes" className="h-8 text-xs" />
            <Input value={h.value} onChange={(e) => onItems(items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="Bergamot, Apple" className="h-8 text-xs" />
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onItems(items.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => onItems([...items, { label: "", value: "" }])}><Plus className="w-3 h-3" /> Add highlight</Button>
      </CardContent>
    </Card>
  );
}

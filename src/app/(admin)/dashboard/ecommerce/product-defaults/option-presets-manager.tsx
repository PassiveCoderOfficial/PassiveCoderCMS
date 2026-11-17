"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { generateId } from "@/lib/utils";
import { deletePreset, listPresets, presetLabel, savePreset, type OptionPreset } from "@/lib/ecommerce/option-presets";
import type { OptionDisplay, ProductOption } from "@/lib/ecommerce/variations";

const blank = (): ProductOption => ({ id: generateId(), name: "", display: "buttons", values: [] });

/**
 * Variation presets (Size, Colour, Pack...) for this store. They show in the
 * product editor's "Add from preset" list; "Save as preset" there writes to
 * the same list (same name = update).
 */
export function OptionPresetsManager({ tenantId }: { tenantId: string }) {
  const [presets, setPresets] = useState<OptionPreset[] | null>(null);
  const [editing, setEditing] = useState<{ id?: string; option: ProductOption } | null>(null);
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listPresets(tenantId).then(setPresets).catch((e) => { setPresets([]); toast.error(e instanceof Error ? e.message : "Could not load presets"); });
  }, [tenantId]);

  const o = editing?.option;
  const patch = (p: Partial<ProductOption>) => setEditing((e) => (e ? { ...e, option: { ...e.option, ...p } } : e));
  const addValue = () => {
    if (!o) return;
    const labels = newValue.split(",").map((l) => l.trim()).filter(Boolean)
      .filter((l, i, all) => all.findIndex((x) => x.toLowerCase() === l.toLowerCase()) === i)
      .filter((l) => !o.values.some((v) => v.label.toLowerCase() === l.toLowerCase()));
    if (labels.length) patch({ values: [...o.values, ...labels.map((label) => ({ id: generateId(), label }))] });
    setNewValue("");
  };
  const move = (i: number, d: number) => {
    if (!o) return;
    const j = i + d; if (j < 0 || j >= o.values.length) return;
    const next = [...o.values]; [next[i], next[j]] = [next[j], next[i]]; patch({ values: next });
  };

  const save = async () => {
    if (!editing) return;
    // A value typed but not added yet still counts.
    let option = editing.option;
    if (newValue.trim()) {
      const extra = newValue.split(",").map((l) => l.trim()).filter((l) => l && !option.values.some((v) => v.label.toLowerCase() === l.toLowerCase()));
      option = { ...option, values: [...option.values, ...extra.map((label) => ({ id: generateId(), label }))] };
      setNewValue("");
    }
    // A new preset whose name exists would overwrite it: say so first.
    if (!editing.id && presets?.some((p) => p.name.toLowerCase() === option.name.trim().toLowerCase())
      && !window.confirm(`A preset called "${option.name.trim()}" exists. Replace it?`)) return;
    setSaving(true);
    try {
      const saved = await savePreset(tenantId, option, editing.id);
      setPresets((list) => [...(list ?? []).filter((p) => p.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
      setEditing(null);
      toast.success(`Saved the "${saved.name}" preset`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the preset");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (p: OptionPreset) => {
    if (!window.confirm(`Delete the "${p.name}" preset? Products that already use it keep their options.`)) return;
    try {
      await deletePreset(tenantId, p.id);
      setPresets((list) => (list ?? []).filter((x) => x.id !== p.id));
      if (editing?.id === p.id) setEditing(null);
      toast.success(`Deleted "${p.name}"`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete the preset"); }
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm">Variation presets</CardTitle>
        <p className="text-xs text-muted-foreground">Option types you reuse, like Size (25ml, 50ml, 100ml). Pick them in a product&apos;s Variations with &quot;Add from preset&quot;.</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {presets === null ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : presets.length === 0 && !editing ? (
          <p className="text-xs text-muted-foreground">No presets yet.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {presets.map((p) => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1 min-w-0 truncate">{presetLabel(p)}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">{p.option.display}</span>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" title="Edit" onClick={() => { setNewValue(""); setEditing({ id: p.id, option: { ...p.option, values: p.option.values.map((v) => ({ ...v })) } }); }}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Delete" onClick={() => remove(p)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            ))}
          </div>
        )}

        {o ? (
          <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
            <div className="flex flex-wrap gap-2 items-center">
              <Input value={o.name} onChange={(e) => patch({ name: e.target.value })} className="h-8 text-xs w-44" placeholder="Option name, e.g. Size" />
              <select value={o.display} onChange={(e) => patch({ display: e.target.value as OptionDisplay })} className="h-8 text-xs rounded-md border bg-background px-2">
                <option value="buttons">Shown as buttons</option><option value="swatches">Shown as colour / image swatches</option><option value="dropdown">Shown as a dropdown</option>
              </select>
            </div>
            <div className="space-y-1">
              {o.values.length === 0 && <p className="text-xs text-muted-foreground">No values yet. Add them below.</p>}
              {o.values.map((v, i) => (
                <div key={v.id} className="flex items-center gap-1.5">
                  {o.display === "swatches" && (
                    <input type="color" value={v.color ?? "#cccccc"} onChange={(e) => patch({ values: o.values.map((x) => (x.id === v.id ? { ...x, color: e.target.value } : x)) })} className="w-7 h-7 p-0 border rounded bg-transparent" title="Swatch colour" />
                  )}
                  <Input value={v.label} onChange={(e) => patch({ values: o.values.map((x) => (x.id === v.id ? { ...x, label: e.target.value } : x)) })} className="h-8 text-xs flex-1" />
                  <Input type="number" value={v.priceDelta ?? ""} placeholder="± price" title="Price rule: added to the product's base price"
                    onChange={(e) => patch({ values: o.values.map((x) => (x.id === v.id ? { ...x, priceDelta: e.target.value === "" ? undefined : Number(e.target.value) } : x)) })}
                    className="h-8 text-xs w-24" />
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, -1)} title="Move up"><ChevronUp className="w-3.5 h-3.5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === o.values.length - 1} onClick={() => move(i, 1)} title="Move down"><ChevronDown className="w-3.5 h-3.5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => patch({ values: o.values.filter((x) => x.id !== v.id) })} title="Remove value"><X className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
              <div className="flex gap-1.5 pt-1">
                <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValue(); } }}
                  placeholder="Add value (or several, comma separated)" className="h-8 text-xs flex-1" />
                <Button type="button" size="sm" variant="outline" className="h-8" onClick={addValue}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
              <p className="text-[10px] text-muted-foreground">± price is optional: it is added to the product&apos;s price when variations are created (e.g. 100ml +40).</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={save} disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}Save preset</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setEditing(null); setNewValue(""); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => { setNewValue(""); setEditing({ option: blank() }); }}><Plus className="w-3.5 h-3.5" />New preset</Button>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

/**
 * Settings fields shared by every showcase variant (spec cards, bento, visit +
 * map...). One place so colour overrides, item lists and image fields look and
 * behave the same in every block.
 */
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { generateId } from "@/lib/utils";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({ label, value, onChange, placeholder, hint, multiline }: {
  label: string; value?: string; onChange: (v: string) => void; placeholder?: string; hint?: string; multiline?: boolean;
}) {
  return (
    <Field label={label} hint={hint}>
      {multiline
        ? <textarea className="w-full text-xs border rounded-md p-2 resize-y bg-background" rows={3} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <Input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />}
    </Field>
  );
}

export function LinesField({ label, value, onChange, hint, rows = 4 }: {
  label: string; value?: string[]; onChange: (v: string[]) => void; hint?: string; rows?: number;
}) {
  return (
    <Field label={label} hint={hint ?? "One per line"}>
      <textarea className="w-full text-xs border rounded-md p-2 resize-y bg-background" rows={rows}
        value={(value ?? []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))}
        onBlur={(e) => onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean))} />
    </Field>
  );
}

export function ImageField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return <Field label={label}><MediaPickerInput value={value ?? ""} onChange={onChange} compact /></Field>;
}

export function ShowcaseColorsEditor({ value, onChange }: {
  value?: { dark?: string; accent?: string }; onChange: (v: { dark?: string; accent?: string }) => void;
}) {
  const set = (k: "dark" | "accent", v: string) => onChange({ ...(value ?? {}), [k]: v || undefined });
  return (
    <div className="rounded-lg border p-2.5 space-y-2 bg-muted/20">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Colours</p>
      <p className="text-[10px] text-muted-foreground">Leave empty to follow your site colours.</p>
      {(["dark", "accent"] as const).map((k) => (
        <div key={k} className="flex items-center gap-2">
          <span className="text-xs w-14">{k === "dark" ? "Dark" : "Accent"}</span>
          <ColorPicker value={value?.[k] ?? ""} onChange={(v) => set(k, v)} className="flex-1" />
          {value?.[k] && <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => set(k, "")}>Reset</Button>}
        </div>
      ))}
    </div>
  );
}

/**
 * Editable list of objects: add, remove, reorder, and a render prop for the
 * fields of each item. Every repeating thing in showcase variants uses it.
 */
export function ItemsEditor<T extends { id: string }>({ title, items, onChange, make, render, itemLabel, max }: {
  title: string;
  items: T[] | undefined;
  onChange: (items: T[]) => void;
  make: () => Omit<T, "id">;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  itemLabel?: (item: T, index: number) => string;
  max?: number;
}) {
  const list = items ?? [];
  const update = (id: string, patch: Partial<T>) => onChange(list.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= list.length) return;
    const next = [...list]; [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground">{title}</p>
        {(!max || list.length < max) && (
          <Button size="sm" variant="outline" className="h-6 text-xs px-2 gap-1" onClick={() => onChange([...list, { ...make(), id: generateId() } as T])}>
            <Plus className="w-3 h-3" /> Add
          </Button>
        )}
      </div>
      {list.map((it, i) => (
        <div key={it.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium flex-1 truncate">{itemLabel ? itemLabel(it, i) : `Item ${i + 1}`}</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp className="w-3 h-3" /></Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, 1)} disabled={i === list.length - 1}><ChevronDown className="w-3 h-3" /></Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => onChange(list.filter((x) => x.id !== it.id))}><Trash2 className="w-3 h-3" /></Button>
          </div>
          {render(it, (patch) => update(it.id, patch), i)}
        </div>
      ))}
    </div>
  );
}

/** Small label:value pairs editor for percentage meters. */
export function MetersEditor({ value, onChange }: {
  value?: { id: string; label: string; value: number }[]; onChange: (v: { id: string; label: string; value: number }[]) => void;
}) {
  const list = value ?? [];
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Spec bars (label + %)</span>
        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1.5 gap-1" onClick={() => onChange([...list, { id: generateId(), label: "Label", value: 80 }])}><Plus className="w-3 h-3" />Bar</Button>
      </div>
      {list.map((m) => (
        <div key={m.id} className="flex gap-1">
          <Input value={m.label} onChange={(e) => onChange(list.map((x) => x.id === m.id ? { ...x, label: e.target.value } : x))} className="h-7 text-xs flex-1" placeholder="UV" />
          <Input type="number" min={0} max={100} value={m.value} onChange={(e) => onChange(list.map((x) => x.id === m.id ? { ...x, value: Number(e.target.value) } : x))} className="h-7 text-xs w-16" />
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onChange(list.filter((x) => x.id !== m.id))}><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
    </div>
  );
}

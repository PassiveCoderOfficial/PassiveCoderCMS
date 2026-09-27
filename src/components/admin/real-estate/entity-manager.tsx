"use client";

import React, { useMemo, useState } from "react";
import { Plus, Loader2, Trash2, ArrowLeft, Search, Star, X, ExternalLink, GripVertical } from "lucide-react";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { MapPicker } from "@/components/donors/donor-map";

/**
 * Schema-driven list + editor used by every real estate dashboard page
 * (properties, communities, developers). One component so a fix to the
 * editing experience lands everywhere. Editing opens a full page view, not a
 * modal, matching the rest of the module-level dashboards.
 */

export type FieldDef =
  | { key: string; label: string; type: "text" | "textarea" | "number" | "url"; placeholder?: string; half?: boolean; help?: string }
  | { key: string; label: string; type: "select"; options: [string, string][]; half?: boolean }
  | { key: string; label: string; type: "bool"; half?: boolean; help?: string }
  | { key: string; label: string; type: "image"; half?: boolean }
  | { key: string; label: string; type: "images" }
  | { key: string; label: string; type: "list"; placeholder?: string; help?: string }
  | { key: string; label: string; type: "payment_plan" }
  | { key: string; label: string; type: "location" };

export interface FieldGroup { title: string; fields: FieldDef[] }

type Row = Record<string, unknown> & { id: string };

export interface EntityManagerProps {
  entity: "properties" | "communities" | "developers";
  title: string;
  singular: string;
  initial: Row[];
  groups: FieldGroup[];
  defaults: Record<string, unknown>;
  /** Column renderers for the list view. */
  listTitle: (r: Row) => string;
  listSubtitle?: (r: Row) => string;
  listImage?: (r: Row) => string | null | undefined;
  listBadges?: (r: Row) => string[];
  publicPath?: (r: Row) => string;
  mapCenter?: { lat: number; lng: number };
  emptyHint?: React.ReactNode;
}

const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

export function EntityManager(props: EntityManagerProps) {
  const { entity, title, singular, groups, defaults } = props;
  const [rows, setRows] = useState<Row[]>(props.initial);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => props.listTitle(r).toLowerCase().includes(q) || (props.listSubtitle?.(r) ?? "").toLowerCase().includes(q)) : rows;
  }, [rows, query, props]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    const isNew = !editing.id;
    const res = await fetch(`/api/real-estate/${entity}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Save failed"); return; }
    setRows((prev) => (isNew ? [d, ...prev] : prev.map((r) => (r.id === d.id ? d : r))));
    setEditing(null);
  };

  const remove = async (id: string) => {
    if (!confirm(`Delete this ${singular.toLowerCase()}? This cannot be undone.`)) return;
    const res = await fetch(`/api/real-estate/${entity}?id=${id}`, { method: "DELETE" });
    if (res.ok) { setRows((prev) => prev.filter((r) => r.id !== id)); setEditing(null); }
  };

  const quickToggle = async (r: Row, key: string) => {
    const res = await fetch(`/api/real-estate/${entity}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, [key]: !r[key] }),
    });
    if (res.ok) { const d = await res.json(); setRows((prev) => prev.map((x) => (x.id === d.id ? d : x))); }
  };

  if (editing) {
    const set = (k: string, v: unknown) => setEditing((e) => ({ ...(e ?? {}), [k]: v }));
    return (
      <div className="max-w-4xl space-y-6 pb-24">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setEditing(null)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4" />Back to {title.toLowerCase()}</button>
          {Boolean(editing.id) && props.publicPath && (
            <a href={props.publicPath(editing as Row)} target="_blank" rel="noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">View on site <ExternalLink className="w-3.5 h-3.5" /></a>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white">{editing.id ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}</h1>

        {groups.map((g) => (
          <section key={g.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">{g.title}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {g.fields.map((f) => (
                <FieldInput key={f.key} f={f} value={editing[f.key]} editing={editing} set={set} mapCenter={props.mapCenter} />
              ))}
            </div>
          </section>
        ))}

        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-gray-950/95 backdrop-blur border-t border-gray-800 px-6 py-3 flex items-center justify-between gap-3 z-30">
          <div className="text-sm text-red-400">{error}</div>
          <div className="flex gap-2">
            {Boolean(editing.id) && (
              <button onClick={() => remove(String(editing.id))} className="px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-950/50 flex items-center gap-1.5"><Trash2 className="w-4 h-4" />Delete</button>
            )}
            <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
            <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{rows.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className={`${inputCls} pl-9 w-56`} />
          </div>
          <button onClick={() => setEditing({ ...defaults })} className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"><Plus className="w-4 h-4" />Add {singular.toLowerCase()}</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400">
          <p>No {title.toLowerCase()} yet.</p>
          {props.emptyHint}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800 overflow-hidden">
          {filtered.map((r) => {
            const img = props.listImage?.(r);
            return (
              <div key={r.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/50 cursor-pointer" onClick={() => setEditing({ ...r })}>
                <GripVertical className="w-4 h-4 text-gray-700 shrink-0 hidden sm:block" />
                {props.listImage && (
                  <div className="w-16 h-12 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{props.listTitle(r)}</p>
                  {props.listSubtitle && <p className="text-xs text-gray-400 truncate mt-0.5">{props.listSubtitle(r)}</p>}
                </div>
                <div className="hidden md:flex gap-1.5">
                  {(props.listBadges?.(r) ?? []).map((b) => <span key={b} className="px-2 py-0.5 rounded-full text-[11px] bg-gray-800 border border-gray-700 text-gray-300">{b}</span>)}
                </div>
                {"featured" in r && (
                  <button title="Featured" onClick={(e) => { e.stopPropagation(); quickToggle(r, "featured"); }} className="p-1.5 rounded-lg hover:bg-gray-700">
                    <Star className={`w-4 h-4 ${r.featured ? "fill-amber-400 text-amber-400" : "text-gray-600"}`} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FieldInput({ f, value, editing, set, mapCenter }: { f: FieldDef; value: unknown; editing: Record<string, unknown>; set: (k: string, v: unknown) => void; mapCenter?: { lat: number; lng: number } }) {
  const full = !("half" in f && f.half);
  const wrap = (child: React.ReactNode, help?: string) => (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs text-gray-400">{f.label}</span>
      <div className="mt-1">{child}</div>
      {help && <span className="text-[11px] text-gray-500 mt-1 block">{help}</span>}
    </label>
  );

  switch (f.type) {
    case "text":
    case "url":
      return wrap(<input className={inputCls} placeholder={f.placeholder} value={String(value ?? "")} onChange={(e) => set(f.key, e.target.value)} />, f.help);
    case "number":
      return wrap(<input className={inputCls} type="number" placeholder={f.placeholder} value={value == null ? "" : String(value)} onChange={(e) => set(f.key, e.target.value === "" ? null : Number(e.target.value))} />, f.help);
    case "textarea":
      return wrap(<textarea className={`${inputCls} min-h-32`} placeholder={f.placeholder} value={String(value ?? "")} onChange={(e) => set(f.key, e.target.value)} />, f.help);
    case "select":
      return wrap(
        <select className={inputCls} value={String(value ?? "")} onChange={(e) => set(f.key, e.target.value || null)}>
          {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>,
      );
    case "bool":
      return (
        <label className={`flex items-center gap-3 ${full ? "sm:col-span-2" : ""} py-2`}>
          <input type="checkbox" className="w-4 h-4 accent-indigo-500" checked={!!value} onChange={(e) => set(f.key, e.target.checked)} />
          <span className="text-sm text-gray-200">{f.label}</span>
          {f.help && <span className="text-[11px] text-gray-500">{f.help}</span>}
        </label>
      );
    case "image":
      return wrap(<MediaPickerInput value={String(value ?? "")} onChange={(v) => set(f.key, v)} />);
    case "images": {
      const list = Array.isArray(value) ? (value as string[]) : [];
      return wrap(
        <div className="space-y-2">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {list.map((u, i) => (
              <div key={`${u}-${i}`} className="relative group aspect-[4/3] rounded-lg overflow-hidden bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white">Cover</span>}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                  {i > 0 && <button type="button" onClick={() => { const n = [...list]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set(f.key, n); }} className="px-1.5 py-0.5 text-[11px] rounded bg-gray-700 text-white">←</button>}
                  <button type="button" onClick={() => set(f.key, list.filter((_, j) => j !== i))} className="p-1 rounded bg-red-600 text-white"><X className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
          <MediaPickerInput value="" placeholder="Add image…" onChange={(v) => v && set(f.key, [...list, v])} />
        </div>,
      );
    }
    case "list": {
      const list = Array.isArray(value) ? (value as string[]) : [];
      return wrap(
        <textarea className={`${inputCls} min-h-24`} placeholder={f.placeholder ?? "One per line"} value={list.join("\n")}
          onChange={(e) => set(f.key, e.target.value.split("\n"))} onBlur={(e) => set(f.key, e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} />,
        f.help ?? "One per line",
      );
    }
    case "payment_plan": {
      const plan = Array.isArray(value) ? (value as { label: string; percent: number }[]) : [];
      const total = plan.reduce((s, p) => s + (Number(p.percent) || 0), 0);
      return wrap(
        <div className="space-y-2">
          {plan.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls} placeholder="e.g. On booking" value={p.label} onChange={(e) => set(f.key, plan.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className={`${inputCls} w-28`} type="number" placeholder="%" value={p.percent ?? ""} onChange={(e) => set(f.key, plan.map((x, j) => (j === i ? { ...x, percent: Number(e.target.value) } : x)))} />
              <button type="button" onClick={() => set(f.key, plan.filter((_, j) => j !== i))} className="px-2 text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => set(f.key, [...plan, { label: "", percent: 0 }])} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add milestone</button>
            {plan.length > 0 && <span className={`text-xs ${total === 100 ? "text-green-400" : "text-amber-400"}`}>Total {total}%</span>}
          </div>
        </div>,
      );
    }
    case "location": {
      const lat = editing.lat as number | null;
      const lng = editing.lng as number | null;
      return wrap(
        <MapPicker value={lat != null && lng != null ? { lat, lng } : null} onChange={(v) => { set("lat", v.lat); set("lng", v.lng); }}
          defaultCenter={mapCenter ?? { lat: 24.7136, lng: 46.6753 }} defaultZoom={10} height={260} />,
      );
    }
  }
}

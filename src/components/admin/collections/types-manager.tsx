"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { Plus, Loader2, Trash2, ArrowLeft, ArrowUp, ArrowDown, X, Layers, Settings2 } from "lucide-react";
import { IconPicker } from "@/components/ui/icon-picker";
import {
  FIELD_TYPES, FIELD_TYPE_LABELS, TRANSLATABLE_TYPES, fieldKey, slugify,
  type CollectionField, type CollectionType,
} from "@/lib/collections/types";

/**
 * Dashboard > Collections: the site's own content types (Tour Packages,
 * Projects, Team...). Defining a type = naming it and listing its fields;
 * entries are then edited on /dashboard/collections/<slug> and shown by
 * blocks that read the collection.
 */

type TypeRow = CollectionType & { entry_count?: number };

const inputCls = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

export function TypeIcon({ name, className }: { name?: string; className?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = ((name && (LucideIcons as any)[name]) || Layers) as React.ComponentType<{ className?: string }>;
  return <Icon className={className} />;
}

export function CollectionTypesManager({ initial, editId, canEdit = true }: { initial: TypeRow[]; editId?: string; canEdit?: boolean }) {
  const [rows, setRows] = useState<TypeRow[]>(initial);
  const [editing, setEditing] = useState<Partial<TypeRow> | null>(() => (editId ? initial.find((t) => t.id === editId) ?? null : null));

  if (editing) {
    return (
      <TypeEditor
        initial={editing}
        allTypes={rows}
        onDone={(saved, deletedId) => {
          if (deletedId) setRows((p) => p.filter((r) => r.id !== deletedId));
          else if (saved) setRows((p) => (p.some((r) => r.id === saved.id) ? p.map((r) => (r.id === saved.id ? { ...r, ...saved } : r)) : [...p, saved]));
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collections</h1>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
            Your own content types, like Tour Packages, Projects or Team. Add entries once and every block that shows the collection updates on the site.
          </p>
        </div>
        {canEdit && <button onClick={() => setEditing({ name: "", singular: "", icon: "Layers", fields: [], visibility: "public", sort_mode: "manual", show_in_sidebar: true, has_detail_page: false })}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5">
          <Plus className="w-4 h-4" />New collection
        </button>}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
          <Layers className="w-8 h-8 mx-auto mb-3 opacity-60" />
          <p>No collections yet.</p>
          <p className="text-xs mt-1">Create one for anything you list on the site: packages, projects, products you don&apos;t sell online, team, branches.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0"><TypeIcon name={t.icon} className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.entry_count ?? 0} entries · {t.fields.length} fields{t.visibility === "private" ? " · private" : ""}</p>
                </div>
              </div>
              {t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
              <div className="flex gap-2 mt-auto">
                <Link href={`/dashboard/collections/${t.slug}`} className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white">Open entries</Link>
                {canEdit && <button onClick={() => setEditing(t)} className="px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted flex items-center gap-1.5"><Settings2 className="w-4 h-4" />Fields</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TypeEditor({ initial, allTypes, onDone }: { initial: Partial<TypeRow>; allTypes: TypeRow[]; onDone: (saved?: TypeRow, deletedId?: string) => void }) {
  const router = useRouter();
  const [t, setT] = useState<Partial<TypeRow>>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isNew = !t.id;
  const fields = t.fields ?? [];
  const set = <K extends keyof TypeRow>(k: K, v: TypeRow[K]) => setT((p) => ({ ...p, [k]: v }));
  const setField = (i: number, patch: Partial<CollectionField>) => set("fields", fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, d: -1 | 1) => {
    const n = [...fields]; const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]]; set("fields", n);
  };

  const save = async () => {
    if (!t.name?.trim()) { setError("Give the collection a name"); return; }
    setSaving(true); setError("");
    const body = { ...t, slug: t.slug || slugify(t.name), fields: fields.map((f) => ({ ...f, key: f.key || fieldKey(f.label) })) };
    const res = await fetch("/api/collections", { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Save failed"); return; }
    onDone(d);
    router.refresh();
  };

  const remove = async () => {
    if (!t.id) return;
    if (!confirm(`Delete "${t.name}" and all ${t.entry_count ?? 0} entries? This cannot be undone.`)) return;
    const res = await fetch(`/api/collections?id=${t.id}`, { method: "DELETE" });
    if (res.ok) { onDone(undefined, t.id); router.refresh(); }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-24">
      <button onClick={() => onDone()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" />All collections</button>
      <h1 className="text-2xl font-bold text-foreground">{isNew ? "New collection" : `${t.name}: settings & fields`}</h1>

      <section className="bg-card border border-border rounded-2xl p-5 grid sm:grid-cols-2 gap-4">
        <label className="block"><span className="text-xs text-muted-foreground">Name (plural)</span>
          <input className={`${inputCls} mt-1`} value={t.name ?? ""} placeholder="Tour Packages"
            onChange={(e) => setT((p) => ({ ...p, name: e.target.value, ...(isNew ? { slug: slugify(e.target.value) } : {}) }))} />
        </label>
        <label className="block"><span className="text-xs text-muted-foreground">One item is called</span>
          <input className={`${inputCls} mt-1`} value={t.singular ?? ""} placeholder="Tour Package" onChange={(e) => set("singular", e.target.value)} />
        </label>
        <label className="block"><span className="text-xs text-muted-foreground">Slug (used in the dashboard address)</span>
          <input className={`${inputCls} mt-1`} value={t.slug ?? ""} onChange={(e) => set("slug", slugify(e.target.value))} />
        </label>
        <label className="block"><span className="text-xs text-muted-foreground">Icon</span>
          <div className="mt-1"><IconPicker value={t.icon ?? "Layers"} onChange={(v) => set("icon", v)} /></div>
        </label>
        <label className="block sm:col-span-2"><span className="text-xs text-muted-foreground">Description (for your team)</span>
          <input className={`${inputCls} mt-1`} value={t.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </label>
        <label className="block"><span className="text-xs text-muted-foreground">Who can see entries</span>
          <select className={`${inputCls} mt-1`} value={t.visibility ?? "public"} onChange={(e) => set("visibility", e.target.value as TypeRow["visibility"])}>
            <option value="public">Visitors (published entries)</option>
            <option value="private">Dashboard only</option>
          </select>
        </label>
        <label className="block"><span className="text-xs text-muted-foreground">Default order</span>
          <select className={`${inputCls} mt-1`} value={t.sort_mode ?? "manual"} onChange={(e) => set("sort_mode", e.target.value as TypeRow["sort_mode"])}>
            <option value="manual">My order (drag in the list)</option>
            <option value="newest">Newest first</option>
            <option value="title">A to Z</option>
          </select>
        </label>
        <label className="flex items-center gap-3 py-1">
          <input type="checkbox" className="w-4 h-4 accent-indigo-500" checked={t.show_in_sidebar ?? true} onChange={(e) => set("show_in_sidebar", e.target.checked)} />
          <span className="text-sm">Show in the dashboard menu</span>
        </label>
        <label className="flex items-center gap-3 py-1">
          <input type="checkbox" className="w-4 h-4 accent-indigo-500" checked={!!t.has_detail_page} onChange={(e) => set("has_detail_page", e.target.checked)} />
          <span className="text-sm">Each entry has its own page</span>
        </label>
        {t.has_detail_page && (
          <label className="block sm:col-span-2"><span className="text-xs text-muted-foreground">Page address starts with</span>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">/<input className={inputCls} value={t.url_prefix ?? t.slug ?? ""} onChange={(e) => set("url_prefix", e.target.value)} />/entry-name</div>
            <span className="text-[11px] text-muted-foreground mt-1 block">Every entry page uses one design (a template page with {"{{title}}"}, {"{{price}}"}… placeholders), so all entries look the same and only their data changes.</span>
            {t.id && (
              <button type="button" onClick={async () => {
                const res = await fetch(`/api/collections/${t.id}/template`, { method: "POST" });
                const d = await res.json();
                if (res.ok) router.push(`/dashboard/pages/${d.page_id}`); else setError(d.error ?? "Could not create the template");
              }} className="mt-2 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted">
                {t.template_page_id ? "Edit the entry page design" : "Design the entry page"}
              </button>
            )}
          </label>
        )}
      </section>

      <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Fields</h2>
          <p className="text-xs text-muted-foreground mt-1">Every entry already has a title, short summary, description, main image, gallery and categories. Add the extra details this collection needs.</p>
        </div>
        {fields.map((f, i) => (
          <div key={i} className="border border-border rounded-xl p-3 grid sm:grid-cols-12 gap-2 items-start">
            <div className="sm:col-span-4">
              <input className={inputCls} placeholder="Label, e.g. Price" value={f.label}
                onChange={(e) => setField(i, { label: e.target.value, ...(!initial.fields?.some((o) => o.key === f.key && f.key) ? { key: fieldKey(e.target.value) } : {}) })} />
              <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">{f.key || "key"}</span>
            </div>
            <div className="sm:col-span-3">
              <select className={inputCls} value={f.type} onChange={(e) => setField(i, { type: e.target.value as CollectionField["type"] })}>
                {FIELD_TYPES.map((ft) => <option key={ft} value={ft}>{FIELD_TYPE_LABELS[ft]}</option>)}
              </select>
            </div>
            <div className="sm:col-span-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-indigo-500" checked={!!f.show_in_list} onChange={(e) => setField(i, { show_in_list: e.target.checked })} />List column</label>
              {TRANSLATABLE_TYPES.has(f.type) && (
                <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-indigo-500" checked={f.translatable ?? true} onChange={(e) => setField(i, { translatable: e.target.checked })} />Translate</label>
              )}
              <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-indigo-500" checked={!!f.required} onChange={(e) => setField(i, { required: e.target.checked })} />Required</label>
              <span className="ml-auto flex gap-1">
                <button type="button" onClick={() => move(i, -1)} className="p-1 rounded hover:bg-muted"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => move(i, 1)} className="p-1 rounded hover:bg-muted"><ArrowDown className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => set("fields", fields.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-red-950/40 text-red-400"><X className="w-3.5 h-3.5" /></button>
              </span>
            </div>
            {f.type === "select" && (
              <input className={`${inputCls} sm:col-span-12`} placeholder="Choices, separated by commas" value={(f.options ?? []).join(", ")}
                onChange={(e) => setField(i, { options: e.target.value.split(",").map((s) => s.trim()) })} />
            )}
            {f.type === "relation" && (
              <select className={`${inputCls} sm:col-span-12`} value={f.relation_type ?? ""} onChange={(e) => setField(i, { relation_type: e.target.value })}>
                <option value="">Choose a collection…</option>
                {allTypes.filter((o) => o.id !== t.id).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            )}
            <input className={`${inputCls} sm:col-span-12`} placeholder="Help text for whoever fills this in (optional)" value={f.help ?? ""} onChange={(e) => setField(i, { help: e.target.value })} />
          </div>
        ))}
        <button type="button" onClick={() => set("fields", [...fields, { key: "", label: "", type: "text" }])} className="text-sm text-primary hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add field</button>
      </section>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-background backdrop-blur border-t border-border px-6 py-3 flex items-center justify-between gap-3 z-30">
        <div className="text-sm text-red-400">{error}</div>
        <div className="flex gap-2">
          {!isNew && <button onClick={remove} className="px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-950/50 flex items-center gap-1.5"><Trash2 className="w-4 h-4" />Delete</button>}
          <button onClick={() => onDone()} className="px-4 py-2 rounded-lg text-sm text-foreground/80 hover:bg-muted">Cancel</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}Save
          </button>
        </div>
      </div>
    </div>
  );
}

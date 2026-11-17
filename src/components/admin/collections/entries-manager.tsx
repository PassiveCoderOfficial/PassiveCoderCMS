"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus, Loader2, Trash2, ArrowLeft, Search, Star, ExternalLink, Upload, Download, Languages, Settings2,
  ArrowUp, ArrowDown, Eye, EyeOff, X, Tag, Check,
} from "lucide-react";
import { FieldInput, type FieldDef } from "@/components/admin/real-estate/entity-manager";
import { TypeIcon } from "./types-manager";
import { parseCsv, toCsv, downloadText } from "./csv";
import {
  displayValue, entryPath, isTranslatable, slugify,
  type CollectionCategory, type CollectionEntry, type CollectionField, type CollectionType, type EntryText,
} from "@/lib/collections/types";

/**
 * Entries of one collection: list with search / filters / bulk actions,
 * full-page editor generated from the type's fields, categories, CSV import
 * and export, and per-language text (site languages from Settings >
 * Languages). This is the screen clients use to keep the site current.
 */

type Lang = { code: string; name: string };
type Draft = Partial<CollectionEntry> & { data: Record<string, unknown>; translations: Record<string, EntryText> };

const inputCls = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const PAGE = 50;

function toFieldDef(f: CollectionField, relationOpts: Record<string, [string, string][]>): FieldDef {
  const base = { key: f.key, label: f.label + (f.required ? " *" : "") };
  switch (f.type) {
    case "textarea": case "richtext": return { ...base, type: "textarea", help: f.help, placeholder: f.placeholder };
    case "number": return { ...base, type: "number", half: true, help: f.help };
    case "date": return { ...base, type: "date", half: true, help: f.help };
    case "url": return { ...base, type: "url", half: true, help: f.help, placeholder: f.placeholder };
    case "image": return { ...base, type: "image", half: true };
    case "gallery": return { ...base, type: "images" };
    case "boolean": return { ...base, type: "bool", half: true, help: f.help };
    case "list": return { ...base, type: "list", help: f.help, placeholder: f.placeholder };
    case "select": return { ...base, type: "select", half: true, options: [["", "—"], ...(f.options ?? []).map((o) => [o, o] as [string, string])] };
    case "relation": return { ...base, type: "select", half: true, options: [["", "—"], ...(relationOpts[f.relation_type ?? ""] ?? [])] };
    default: return { ...base, type: "text", half: true, help: f.help, placeholder: f.placeholder };
  }
}

export function CollectionEntriesManager({ type, categories: initialCats, languages, canEditType }: {
  type: CollectionType; categories: CollectionCategory[]; languages: Lang[]; canEditType: boolean;
}) {
  const api = `/api/collections/${type.id}`;
  const [rows, setRows] = useState<CollectionEntry[] | null>(null);
  const [cats, setCats] = useState<CollectionCategory[]>(initialCats);
  const [tab, setTab] = useState<"entries" | "categories">("entries");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => fetch(`${api}/entries`).then(async (r) => setRows(r.ok ? await r.json() : []));
  useEffect(() => {
    fetch(`${api}/entries`).then(async (r) => setRows(r.ok ? await r.json() : []));
  }, [api]);

  const listFields = type.fields.filter((f) => f.show_in_list).slice(0, 4);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (catFilter && !r.category_ids.includes(catFilter)) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return r.title.toLowerCase().includes(q) || listFields.some((f) => displayValue(f, r.data?.[f.key]).toLowerCase().includes(q));
    });
  }, [rows, query, catFilter, statusFilter, listFields]);
  const pageRows = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const canReorder = type.sort_mode === "manual" && !query && !catFilter && !statusFilter;

  const bulk = async (set: Record<string, unknown>) => {
    const ids = [...selected];
    if (!ids.length) return;
    setBusy("bulk");
    await fetch(`${api}/entries`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, set }) });
    setRows((p) => (p ?? []).map((r) => (selected.has(r.id) ? { ...r, ...set } as CollectionEntry : r)));
    setBusy("");
  };
  const bulkDelete = async () => {
    const ids = [...selected];
    if (!ids.length || !confirm(`Delete ${ids.length} entr${ids.length === 1 ? "y" : "ies"}? This cannot be undone.`)) return;
    setBusy("bulk");
    for (let i = 0; i < ids.length; i += 200) await fetch(`${api}/entries?ids=${ids.slice(i, i + 200).join(",")}`, { method: "DELETE" });
    setRows((p) => (p ?? []).filter((r) => !selected.has(r.id)));
    setSelected(new Set());
    setBusy("");
  };
  const translate = async (lang: string) => {
    const ids = selected.size ? [...selected] : (rows ?? []).map((r) => r.id);
    if (!ids.length) return;
    if (!confirm(`Translate ${ids.length} entr${ids.length === 1 ? "y" : "ies"} into ${languages.find((l) => l.code === lang)?.name} with AI? Uses ${Math.ceil(ids.length / 20) * 10} AI Credits.`)) return;
    setBusy("translate");
    for (let i = 0; i < ids.length; i += 20) {
      setNotice(`Translating ${Math.min(i + 20, ids.length)} / ${ids.length}…`);
      const r = await fetch(`${api}/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entry_ids: ids.slice(i, i + 20), lang }) });
      if (!r.ok) { setNotice((await r.json().catch(() => ({}))).error ?? "Translation failed"); setBusy(""); return; }
    }
    setNotice("Translated.");
    setBusy("");
    load();
  };
  const move = async (id: string, d: -1 | 1) => {
    const list = [...(rows ?? [])];
    const i = list.findIndex((r) => r.id === id); const j = i + d;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setRows(list);
    await fetch(`${api}/entries`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: list.map((r) => r.id) }) });
  };
  const toggle = async (r: CollectionEntry, key: "featured" | "status") => {
    const value = key === "featured" ? !r.featured : r.status === "published" ? "draft" : "published";
    setRows((p) => (p ?? []).map((x) => (x.id === r.id ? { ...x, [key]: value } as CollectionEntry : x)));
    await fetch(`${api}/entries`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, [key]: value }) });
  };

  // ─── CSV ────────────────────────────────────────────────────────────────
  const exportCsv = () => {
    const head = ["title", "slug", "excerpt", "body", "image", "gallery", "category", "featured", "status", ...type.fields.map((f) => f.key)];
    const body = (rows ?? []).map((r) => [
      r.title, r.slug, r.excerpt, r.body, r.image_url ?? "", r.gallery.map((g) => g.url).join(" | "),
      cats.filter((c) => r.category_ids.includes(c.id)).map((c) => c.name).join(" | "), r.featured ? "yes" : "", r.status,
      ...type.fields.map((f) => { const v = r.data?.[f.key]; return Array.isArray(v) ? v.join(" | ") : v == null ? "" : String(v); }),
    ]);
    downloadText(`${type.slug}.csv`, toCsv([head, ...body]));
  };
  const importCsv = async (file: File) => {
    const table = parseCsv(await file.text());
    if (table.length < 2) { setNotice("The file has no rows."); return; }
    const head = table[0].map((h) => h.trim().toLowerCase());
    const byLabel = new Map(type.fields.flatMap((f) => [[f.key.toLowerCase(), f], [f.label.toLowerCase(), f]] as [string, CollectionField][]));
    const col = (names: string[]) => head.findIndex((h) => names.includes(h));
    const iTitle = col(["title", "name"]);
    if (iTitle < 0) { setNotice('The first row needs a "title" column.'); return; }
    setBusy("import");
    // Categories named in the file are created first.
    const iCat = col(["category", "categories"]);
    const catByName = new Map(cats.map((c) => [c.name.toLowerCase(), c.id]));
    if (iCat >= 0) {
      const names = new Set(table.slice(1).flatMap((r) => (r[iCat] ?? "").split("|").map((s) => s.trim()).filter(Boolean)));
      for (const name of names) {
        if (catByName.has(name.toLowerCase())) continue;
        const res = await fetch(`${api}/categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, sort_order: catByName.size }) });
        if (res.ok) { const c = await res.json(); catByName.set(name.toLowerCase(), c.id); setCats((p) => [...p, c]); }
      }
    }
    const get = (r: string[], names: string[]) => { const i = col(names); return i >= 0 ? (r[i] ?? "").trim() : ""; };
    const split = (s: string) => s.split("|").map((x) => x.trim()).filter(Boolean);
    const entries = table.slice(1).map((r) => {
      const data: Record<string, unknown> = {};
      head.forEach((h, i) => {
        const f = byLabel.get(h);
        if (!f) return;
        const raw = (r[i] ?? "").trim();
        if (!raw) return;
        data[f.key] = f.type === "list" || f.type === "gallery" ? split(raw)
          : f.type === "number" ? Number(raw.replace(/,/g, "")) || 0
          : f.type === "boolean" ? /^(1|yes|true|y)$/i.test(raw) : raw;
      });
      return {
        title: (r[iTitle] ?? "").trim(), slug: get(r, ["slug"]), excerpt: get(r, ["excerpt", "summary"]), body: get(r, ["body", "description", "content"]),
        image_url: get(r, ["image", "image_url", "photo"]) || null, gallery: split(get(r, ["gallery", "photos"])).map((url) => ({ url })),
        category_ids: iCat >= 0 ? split(r[iCat] ?? "").map((n) => catByName.get(n.toLowerCase())).filter(Boolean) : [],
        featured: /^(1|yes|true|y)$/i.test(get(r, ["featured"])), status: get(r, ["status"]) === "draft" ? "draft" : "published", data,
      };
    }).filter((e) => e.title);
    const res = await fetch(`${api}/entries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entries }) });
    const d = await res.json().catch(() => ({}));
    setBusy("");
    setNotice(res.ok ? `Imported ${d.inserted ?? entries.length} entries.` : d.error ?? "Import failed");
    load();
  };

  if (editing) {
    return (
      <EntryEditor type={type} cats={cats} languages={languages} initial={editing} api={api}
        onDone={(saved, deletedId) => {
          if (deletedId) setRows((p) => (p ?? []).filter((r) => r.id !== deletedId));
          else if (saved) setRows((p) => (p?.some((r) => r.id === saved.id) ? p.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...(p ?? [])]));
          setEditing(null);
        }} />
    );
  }

  const newDraft = (): Draft => ({ title: "", status: "published", featured: false, category_ids: catFilter ? [catFilter] : [], gallery: [], data: {}, translations: {} });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><TypeIcon name={type.icon} className="w-5 h-5" /></div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{type.name}</h1>
            <p className="text-sm text-muted-foreground">{rows ? `${rows.length} entries` : "Loading…"}{type.visibility === "private" ? " · dashboard only" : ""}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEditType && <Link href={`/dashboard/collections?edit=${type.id}`} className="px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted flex items-center gap-1.5"><Settings2 className="w-4 h-4" />Fields</Link>}
          <button onClick={exportCsv} disabled={!rows?.length} className="px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted flex items-center gap-1.5 disabled:opacity-50"><Download className="w-4 h-4" />Export</button>
          <button onClick={() => fileRef.current?.click()} disabled={!!busy} className="px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted flex items-center gap-1.5">{busy === "import" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}Import CSV</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ""; }} />
          <button onClick={() => setEditing(newDraft())} className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"><Plus className="w-4 h-4" />Add {(type.singular || "entry").toLowerCase()}</button>
        </div>
      </div>

      {notice && <div className="text-sm px-4 py-2 rounded-lg bg-indigo-500/10 text-foreground flex justify-between">{notice}<button onClick={() => setNotice("")}><X className="w-4 h-4" /></button></div>}

      <div className="flex gap-1 border-b border-border">
        {(["entries", "categories"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm -mb-px border-b-2 ${tab === k ? "border-indigo-500 text-foreground font-medium" : "border-transparent text-muted-foreground"}`}>
            {k === "entries" ? "Entries" : `Categories (${cats.length})`}
          </button>
        ))}
      </div>

      {tab === "categories" ? <CategoriesPanel api={api} cats={cats} setCats={setCats} languages={languages} /> : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search…" className={`${inputCls} pl-9 w-60`} />
            </div>
            {cats.length > 0 && (
              <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(0); }} className={`${inputCls} w-auto`}>
                <option value="">All categories</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className={`${inputCls} w-auto`}>
              <option value="">Any status</option><option value="published">Published</option><option value="draft">Draft</option>
            </select>
            {selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 ml-auto text-sm">
                <span className="text-muted-foreground mr-1">{selected.size} selected</span>
                <button onClick={() => bulk({ status: "published" })} className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted">Publish</button>
                <button onClick={() => bulk({ status: "draft" })} className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted">Unpublish</button>
                <button onClick={bulkDelete} className="px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-950/40">Delete</button>
              </div>
            )}
            {languages.length > 0 && (
              <div className={`flex items-center gap-1.5 ${selected.size ? "" : "ml-auto"}`}>
                <Languages className="w-4 h-4 text-muted-foreground" />
                {languages.map((l) => (
                  <button key={l.code} onClick={() => translate(l.code)} disabled={!!busy} className="px-2.5 py-1.5 rounded-lg text-sm border border-border hover:bg-muted disabled:opacity-50">
                    {busy === "translate" ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : null} AI translate to {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {rows === null ? (
            <div className="py-16 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
              <p>No {type.name.toLowerCase()} yet.</p>
              <p className="text-xs mt-1">Add them one by one, or import a CSV whose first row names the columns (title, excerpt, image, category, {type.fields.slice(0, 3).map((f) => f.key).join(", ")}…).</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b border-border">
                  <tr>
                    <th className="w-10 px-3 py-2 text-left">
                      <input type="checkbox" className="accent-indigo-500" checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))}
                        onChange={(e) => setSelected((s) => { const n = new Set(s); pageRows.forEach((r) => (e.target.checked ? n.add(r.id) : n.delete(r.id))); return n; })} />
                    </th>
                    <th className="px-3 py-2 text-left font-medium">{type.singular || "Title"}</th>
                    {listFields.map((f) => <th key={f.key} className="px-3 py-2 text-left font-medium hidden md:table-cell">{f.label}</th>)}
                    {cats.length > 0 && <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Category</th>}
                    <th className="px-3 py-2 w-32" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageRows.map((r) => {
                    const path = entryPath(type, r);
                    return (
                      <tr key={r.id} className="hover:bg-muted/60 cursor-pointer" onClick={() => setEditing({ ...r, data: r.data ?? {}, translations: r.translations ?? {} })}>
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="accent-indigo-500" checked={selected.has(r.id)}
                            onChange={(e) => setSelected((s) => { const n = new Set(s); if (e.target.checked) n.add(r.id); else n.delete(r.id); return n; })} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-3 min-w-0">
                            {r.image_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.image_url} alt="" className="w-12 h-9 rounded-md object-cover bg-muted shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate max-w-xs">{r.title}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {r.status === "draft" ? "Draft" : "Published"}
                                {Object.keys(r.translations ?? {}).length > 0 && ` · ${Object.keys(r.translations).map((l) => l.toUpperCase()).join(", ")}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        {listFields.map((f) => <td key={f.key} className="px-3 py-2 text-muted-foreground hidden md:table-cell truncate max-w-[12rem]">{displayValue(f, r.data?.[f.key])}</td>)}
                        {cats.length > 0 && <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">{cats.filter((c) => r.category_ids.includes(c.id)).map((c) => c.name).join(", ")}</td>}
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-0.5">
                            {canReorder && <>
                              <button title="Move up" onClick={() => move(r.id, -1)} className="p-1.5 rounded hover:bg-muted"><ArrowUp className="w-3.5 h-3.5" /></button>
                              <button title="Move down" onClick={() => move(r.id, 1)} className="p-1.5 rounded hover:bg-muted"><ArrowDown className="w-3.5 h-3.5" /></button>
                            </>}
                            <button title={r.status === "published" ? "Unpublish" : "Publish"} onClick={() => toggle(r, "status")} className="p-1.5 rounded hover:bg-muted">
                              {r.status === "published" ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-amber-500" />}
                            </button>
                            <button title="Featured" onClick={() => toggle(r, "featured")} className="p-1.5 rounded hover:bg-muted"><Star className={`w-4 h-4 ${r.featured ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} /></button>
                            {path && r.status === "published" && <a href={path} target="_blank" rel="noreferrer" title="View on site" className="p-1.5 rounded hover:bg-muted"><ExternalLink className="w-4 h-4 text-muted-foreground" /></a>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length > PAGE && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-border text-sm text-muted-foreground">
                  <span>{page * PAGE + 1}–{Math.min(filtered.length, (page + 1) * PAGE)} of {filtered.length}</span>
                  <div className="flex gap-1">
                    <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded border border-border disabled:opacity-40">Previous</button>
                    <button disabled={(page + 1) * PAGE >= filtered.length} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded border border-border disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────

function EntryEditor({ type, cats, languages, initial, api, onDone }: {
  type: CollectionType; cats: CollectionCategory[]; languages: Lang[]; initial: Draft; api: string;
  onDone: (saved?: CollectionEntry, deletedId?: string) => void;
}) {
  const [e, setE] = useState<Draft>(initial);
  const [lang, setLang] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [relationOpts, setRelationOpts] = useState<Record<string, [string, string][]>>({});
  const isNew = !e.id;

  // Entries of related collections for relation dropdowns.
  useEffect(() => {
    const targets = [...new Set(type.fields.filter((f) => f.type === "relation" && f.relation_type).map((f) => f.relation_type!))];
    targets.forEach(async (tid) => {
      const r = await fetch(`/api/collections/${tid}/entries`);
      if (!r.ok) return;
      const list = (await r.json()) as CollectionEntry[];
      setRelationOpts((p) => ({ ...p, [tid]: list.map((x) => [x.id, x.title]) }));
    });
  }, [type.fields]);

  const tr = lang ? e.translations[lang] ?? {} : null;
  const setCore = (k: "title" | "excerpt" | "body", v: string) => {
    if (!lang) setE((p) => ({ ...p, [k]: v }));
    else setE((p) => ({ ...p, translations: { ...p.translations, [lang]: { ...(p.translations[lang] ?? {}), [k]: v } } }));
  };
  const coreVal = (k: "title" | "excerpt" | "body") => (lang ? String(tr?.[k] ?? "") : String(e[k] ?? ""));
  const setData = (k: string, v: unknown) => {
    const f = type.fields.find((x) => x.key === k);
    if (lang && f && isTranslatable(f)) {
      setE((p) => ({ ...p, translations: { ...p.translations, [lang]: { ...(p.translations[lang] ?? {}), data: { ...(p.translations[lang]?.data ?? {}), [k]: v } } } }));
    } else setE((p) => ({ ...p, data: { ...p.data, [k]: v } }));
  };
  const fieldsShown = lang ? type.fields.filter(isTranslatable) : type.fields;
  const dataView = lang ? { ...(tr?.data ?? {}) } : e.data;

  const save = async () => {
    if (!e.title?.trim()) { setError("Title is required"); setLang(""); return; }
    const missing = type.fields.find((f) => f.required && (e.data[f.key] == null || e.data[f.key] === ""));
    if (missing) { setError(`${missing.label} is required`); setLang(""); return; }
    setSaving(true); setError("");
    const body = { ...e, gallery: (e.gallery ?? []).map((g) => (typeof g === "string" ? { url: g } : g)) };
    const res = await fetch(`${api}/entries`, { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Save failed"); return; }
    onDone(d);
  };
  const remove = async () => {
    if (!e.id || !confirm("Delete this entry? This cannot be undone.")) return;
    const res = await fetch(`${api}/entries?id=${e.id}`, { method: "DELETE" });
    if (res.ok) onDone(undefined, e.id);
  };

  const path = e.id && e.slug ? entryPath(type, { slug: e.slug }, lang || null) : undefined;

  return (
    <div className="max-w-4xl space-y-6 pb-24">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => onDone()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" />Back to {type.name.toLowerCase()}</button>
        {path && <a href={path} target="_blank" rel="noreferrer" className="text-sm text-primary flex items-center gap-1">View on site <ExternalLink className="w-3.5 h-3.5" /></a>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">{isNew ? `New ${(type.singular || "entry").toLowerCase()}` : e.title}</h1>
        {languages.length > 0 && (
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            <button onClick={() => setLang("")} className={`px-3 py-1.5 ${!lang ? "bg-indigo-600 text-white" : "hover:bg-muted"}`}>Main</button>
            {languages.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)} className={`px-3 py-1.5 border-l border-border ${lang === l.code ? "bg-indigo-600 text-white" : "hover:bg-muted"}`}>
                {l.name}{e.translations[l.code]?.title ? <Check className="w-3 h-3 inline ml-1" /> : null}
              </button>
            ))}
          </div>
        )}
      </div>
      {lang && <p className="text-xs text-muted-foreground -mt-3">Editing the {languages.find((l) => l.code === lang)?.name} text. Empty fields show the main-language text. Photos, prices and numbers are shared.</p>}

      <section className="bg-card border border-border rounded-2xl p-5 grid sm:grid-cols-2 gap-4" dir={lang && ["ar", "fa", "ur", "he"].includes(lang) ? "rtl" : undefined}>
        <label className="block sm:col-span-2"><span className="text-xs text-muted-foreground">Title *</span>
          <input className={`${inputCls} mt-1`} value={coreVal("title")} placeholder={lang ? e.title : ""} onChange={(ev) => setCore("title", ev.target.value)} />
        </label>
        <label className="block sm:col-span-2"><span className="text-xs text-muted-foreground">Short summary</span>
          <textarea className={`${inputCls} mt-1 min-h-16`} value={coreVal("excerpt")} placeholder={lang ? e.excerpt : "One or two lines shown on cards"} onChange={(ev) => setCore("excerpt", ev.target.value)} />
        </label>
        <label className="block sm:col-span-2"><span className="text-xs text-muted-foreground">Description</span>
          <textarea className={`${inputCls} mt-1 min-h-32`} value={coreVal("body")} placeholder={lang ? e.body : ""} onChange={(ev) => setCore("body", ev.target.value)} />
        </label>
        {!lang && <>
          <FieldInput f={{ key: "image_url", label: "Main image", type: "image" }} value={e.image_url} editing={e as Record<string, unknown>} set={(_, v) => setE((p) => ({ ...p, image_url: (v as string) || null }))} />
          <FieldInput f={{ key: "gallery", label: "Gallery", type: "images" }} value={(e.gallery ?? []).map((g) => (typeof g === "string" ? g : g.url))} editing={e as Record<string, unknown>}
            set={(_, v) => setE((p) => ({ ...p, gallery: (v as string[]).map((url) => ({ url })) }))} />
        </>}
      </section>

      {fieldsShown.length > 0 && (
        <section className="bg-card border border-border rounded-2xl p-5" dir={lang && ["ar", "fa", "ur", "he"].includes(lang) ? "rtl" : undefined}>
          <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide mb-4">Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {fieldsShown.map((f) => (
              <FieldInput key={f.key} f={toFieldDef(f, relationOpts)} value={dataView[f.key]} editing={dataView} set={setData} />
            ))}
          </div>
        </section>
      )}

      {!lang && (
        <section className="bg-card border border-border rounded-2xl p-5 grid sm:grid-cols-2 gap-4">
          <h2 className="sm:col-span-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">Publishing</h2>
          {cats.length > 0 && (
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Categories</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {cats.map((c) => {
                  const on = (e.category_ids ?? []).includes(c.id);
                  return (
                    <button key={c.id} type="button" onClick={() => setE((p) => ({ ...p, category_ids: on ? (p.category_ids ?? []).filter((x) => x !== c.id) : [...(p.category_ids ?? []), c.id] }))}
                      className={`px-3 py-1 rounded-full text-sm border ${on ? "bg-indigo-600 border-indigo-600 text-white" : "border-border hover:bg-muted"}`}>{c.name}</button>
                  );
                })}
              </div>
            </div>
          )}
          <label className="block"><span className="text-xs text-muted-foreground">Status</span>
            <select className={`${inputCls} mt-1`} value={e.status ?? "published"} onChange={(ev) => setE((p) => ({ ...p, status: ev.target.value as CollectionEntry["status"] }))}>
              <option value="published">Published</option><option value="draft">Draft (hidden)</option>
            </select>
          </label>
          <label className="flex items-center gap-3 pt-5">
            <input type="checkbox" className="w-4 h-4 accent-indigo-500" checked={!!e.featured} onChange={(ev) => setE((p) => ({ ...p, featured: ev.target.checked }))} />
            <span className="text-sm">Featured</span>
          </label>
          <label className="block"><span className="text-xs text-muted-foreground">URL slug</span>
            <input className={`${inputCls} mt-1`} value={e.slug ?? ""} placeholder={slugify(e.title || "auto")} onChange={(ev) => setE((p) => ({ ...p, slug: ev.target.value }))} />
          </label>
          {type.has_detail_page && <>
            <label className="block"><span className="text-xs text-muted-foreground">SEO title</span>
              <input className={`${inputCls} mt-1`} value={e.seo?.title ?? ""} onChange={(ev) => setE((p) => ({ ...p, seo: { ...(p.seo ?? {}), title: ev.target.value } }))} />
            </label>
            <label className="block sm:col-span-2"><span className="text-xs text-muted-foreground">SEO description</span>
              <input className={`${inputCls} mt-1`} value={e.seo?.description ?? ""} onChange={(ev) => setE((p) => ({ ...p, seo: { ...(p.seo ?? {}), description: ev.target.value } }))} />
            </label>
          </>}
        </section>
      )}

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

// ─── Categories ──────────────────────────────────────────────────────────────

function CategoriesPanel({ api, cats, setCats, languages }: { api: string; cats: CollectionCategory[]; setCats: React.Dispatch<React.SetStateAction<CollectionCategory[]>>; languages: Lang[] }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch(`${api}/categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), sort_order: cats.length }) });
    setBusy(false);
    if (res.ok) { const c = await res.json(); setCats((p) => [...p, c]); setName(""); }
    else alert((await res.json().catch(() => ({}))).error ?? "Could not add");
  };
  const patch = async (c: CollectionCategory, set: Partial<CollectionCategory>) => {
    setCats((p) => p.map((x) => (x.id === c.id ? { ...x, ...set } : x)));
    await fetch(`${api}/categories`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, ...set }) });
  };
  const remove = async (c: CollectionCategory) => {
    if (!confirm(`Delete category "${c.name}"? Entries keep existing, just without this category.`)) return;
    const res = await fetch(`${api}/categories?id=${c.id}`, { method: "DELETE" });
    if (res.ok) setCats((p) => p.filter((x) => x.id !== c.id));
  };
  const move = async (i: number, d: -1 | 1) => {
    const n = [...cats]; const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    setCats(n);
    await Promise.all(n.map((c, k) => fetch(`${api}/categories`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, sort_order: k }) })));
  };
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex gap-2">
        <input className={inputCls} value={name} placeholder="New category, e.g. Civil" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button onClick={add} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shrink-0"><Tag className="w-4 h-4" />Add</button>
      </div>
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {cats.length === 0 && <p className="p-6 text-sm text-muted-foreground text-center">No categories. They become filter tabs on the site.</p>}
        {cats.map((c, i) => (
          <div key={c.id} className="p-3 flex flex-wrap items-center gap-2">
            <input className={`${inputCls} flex-1 min-w-40`} defaultValue={c.name} onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && patch(c, { name: e.target.value.trim() })} />
            {languages.map((l) => (
              <input key={l.code} className={`${inputCls} w-40`} placeholder={`${l.name} name`} dir={["ar", "fa", "ur", "he"].includes(l.code) ? "rtl" : undefined}
                defaultValue={c.translations?.[l.code]?.name ?? ""}
                onBlur={(e) => patch(c, { translations: { ...(c.translations ?? {}), [l.code]: { ...(c.translations?.[l.code] ?? {}), name: e.target.value.trim() } } })} />
            ))}
            <button onClick={() => move(i, -1)} className="p-1.5 rounded hover:bg-muted"><ArrowUp className="w-3.5 h-3.5" /></button>
            <button onClick={() => move(i, 1)} className="p-1.5 rounded hover:bg-muted"><ArrowDown className="w-3.5 h-3.5" /></button>
            <button onClick={() => remove(c)} className="p-1.5 rounded hover:bg-red-950/40 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

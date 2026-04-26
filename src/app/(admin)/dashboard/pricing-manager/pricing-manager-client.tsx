"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X, Loader2, DollarSign, Star } from "lucide-react";

interface PricingPackage {
  id: string;
  table_id: string;
  name: string;
  description: string | null;
  price: string;
  price_suffix: string | null;
  is_featured: boolean;
  badge: string | null;
  cta_label: string | null;
  cta_url: string | null;
  features: string[];
  sort_order: number;
}

interface PricingTable {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  pricing_packages: PricingPackage[];
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function api(method: string, body?: unknown, params?: Record<string, string>) {
  const url = params ? `/api/pricing-manager?${new URLSearchParams(params)}` : "/api/pricing-manager";
  return fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
}

const EMPTY_PKG: Partial<PricingPackage> = {
  price: "$0", price_suffix: "/month", is_featured: false,
  cta_label: "Get Started", features: [],
};

function PackageEditor({ pkg: initial, tableId, onSave, onCancel }: {
  pkg: Partial<PricingPackage>; tableId: string;
  onSave: (pkg: PricingPackage, isNew: boolean) => void; onCancel: () => void;
}) {
  const [pkg, setPkg] = useState<Partial<PricingPackage>>({ ...EMPTY_PKG, ...initial });
  const [featuresText, setFeaturesText] = useState((initial.features ?? []).join("\n"));
  const [saving, setSaving] = useState(false);
  const isNew = !pkg.id;
  const set = (k: keyof PricingPackage, v: unknown) => setPkg(p => ({ ...p, [k]: v }));

  async function save() {
    if (!pkg.name?.trim()) return;
    setSaving(true);
    const features = featuresText.split("\n").map(s => s.trim()).filter(Boolean);
    const payload = { _type: "package", ...pkg, features, ...(isNew ? { table_id: tableId } : {}) };
    const res = await api(isNew ? "POST" : "PATCH", payload);
    const data = isNew ? await res.json() : { ...payload, id: pkg.id! };
    setSaving(false);
    onSave(data as PricingPackage, isNew);
  }

  return (
    <div className="border border-indigo-500/30 rounded-xl p-4 space-y-3 bg-indigo-950/20">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Plan Name *</label>
          <input value={pkg.name ?? ""} onChange={e => set("name", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="Starter" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Badge</label>
          <input value={pkg.badge ?? ""} onChange={e => set("badge", e.target.value || null)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="Most Popular" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Price</label>
          <input value={pkg.price ?? ""} onChange={e => set("price", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="$99" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Price Suffix</label>
          <input value={pkg.price_suffix ?? ""} onChange={e => set("price_suffix", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="/month" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea rows={2} value={pkg.description ?? ""} onChange={e => set("description", e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none" />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Features (one per line)</label>
        <textarea rows={5} value={featuresText} onChange={e => setFeaturesText(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none font-mono"
          placeholder={"5 pages\nContact form\nSEO optimization"} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">CTA Label</label>
          <input value={pkg.cta_label ?? ""} onChange={e => set("cta_label", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="Get Started" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">CTA URL</label>
          <input value={pkg.cta_url ?? ""} onChange={e => set("cta_url", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="/contact" />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={pkg.is_featured ?? false} onChange={e => set("is_featured", e.target.checked)} className="w-4 h-4 rounded" />
        <span className="text-sm text-gray-300 flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-yellow-400" /> Featured plan (highlighted)
        </span>
      </label>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !pkg.name?.trim()}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 bg-gray-700 text-white text-xs px-3 py-1.5 rounded">
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

function TableCard({ table, onUpdate, onDelete }: {
  table: PricingTable; onUpdate: (t: PricingTable) => void; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(table.name);
  const [addingPkg, setAddingPkg] = useState(false);
  const [editingPkg, setEditingPkg] = useState<string | null>(null);

  async function saveName() {
    await api("PATCH", { _type: "table", id: table.id, name, slug: slugify(name) });
    setEditingName(false);
    onUpdate({ ...table, name, slug: slugify(name) });
  }

  async function deletePkg(id: string) {
    await api("DELETE", undefined, { type: "package", id });
    onUpdate({ ...table, pricing_packages: table.pricing_packages.filter(p => p.id !== id) });
  }

  function handlePkgSaved(pkg: PricingPackage, isNew: boolean) {
    if (isNew) { onUpdate({ ...table, pricing_packages: [...table.pricing_packages, pkg] }); setAddingPkg(false); }
    else { onUpdate({ ...table, pricing_packages: table.pricing_packages.map(p => p.id === pkg.id ? pkg : p) }); setEditingPkg(null); }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(o => !o)} className="text-gray-400">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              className="flex-1 bg-gray-800 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none" />
            <button onClick={saveName}><Check className="w-4 h-4 text-indigo-400" /></button>
            <button onClick={() => { setEditingName(false); setName(table.name); }}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="font-medium text-white text-sm">{table.name}</span>
            <span className="text-xs text-gray-500">/{table.slug}</span>
            <button onClick={() => setEditingName(true)}><Pencil className="w-3 h-3 text-gray-500" /></button>
          </div>
        )}
        <span className="text-xs text-gray-500">{table.pricing_packages.length} plans</span>
        <button onClick={() => { if (confirm(`Delete pricing table "${table.name}"?`)) { api("DELETE", undefined, { type: "table", id: table.id }); onDelete(table.id); } }}
          className="text-gray-600 hover:text-red-400 ml-2"><Trash2 className="w-4 h-4" /></button>
      </div>

      {open && (
        <div className="p-4 border-t border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
            {table.pricing_packages.map(pkg => (
              editingPkg === pkg.id ? (
                <div key={pkg.id} className="col-span-full">
                  <PackageEditor pkg={pkg} tableId={table.id}
                    onSave={(u, isNew) => handlePkgSaved(u, isNew)} onCancel={() => setEditingPkg(null)} />
                </div>
              ) : (
                <div key={pkg.id} className={`relative rounded-xl p-4 border group/pkg ${pkg.is_featured ? "border-indigo-500 bg-indigo-950/30" : "border-gray-700 bg-gray-800/50"}`}>
                  {pkg.badge && (
                    <span className="absolute -top-2.5 left-4 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">{pkg.badge}</span>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white">{pkg.name}</p>
                      <p className="text-2xl font-bold text-white mt-1">{pkg.price}<span className="text-sm text-gray-400 font-normal">{pkg.price_suffix}</span></p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover/pkg:opacity-100 transition-opacity">
                      <button onClick={() => setEditingPkg(pkg.id)} className="text-gray-400 hover:text-white p-1"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deletePkg(pkg.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  {pkg.description && <p className="text-xs text-gray-400 mt-1">{pkg.description}</p>}
                  <ul className="mt-2 space-y-1">
                    {pkg.features.slice(0, 4).map((f, i) => <li key={i} className="text-xs text-gray-300 flex items-center gap-1.5"><Check className="w-3 h-3 text-green-400 flex-shrink-0" />{f}</li>)}
                    {pkg.features.length > 4 && <li className="text-xs text-gray-500">+{pkg.features.length - 4} more</li>}
                  </ul>
                </div>
              )
            ))}
          </div>

          {addingPkg ? (
            <PackageEditor pkg={{}} tableId={table.id}
              onSave={(pkg, isNew) => handlePkgSaved(pkg, isNew)} onCancel={() => setAddingPkg(false)} />
          ) : (
            <button onClick={() => setAddingPkg(true)}
              className="w-full flex items-center gap-2 border border-dashed border-gray-700 hover:border-indigo-500 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors">
              <Plus className="w-4 h-4" /> Add Plan
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function PricingManagerClient({ initialTables }: { initialTables: PricingTable[] }) {
  const [tables, setTables] = useState(initialTables);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function createTable() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await api("POST", { _type: "table", name: newName.trim(), slug: slugify(newName.trim()), sort_order: tables.length });
    const data = await res.json();
    setSaving(false);
    setTables(prev => [...prev, { ...data, pricing_packages: [] }]);
    setNewName(""); setCreating(false);
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo-400" /> Pricing
          </h1>
          <p className="text-sm text-gray-400 mt-1">Create pricing tables with plans. Load any table into the Pricing block on your pages.</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> New Table
        </button>
      </div>

      {creating && (
        <div className="bg-gray-900 border border-indigo-500/40 rounded-xl p-4 flex items-center gap-3">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createTable(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Table name (e.g. Service Packages)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          <button onClick={createTable} disabled={saving || !newName.trim()}
            className="flex items-center gap-1.5 bg-indigo-600 disabled:opacity-50 text-white text-sm px-3 py-2 rounded">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Create
          </button>
          <button onClick={() => setCreating(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
        </div>
      )}

      {tables.length === 0 && !creating ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
          <DollarSign className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No pricing tables yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tables.map(t => (
            <TableCard key={t.id} table={t}
              onUpdate={u => setTables(prev => prev.map(x => x.id === u.id ? u : x))}
              onDelete={id => setTables(prev => prev.filter(x => x.id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}

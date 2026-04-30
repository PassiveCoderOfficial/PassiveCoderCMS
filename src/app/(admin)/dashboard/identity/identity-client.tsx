"use client";

import { useState } from "react";
import { Layers, Save, Loader2, CheckCircle, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { MediaPickerInput } from "@/components/admin/media-picker-input";

interface SiteIdentity {
  id?: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  logo_width: number | null;
  logo_alt: string | null;
  favicon_url: string | null;
  site_name: string | null;
  tagline: string | null;
}

interface NavItem {
  label: string;
  url: string;
  target?: string;
  children?: NavItem[];
}

interface NavMenu {
  id: string;
  name: string;
  slug: string;
  items: NavItem[];
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function api(method: string, body?: unknown, params?: Record<string, string>) {
  const url = params ? `/api/identity?${new URLSearchParams(params)}` : "/api/identity";
  return fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
}

function NavItemEditor({ item, onChange, onDelete, depth = 0 }: {
  item: NavItem; onChange: (item: NavItem) => void; onDelete: () => void; depth?: number;
}) {
  const [open, setOpen] = useState(false);

  const addChild = () => onChange({ ...item, children: [...(item.children ?? []), { label: "New Link", url: "/" }] });
  const updateChild = (i: number, updated: NavItem) => {
    const children = [...(item.children ?? [])];
    children[i] = updated;
    onChange({ ...item, children });
  };
  const deleteChild = (i: number) => onChange({ ...item, children: item.children?.filter((_, j) => j !== i) });

  return (
    <div className={`${depth > 0 ? "ml-4 border-l border-gray-700 pl-3" : ""}`}>
      <div className="flex items-center gap-2 py-1">
        <input value={item.label} onChange={e => onChange({ ...item, label: e.target.value })}
          className="w-32 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none" placeholder="Label" />
        <input value={item.url} onChange={e => onChange({ ...item, url: e.target.value })}
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none" placeholder="/page" />
        <select value={item.target ?? "_self"} onChange={e => onChange({ ...item, target: e.target.value })}
          className="bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-white focus:outline-none">
          <option value="_self">Same tab</option>
          <option value="_blank">New tab</option>
        </select>
        {depth === 0 && (
          <button onClick={() => setOpen(o => !o)} className="text-gray-400 hover:text-white text-xs border border-gray-700 rounded px-1.5 py-1">
            {open ? "▲" : "▼"} Sub
          </button>
        )}
        <button onClick={onDelete} className="text-gray-600 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
      </div>
      {open && depth === 0 && (
        <div className="mt-1 mb-2 space-y-1">
          {(item.children ?? []).map((child, i) => (
            <NavItemEditor key={i} item={child} depth={1}
              onChange={updated => updateChild(i, updated)}
              onDelete={() => deleteChild(i)} />
          ))}
          <button onClick={addChild} className="ml-4 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add sub-link
          </button>
        </div>
      )}
    </div>
  );
}

function MenuCard({ menu, onUpdate, onDelete }: {
  menu: NavMenu; onUpdate: (m: NavMenu) => void; onDelete: (id: string) => void;
}) {
  const [items, setItems] = useState<NavItem[]>(menu.items);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(menu.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveMenu() {
    setSaving(true);
    await api("PATCH", { _type: "menu", id: menu.id, items, name, slug: slugify(name) });
    setSaving(false); setSaved(true);
    onUpdate({ ...menu, name, slug: slugify(name), items });
    setTimeout(() => setSaved(false), 2000);
  }

  const addItem = () => setItems(prev => [...prev, { label: "New Link", url: "/" }]);
  const updateItem = (i: number, updated: NavItem) => setItems(prev => { const a = [...prev]; a[i] = updated; return a; });
  const deleteItem = (i: number) => setItems(prev => prev.filter((_, j) => j !== i));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              className="bg-gray-800 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none" />
            <button onClick={() => setEditingName(false)}><Check className="w-4 h-4 text-indigo-400" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{name}</span>
            <span className="text-xs text-gray-500">/{slugify(name)}</span>
            <button onClick={() => setEditingName(true)}><Pencil className="w-3 h-3 text-gray-500" /></button>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={saveMenu} disabled={saving}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {saved ? "Saved" : "Save"}
          </button>
          <button onClick={() => { if (confirm(`Delete menu "${menu.name}"?`)) { api("DELETE", undefined, { id: menu.id }); onDelete(menu.id); } }}
            className="text-gray-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="space-y-1">
        {items.map((item, i) => (
          <NavItemEditor key={i} item={item} onChange={u => updateItem(i, u)} onDelete={() => deleteItem(i)} />
        ))}
      </div>
      <button onClick={addItem}
        className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 border border-dashed border-gray-700 hover:border-indigo-500 rounded-lg px-3 py-2 w-full transition-colors">
        <Plus className="w-3.5 h-3.5" /> Add Link
      </button>
    </div>
  );
}

export default function IdentityClient({ initialIdentity, initialMenus }: {
  initialIdentity: SiteIdentity | null;
  initialMenus: NavMenu[];
}) {
  const [identity, setIdentity] = useState<SiteIdentity>(initialIdentity ?? {
    logo_url: null, logo_dark_url: null, logo_width: 160, logo_alt: null,
    favicon_url: null, site_name: null, tagline: null,
  });
  const [menus, setMenus] = useState(initialMenus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creatingMenu, setCreatingMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");

  const set = (k: keyof SiteIdentity, v: unknown) => { setIdentity(p => ({ ...p, [k]: v })); setSaved(false); };

  async function saveIdentity() {
    setSaving(true);
    await api("POST", { _type: "identity", ...identity });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function createMenu() {
    if (!newMenuName.trim()) return;
    const res = await api("POST", { _type: "menu", name: newMenuName.trim(), slug: slugify(newMenuName.trim()), items: [] });
    const data = await res.json();
    setMenus(prev => [...prev, data]);
    setNewMenuName(""); setCreatingMenu(false);
  }

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-400" /> Identity & Navigation
        </h1>
        <p className="text-sm text-gray-400 mt-1">Logo, site name, favicon, and navigation menus.</p>
      </div>

      {/* Identity */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Site Identity</h2>
          <button onClick={saveIdentity} disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Site Name</label>
            <input value={identity.site_name ?? ""} onChange={e => set("site_name", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tagline</label>
            <input value={identity.tagline ?? ""} onChange={e => set("tagline", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>

          {/* Logo light */}
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-2">Logo (light mode)</label>
            <MediaPickerInput
              value={identity.logo_url ?? ""}
              onChange={url => set("logo_url", url || null)}
              placeholder="https://..."
            />
          </div>

          {/* Logo dark */}
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-2">
              Logo (dark mode) <span className="text-gray-600">— optional, leave blank to use same logo</span>
            </label>
            <MediaPickerInput
              value={identity.logo_dark_url ?? ""}
              onChange={url => set("logo_dark_url", url || null)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Logo Alt Text</label>
            <input value={identity.logo_alt ?? ""} onChange={e => set("logo_alt", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Logo Width (px)</label>
            <input type="number" value={identity.logo_width ?? 160} onChange={e => set("logo_width", Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>

          {/* Favicon */}
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-2">Favicon</label>
            <MediaPickerInput
              value={identity.favicon_url ?? ""}
              onChange={url => set("favicon_url", url || null)}
              placeholder="https://..."
            />
          </div>
        </div>
      </section>

      {/* Nav Menus */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Navigation Menus</h2>
          <button onClick={() => setCreatingMenu(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg">
            <Plus className="w-4 h-4" /> New Menu
          </button>
        </div>

        {creatingMenu && (
          <div className="flex items-center gap-3 bg-gray-900 border border-indigo-500/40 rounded-xl p-4">
            <input autoFocus value={newMenuName} onChange={e => setNewMenuName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createMenu(); if (e.key === "Escape") setCreatingMenu(false); }}
              placeholder='Menu name (e.g. "Main Nav", "Footer")'
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            <button onClick={createMenu} disabled={!newMenuName.trim()}
              className="flex items-center gap-1.5 bg-indigo-600 disabled:opacity-50 text-white text-sm px-3 py-2 rounded">
              <Check className="w-4 h-4" /> Create
            </button>
            <button onClick={() => setCreatingMenu(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
          </div>
        )}

        {menus.length === 0 && !creatingMenu ? (
          <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
            <p className="text-gray-400 text-sm">No menus yet. Create a main nav or footer menu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {menus.map(m => (
              <MenuCard key={m.id} menu={m}
                onUpdate={u => setMenus(prev => prev.map(x => x.id === u.id ? u : x))}
                onDelete={id => setMenus(prev => prev.filter(x => x.id !== id))} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

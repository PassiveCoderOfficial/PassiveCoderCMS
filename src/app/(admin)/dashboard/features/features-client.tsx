"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, Pencil, Check, X, Loader2, Sparkles } from "lucide-react";

type IconType = "lucide" | "image" | "emoji";

interface FeatureItem {
  id: string;
  group_id: string;
  title: string;
  description: string;
  icon_type: IconType;
  icon: string | null;
  image_url: string | null;
  link: string | null;
  link_label: string | null;
  sort_order: number;
}

interface FeatureGroup {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  feature_items: FeatureItem[];
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function api(method: string, body?: unknown, params?: Record<string, string>) {
  const url = params ? `/api/features?${new URLSearchParams(params)}` : "/api/features";
  return fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function ItemEditor({ item: initial, groupId, onSave, onCancel }: {
  item: Partial<FeatureItem>; groupId: string;
  onSave: (item: FeatureItem, isNew: boolean) => void; onCancel: () => void;
}) {
  const [item, setItem] = useState<Partial<FeatureItem>>({ icon_type: "lucide", ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof FeatureItem, v: string) => setItem(p => ({ ...p, [k]: v }));
  const isNew = !item.id;

  async function save() {
    if (!item.title?.trim()) return;
    setSaving(true);
    const res = await api(isNew ? "POST" : "PATCH", {
      _type: "item", ...(isNew ? { group_id: groupId } : {}), ...item,
    });
    const data = isNew ? await res.json() : { ...item, id: item.id! };
    setSaving(false);
    onSave(data as FeatureItem, isNew);
  }

  return (
    <div className="border border-indigo-500/30 rounded-lg p-4 space-y-3 bg-indigo-950/20">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Title *</label>
          <input value={item.title ?? ""} onChange={e => set("title", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Icon Type</label>
          <select value={item.icon_type ?? "lucide"} onChange={e => set("icon_type", e.target.value as IconType)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
            <option value="lucide">Lucide Icon</option>
            <option value="emoji">Emoji</option>
            <option value="image">Image URL</option>
          </select>
        </div>
      </div>
      {item.icon_type !== "image" ? (
        <div>
          <label className="block text-xs text-gray-400 mb-1">{item.icon_type === "emoji" ? "Emoji" : "Icon Name"}</label>
          <input value={item.icon ?? ""} onChange={e => set("icon", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
            placeholder={item.icon_type === "emoji" ? "✨" : "Sparkles"} />
        </div>
      ) : (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Image URL</label>
          <input value={item.image_url ?? ""} onChange={e => set("image_url", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea rows={2} value={item.description ?? ""} onChange={e => set("description", e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Link URL</label>
          <input value={item.link ?? ""} onChange={e => set("link", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Link Label</label>
          <input value={item.link_label ?? ""} onChange={e => set("link_label", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !item.title?.trim()}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded">
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

function GroupCard({ group, onUpdate, onDelete }: {
  group: FeatureGroup;
  onUpdate: (g: FeatureGroup) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(group.name);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  async function saveName() {
    await api("PATCH", { _type: "group", id: group.id, name, slug: slugify(name) });
    setEditingName(false);
    onUpdate({ ...group, name, slug: slugify(name) });
  }

  async function deleteGroup() {
    if (!confirm(`Delete group "${group.name}"?`)) return;
    await api("DELETE", undefined, { type: "group", id: group.id });
    onDelete(group.id);
  }

  async function deleteItem(id: string) {
    await api("DELETE", undefined, { type: "item", id });
    onUpdate({ ...group, feature_items: group.feature_items.filter(i => i.id !== id) });
  }

  function handleItemSaved(item: FeatureItem, isNew: boolean) {
    if (isNew) {
      onUpdate({ ...group, feature_items: [...group.feature_items, item] });
      setAddingItem(false);
    } else {
      onUpdate({ ...group, feature_items: group.feature_items.map(i => i.id === item.id ? item : i) });
      setEditingItem(null);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(o => !o)} className="text-gray-400 hover:text-white">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <GripVertical className="w-4 h-4 text-gray-600" />
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              className="flex-1 bg-gray-800 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none" />
            <button onClick={saveName} className="text-indigo-400"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setEditingName(false); setName(group.name); }} className="text-gray-400"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="font-medium text-white text-sm">{group.name}</span>
            <span className="text-xs text-gray-500">/{group.slug}</span>
            <button onClick={() => setEditingName(true)} className="ml-1 text-gray-500 hover:text-gray-300"><Pencil className="w-3 h-3" /></button>
          </div>
        )}
        <span className="text-xs text-gray-500">{group.feature_items.length} item{group.feature_items.length !== 1 ? "s" : ""}</span>
        <button onClick={deleteGroup} className="text-gray-600 hover:text-red-400 ml-2"><Trash2 className="w-4 h-4" /></button>
      </div>

      {open && (
        <div className="p-4 space-y-3 border-t border-gray-800">
          {group.feature_items.map(item => (
            editingItem === item.id ? (
              <ItemEditor key={item.id} item={item} groupId={group.id}
                onSave={(u, isNew) => handleItemSaved(u, isNew)} onCancel={() => setEditingItem(null)} />
            ) : (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg group/item">
                <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-700 flex-shrink-0 text-sm">
                  {item.icon_type === "emoji" ? item.icon : item.icon_type === "image"
                    ? <img src={item.image_url ?? ""} className="w-6 h-6 object-contain" alt="" />
                    : <Sparkles className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <button onClick={() => setEditingItem(item.id)} className="text-gray-400 hover:text-white p-1"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )
          ))}
          {addingItem ? (
            <ItemEditor item={{ icon_type: "lucide" }} groupId={group.id}
              onSave={(item, isNew) => handleItemSaved(item, isNew)} onCancel={() => setAddingItem(false)} />
          ) : (
            <button onClick={() => setAddingItem(true)}
              className="w-full flex items-center gap-2 border border-dashed border-gray-700 hover:border-indigo-500 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors">
              <Plus className="w-4 h-4" /> Add Feature Item
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function FeaturesClient({ initialGroups }: { initialGroups: FeatureGroup[] }) {
  const [groups, setGroups] = useState<FeatureGroup[]>(initialGroups);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function createGroup() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await api("POST", { _type: "group", name: newName.trim(), slug: slugify(newName.trim()), sort_order: groups.length });
    const data = await res.json();
    setSaving(false);
    setGroups(prev => [...prev, { ...data, feature_items: [] }]);
    setNewName(""); setCreating(false);
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" /> Features
          </h1>
          <p className="text-sm text-gray-400 mt-1">Feature blurb groups shown in Features blocks on your pages.</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> New Group
        </button>
      </div>

      {creating && (
        <div className="bg-gray-900 border border-indigo-500/40 rounded-xl p-4 flex items-center gap-3">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createGroup(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Group name (e.g. Why Choose Us)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          <button onClick={createGroup} disabled={saving || !newName.trim()}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-3 py-2 rounded">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Create
          </button>
          <button onClick={() => setCreating(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
      )}

      {groups.length === 0 && !creating ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
          <Sparkles className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No feature groups yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <GroupCard key={group.id} group={group}
              onUpdate={u => setGroups(prev => prev.map(g => g.id === u.id ? u : g))}
              onDelete={id => setGroups(prev => prev.filter(g => g.id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X, Loader2, Star as StarIcon, Eye, EyeOff, Copy } from "lucide-react";
import { MediaPickerInput } from "@/components/admin/media-picker-input";

interface Testimonial {
  id: string;
  group_id: string;
  source: "custom" | "google" | "trustpilot" | "facebook";
  name: string;
  role: string | null;
  company: string | null;
  avatar: string | null;
  content: string;
  rating: number | null;
  external_id: string | null;
  published: boolean;
  sort_order: number;
}

interface TestimonialGroup {
  id: string;
  name: string;
  slug: string;
  show_custom: boolean;
  show_google: boolean;
  show_trustpilot: boolean;
  show_facebook: boolean;
  google_place_id: string | null;
  trustpilot_domain: string | null;
  facebook_page_id: string | null;
  sort_order: number;
  testimonials: Testimonial[];
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function api(method: string, body?: unknown, params?: Record<string, string>) {
  const url = params ? `/api/testimonials?${new URLSearchParams(params)}` : "/api/testimonials";
  return fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <StarIcon className={`w-4 h-4 ${n <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
        </button>
      ))}
    </div>
  );
}

function ItemEditor({ item: initial, groupId, onSave, onCancel }: {
  item: Partial<Testimonial>; groupId: string;
  onSave: (item: Testimonial, isNew: boolean) => void; onCancel: () => void;
}) {
  const [item, setItem] = useState<Partial<Testimonial>>({ source: "custom", published: true, rating: 5, ...initial });
  const [saving, setSaving] = useState(false);
  const isNew = !item.id;
  const set = (k: keyof Testimonial, v: unknown) => setItem(p => ({ ...p, [k]: v }));

  async function save() {
    if (!item.name?.trim() || !item.content?.trim()) return;
    setSaving(true);
    const res = await api(isNew ? "POST" : "PATCH", {
      _type: "item", ...(isNew ? { group_id: groupId } : {}), ...item,
    });
    const data = isNew ? await res.json() : { ...item, id: item.id! };
    setSaving(false);
    onSave(data as Testimonial, isNew);
  }

  return (
    <div className="border border-indigo-500/30 rounded-lg p-4 space-y-3 bg-indigo-950/20">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name *</label>
          <input value={item.name ?? ""} onChange={e => set("name", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Source</label>
          <select value={item.source ?? "custom"} onChange={e => set("source", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
            <option value="custom">Custom</option>
            <option value="google">Google</option>
            <option value="trustpilot">Trustpilot</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Role / Title</label>
          <input value={item.role ?? ""} onChange={e => set("role", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="CEO" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Company</label>
          <input value={item.company ?? ""} onChange={e => set("company", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Review *</label>
        <textarea rows={3} value={item.content ?? ""} onChange={e => set("content", e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none" />
      </div>
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Rating</label>
          <StarRating value={item.rating ?? 5} onChange={v => set("rating", v)} />
        </div>
        <div className="w-48">
          <label className="block text-xs text-gray-400 mb-1">Avatar</label>
          <MediaPickerInput compact value={item.avatar ?? ""} onChange={v => set("avatar", v)} />
        </div>
        <label className="flex items-center gap-2 mt-4 cursor-pointer">
          <input type="checkbox" checked={item.published ?? true} onChange={e => set("published", e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm text-gray-300">Published</span>
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !item.name?.trim() || !item.content?.trim()}
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

function GroupCard({ group, onUpdate, onDelete }: {
  group: TestimonialGroup; onUpdate: (g: TestimonialGroup) => void; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(group.name);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showPlatform, setShowPlatform] = useState(false);

  async function saveName() {
    await api("PATCH", { _type: "group", id: group.id, name, slug: slugify(name) });
    setEditingName(false);
    onUpdate({ ...group, name, slug: slugify(name) });
  }

  async function togglePublish(item: Testimonial) {
    await api("PATCH", { _type: "item", id: item.id, published: !item.published });
    onUpdate({ ...group, testimonials: group.testimonials.map(t => t.id === item.id ? { ...t, published: !t.published } : t) });
  }

  async function deleteItem(id: string) {
    await api("DELETE", undefined, { type: "item", id });
    onUpdate({ ...group, testimonials: group.testimonials.filter(t => t.id !== id) });
  }

  async function duplicateItem(item: Testimonial) {
    const res = await api("POST", {
      _type: "item", group_id: group.id,
      source: item.source, name: item.name + " (copy)", role: item.role,
      company: item.company, avatar: item.avatar, content: item.content,
      rating: item.rating, published: false, sort_order: group.testimonials.length,
    });
    const data = await res.json();
    onUpdate({ ...group, testimonials: [...group.testimonials, data as Testimonial] });
  }

  async function savePlatformSettings(settings: Partial<TestimonialGroup>) {
    await api("PATCH", { _type: "group", id: group.id, ...settings });
    onUpdate({ ...group, ...settings });
  }

  function handleItemSaved(item: Testimonial, isNew: boolean) {
    if (isNew) { onUpdate({ ...group, testimonials: [...group.testimonials, item] }); setAddingItem(false); }
    else { onUpdate({ ...group, testimonials: group.testimonials.map(t => t.id === item.id ? item : t) }); setEditingItem(null); }
  }

  const sourceBadge = (source: string) => {
    const colors: Record<string, string> = { custom: "bg-indigo-900/50 text-indigo-300", google: "bg-blue-900/50 text-blue-300", trustpilot: "bg-green-900/50 text-green-300", facebook: "bg-blue-800/50 text-blue-200" };
    return <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${colors[source] ?? "bg-gray-800 text-gray-400"}`}>{source}</span>;
  };

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
            <button onClick={() => { setEditingName(false); setName(group.name); }}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="font-medium text-white text-sm">{group.name}</span>
            <button onClick={() => setEditingName(true)}><Pencil className="w-3 h-3 text-gray-500" /></button>
          </div>
        )}
        <button onClick={() => setShowPlatform(s => !s)} className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded px-2 py-1">
          Platform Settings
        </button>
        <span className="text-xs text-gray-500">{group.testimonials.length} reviews</span>
        <button onClick={() => { if (confirm(`Delete group "${group.name}"?`)) { api("DELETE", undefined, { type: "group", id: group.id }); onDelete(group.id); } }}
          className="text-gray-600 hover:text-red-400 ml-2"><Trash2 className="w-4 h-4" /></button>
      </div>

      {showPlatform && (
        <div className="px-4 pb-4 border-t border-gray-800 pt-4 space-y-3">
          <p className="text-xs text-gray-400 font-medium">Platform Integrations</p>
          <div className="grid grid-cols-2 gap-3">
            {(["custom", "google", "trustpilot", "facebook"] as const).map(p => (
              <label key={p} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox"
                  checked={group[`show_${p}` as keyof TestimonialGroup] as boolean}
                  onChange={e => savePlatformSettings({ [`show_${p}`]: e.target.checked })}
                  className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-300 capitalize">Show {p}</span>
              </label>
            ))}
          </div>
          {group.show_google && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Google Place ID</label>
              <input defaultValue={group.google_place_id ?? ""} onBlur={e => savePlatformSettings({ google_place_id: e.target.value || null })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          )}
          {group.show_trustpilot && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Trustpilot Domain</label>
              <input defaultValue={group.trustpilot_domain ?? ""} onBlur={e => savePlatformSettings({ trustpilot_domain: e.target.value || null })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="yourbusiness.com" />
            </div>
          )}
          {group.show_facebook && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Facebook Page ID</label>
              <input defaultValue={group.facebook_page_id ?? ""} onBlur={e => savePlatformSettings({ facebook_page_id: e.target.value || null })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="p-4 space-y-3 border-t border-gray-800">
          {group.testimonials.map(item => (
            editingItem === item.id ? (
              <ItemEditor key={item.id} item={item} groupId={group.id}
                onSave={(u, isNew) => handleItemSaved(u, isNew)} onCancel={() => setEditingItem(null)} />
            ) : (
              <div key={item.id} className={`p-3 rounded-lg border group/item ${item.published ? "bg-gray-800/50 border-gray-700" : "bg-gray-900 border-gray-800 opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.avatar && <img src={item.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />}
                      <span className="text-sm font-medium text-white">{item.name}</span>
                      {item.role && <span className="text-xs text-gray-400">{item.role}{item.company ? ` @ ${item.company}` : ""}</span>}
                      {sourceBadge(item.source)}
                    </div>
                    {item.rating && (
                      <div className="flex gap-0.5 mb-1">
                        {[1,2,3,4,5].map(n => <StarIcon key={n} className={`w-3 h-3 ${n <= item.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />)}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 line-clamp-2">{item.content}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => togglePublish(item)} className="text-gray-400 hover:text-white p-1">
                      {item.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setEditingItem(item.id)} className="text-gray-400 hover:text-white p-1"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => duplicateItem(item)} className="text-gray-400 hover:text-green-400 p-1" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            )
          ))}

          {addingItem ? (
            <ItemEditor item={{ source: "custom", published: true, rating: 5 }} groupId={group.id}
              onSave={(item, isNew) => handleItemSaved(item, isNew)} onCancel={() => setAddingItem(false)} />
          ) : (
            <button onClick={() => setAddingItem(true)}
              className="w-full flex items-center gap-2 border border-dashed border-gray-700 hover:border-indigo-500 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors">
              <Plus className="w-4 h-4" /> Add Review
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestimonialsClient({ initialGroups }: { initialGroups: TestimonialGroup[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function createGroup() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await api("POST", {
      _type: "group", name: newName.trim(), slug: slugify(newName.trim()),
      show_custom: true, show_google: false, show_trustpilot: false, show_facebook: false,
      sort_order: groups.length,
    });
    const data = await res.json();
    setSaving(false);
    setGroups(prev => [...prev, { ...data, testimonials: [] }]);
    setNewName(""); setCreating(false);
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <StarIcon className="w-6 h-6 text-yellow-400" /> Testimonials
          </h1>
          <p className="text-sm text-gray-400 mt-1">Customer reviews and ratings. Supports Google, Trustpilot, and Facebook platform reviews.</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> New Group
        </button>
      </div>

      {creating && (
        <div className="bg-gray-900 border border-indigo-500/40 rounded-xl p-4 flex items-center gap-3">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createGroup(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Group name (e.g. Customer Reviews)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          <button onClick={createGroup} disabled={saving || !newName.trim()}
            className="flex items-center gap-1.5 bg-indigo-600 disabled:opacity-50 text-white text-sm px-3 py-2 rounded">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Create
          </button>
          <button onClick={() => setCreating(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
        </div>
      )}

      {groups.length === 0 && !creating ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
          <StarIcon className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No testimonial groups yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(g => (
            <GroupCard key={g.id} group={g}
              onUpdate={u => setGroups(prev => prev.map(x => x.id === u.id ? u : x))}
              onDelete={id => setGroups(prev => prev.filter(x => x.id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}

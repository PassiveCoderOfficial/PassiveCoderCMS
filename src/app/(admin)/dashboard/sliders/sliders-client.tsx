"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X, Loader2, SlidersHorizontal, Save, CheckCircle } from "lucide-react";

interface SliderSlide {
  id: string;
  group_id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  button_label: string | null;
  button_url: string | null;
  text_color: string | null;
  overlay: boolean;
  sort_order: number;
}

interface SliderGroup {
  id: string;
  name: string;
  slug: string;
  auto_play: boolean;
  interval_ms: number;
  show_arrows: boolean;
  show_dots: boolean;
  height: string;
  sort_order: number;
  slider_slides: SliderSlide[];
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function api(method: string, body?: unknown, params?: Record<string, string>) {
  const url = params ? `/api/sliders?${new URLSearchParams(params)}` : "/api/sliders";
  return fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
}

function SlideEditor({ slide: initial, groupId, onSave, onCancel }: {
  slide: Partial<SliderSlide>; groupId: string;
  onSave: (slide: SliderSlide, isNew: boolean) => void; onCancel: () => void;
}) {
  const [slide, setSlide] = useState<Partial<SliderSlide>>({ text_color: "#ffffff", overlay: true, ...initial });
  const [saving, setSaving] = useState(false);
  const isNew = !slide.id;
  const set = (k: keyof SliderSlide, v: unknown) => setSlide(p => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    const res = await api(isNew ? "POST" : "PATCH", { _type: "slide", ...(isNew ? { group_id: groupId } : {}), ...slide });
    const data = isNew ? await res.json() : { ...slide, id: slide.id! };
    setSaving(false);
    onSave(data as SliderSlide, isNew);
  }

  return (
    <div className="border border-indigo-500/30 rounded-lg p-4 space-y-3 bg-indigo-950/20">
      {slide.image_url && (
        <div className="w-full h-24 rounded-lg overflow-hidden">
          <img src={slide.image_url} className="w-full h-full object-cover" alt="" />
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Background Image URL</label>
        <input value={slide.image_url ?? ""} onChange={e => set("image_url", e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Title</label>
          <input value={slide.title ?? ""} onChange={e => set("title", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Subtitle</label>
          <input value={slide.subtitle ?? ""} onChange={e => set("subtitle", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea rows={2} value={slide.description ?? ""} onChange={e => set("description", e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Button Label</label>
          <input value={slide.button_label ?? ""} onChange={e => set("button_label", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Button URL</label>
          <input value={slide.button_url ?? ""} onChange={e => set("button_url", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Text Color</label>
          <div className="flex gap-2">
            <input type="color" value={slide.text_color ?? "#ffffff"} onChange={e => set("text_color", e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <input value={slide.text_color ?? "#ffffff"} onChange={e => set("text_color", e.target.value)}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>
        <label className="flex items-center gap-2 mt-4 cursor-pointer">
          <input type="checkbox" checked={slide.overlay ?? true} onChange={e => set("overlay", e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm text-gray-300">Dark overlay</span>
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving}
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
  group: SliderGroup; onUpdate: (g: SliderGroup) => void; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(group.name);
  const [editingSlide, setEditingSlide] = useState<string | null>(null);
  const [addingSlide, setAddingSlide] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);
  const [settings, setSettings] = useState({
    auto_play: group.auto_play, interval_ms: group.interval_ms,
    show_arrows: group.show_arrows, show_dots: group.show_dots, height: group.height,
  });

  async function saveName() {
    await api("PATCH", { _type: "group", id: group.id, name, slug: slugify(name) });
    setEditingName(false);
    onUpdate({ ...group, name, slug: slugify(name) });
  }

  async function saveSettings() {
    setSavingSettings(true);
    await api("PATCH", { _type: "group", id: group.id, ...settings });
    setSavingSettings(false); setSavedSettings(true);
    onUpdate({ ...group, ...settings });
    setTimeout(() => setSavedSettings(false), 2000);
  }

  async function deleteSlide(id: string) {
    await api("DELETE", undefined, { type: "slide", id });
    onUpdate({ ...group, slider_slides: group.slider_slides.filter(s => s.id !== id) });
  }

  function handleSlideSaved(slide: SliderSlide, isNew: boolean) {
    if (isNew) { onUpdate({ ...group, slider_slides: [...group.slider_slides, slide] }); setAddingSlide(false); }
    else { onUpdate({ ...group, slider_slides: group.slider_slides.map(s => s.id === slide.id ? slide : s) }); setEditingSlide(null); }
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
            <button onClick={() => { setEditingName(false); setName(group.name); }}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="font-medium text-white text-sm">{group.name}</span>
            <span className="text-xs text-gray-500">/{group.slug}</span>
            <button onClick={() => setEditingName(true)}><Pencil className="w-3 h-3 text-gray-500" /></button>
          </div>
        )}
        <span className="text-xs text-gray-500">{group.slider_slides.length} slides</span>
        <button onClick={() => { if (confirm(`Delete slider "${group.name}"?`)) { api("DELETE", undefined, { type: "group", id: group.id }); onDelete(group.id); } }}
          className="text-gray-600 hover:text-red-400 ml-2"><Trash2 className="w-4 h-4" /></button>
      </div>

      {open && (
        <div className="border-t border-gray-800">
          {/* Settings */}
          <div className="p-4 border-b border-gray-800 bg-gray-900/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.auto_play} onChange={e => setSettings(p => ({ ...p, auto_play: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-xs text-gray-300">Auto Play</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.show_arrows} onChange={e => setSettings(p => ({ ...p, show_arrows: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-xs text-gray-300">Arrows</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.show_dots} onChange={e => setSettings(p => ({ ...p, show_dots: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-xs text-gray-300">Dots</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 flex-shrink-0">Height</label>
                <input value={settings.height} onChange={e => setSettings(p => ({ ...p, height: e.target.value }))}
                  className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none" placeholder="500px" />
              </div>
            </div>
            {settings.auto_play && (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-gray-400">Interval (ms)</label>
                <input type="number" value={settings.interval_ms} onChange={e => setSettings(p => ({ ...p, interval_ms: Number(e.target.value) }))}
                  className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none" />
              </div>
            )}
            <button onClick={saveSettings} disabled={savingSettings} className="mt-2 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
              {savingSettings ? <Loader2 className="w-3 h-3 animate-spin" /> : savedSettings ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
              {savedSettings ? "Saved" : "Save Settings"}
            </button>
          </div>

          {/* Slides */}
          <div className="p-4 space-y-3">
            {group.slider_slides.map(slide => (
              editingSlide === slide.id ? (
                <SlideEditor key={slide.id} slide={slide} groupId={group.id}
                  onSave={(u, isNew) => handleSlideSaved(u, isNew)} onCancel={() => setEditingSlide(null)} />
              ) : (
                <div key={slide.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg group/slide">
                  {slide.image_url ? (
                    <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0">
                      <img src={slide.image_url} className="w-full h-full object-cover" alt="" />
                    </div>
                  ) : (
                    <div className="w-16 h-10 rounded bg-gray-700 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{slide.title ?? "Untitled Slide"}</p>
                    {slide.subtitle && <p className="text-xs text-gray-400 truncate">{slide.subtitle}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover/slide:opacity-100 transition-opacity">
                    <button onClick={() => setEditingSlide(slide.id)} className="text-gray-400 hover:text-white p-1"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteSlide(slide.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )
            ))}

            {addingSlide ? (
              <SlideEditor slide={{}} groupId={group.id}
                onSave={(slide, isNew) => handleSlideSaved(slide, isNew)} onCancel={() => setAddingSlide(false)} />
            ) : (
              <button onClick={() => setAddingSlide(true)}
                className="w-full flex items-center gap-2 border border-dashed border-gray-700 hover:border-indigo-500 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors">
                <Plus className="w-4 h-4" /> Add Slide
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SlidersClient({ initialGroups }: { initialGroups: SliderGroup[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function createGroup() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await api("POST", {
      _type: "group", name: newName.trim(), slug: slugify(newName.trim()),
      auto_play: true, interval_ms: 5000, show_arrows: true, show_dots: true,
      height: "500px", sort_order: groups.length,
    });
    const data = await res.json();
    setSaving(false);
    setGroups(prev => [...prev, { ...data, slider_slides: [] }]);
    setNewName(""); setCreating(false);
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-indigo-400" /> Sliders
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage slider groups with slides. Load any slider into the Slider block on your pages.</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> New Slider
        </button>
      </div>

      {creating && (
        <div className="bg-gray-900 border border-indigo-500/40 rounded-xl p-4 flex items-center gap-3">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createGroup(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Slider name (e.g. Homepage Hero)"
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
          <SlidersHorizontal className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No sliders yet.</p>
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

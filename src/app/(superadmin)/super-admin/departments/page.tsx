"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Plus, Trash2, Pencil, Check, X, Loader2, GripVertical } from "lucide-react";

interface Dept {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const supabase = createClient();

export default function DepartmentsPage() {
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("support_departments").select("*").order("sort_order").then(({ data }) => {
      setDepts(data ?? []);
      setLoading(false);
    });
  }, []);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  function handleNameChange(v: string) {
    setForm(f => ({ ...f, name: v, slug: editingId ? f.slug : slugify(v) }));
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { name: form.name.trim(), slug: form.slug || slugify(form.name.trim()), description: form.description.trim() || null, is_active: form.is_active };
    if (editingId) {
      const { error } = await supabase.from("support_departments").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      setDepts(prev => prev.map(d => d.id === editingId ? { ...d, ...payload } : d));
      setEditingId(null);
    } else {
      const { data, error } = await supabase.from("support_departments")
        .insert({ ...payload, sort_order: depts.length }).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      setDepts(prev => [...prev, data as Dept]);
      setAdding(false);
    }
    setForm({ name: "", slug: "", description: "", is_active: true });
    setSaving(false);
    toast.success("Saved");
  }

  function startEdit(d: Dept) {
    setEditingId(d.id);
    setForm({ name: d.name, slug: d.slug, description: d.description ?? "", is_active: d.is_active });
    setAdding(false);
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete department "${name}"? Existing tickets will retain the old department name.`)) return;
    await supabase.from("support_departments").delete().eq("id", id);
    setDepts(prev => prev.filter(d => d.id !== id));
    toast.success("Deleted");
  }

  async function toggleActive(d: Dept) {
    await supabase.from("support_departments").update({ is_active: !d.is_active }).eq("id", d.id);
    setDepts(prev => prev.map(x => x.id === d.id ? { ...x, is_active: !x.is_active } : x));
  }

  const FormPanel = () => (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-white text-sm">{editingId ? "Edit Department" : "New Department"}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-gray-400 mb-1 block">Name *</Label>
          <input value={form.name} onChange={e => handleNameChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            placeholder="Technical Support" />
        </div>
        <div>
          <Label className="text-xs text-gray-400 mb-1 block">Slug</Label>
          <input value={form.slug} onChange={e => set("slug", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            placeholder="technical-support" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-gray-400 mb-1 block">Description</Label>
          <input value={form.description} onChange={e => set("description", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            placeholder="Optional description shown to users" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.is_active} onCheckedChange={v => set("is_active", v)} id="active" />
          <label htmlFor="active" className="text-sm text-gray-300">Active</label>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !form.name.trim()}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {editingId ? "Update" : "Create"}
        </button>
        <button onClick={() => { setAdding(false); setEditingId(null); setForm({ name: "", slug: "", description: "", is_active: true }); }}
          className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" /> Support Departments
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage departments users can route tickets to. Deleted departments are retained on existing tickets.</p>
        </div>
        {!adding && !editingId && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
            <Plus className="w-4 h-4" /> Add Department
          </button>
        )}
      </div>

      {adding && !editingId && <FormPanel />}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
      ) : (
        <div className="space-y-2">
          {depts.map(d => (
            editingId === d.id ? <FormPanel key={d.id} /> : (
              <div key={d.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 ${!d.is_active ? "opacity-50" : ""}`}>
                <GripVertical className="w-4 h-4 text-gray-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white text-sm">{d.name}</p>
                    <span className="text-xs font-mono text-gray-500">/{d.slug}</span>
                    {!d.is_active && <span className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">Inactive</span>}
                  </div>
                  {d.description && <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={d.is_active} onCheckedChange={() => toggleActive(d)} />
                  <button onClick={() => startEdit(d)} className="text-gray-500 hover:text-white p-1 rounded"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(d.id, d.name)} className="text-gray-600 hover:text-red-400 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )
          ))}
          {depts.length === 0 && !adding && (
            <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl text-gray-600">
              No departments yet. Add your first one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

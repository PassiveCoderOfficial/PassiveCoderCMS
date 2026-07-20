"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const formPanel = (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="font-semibold text-sm">{editingId ? "Edit Department" : "New Department"}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Technical Support" />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="technical-support" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Optional description shown to users" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={v => set("is_active", v)} id="active" />
            <Label htmlFor="active" className="font-normal">Active</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {editingId ? "Update" : "Create"}
          </Button>
          <Button variant="secondary" onClick={() => { setAdding(false); setEditingId(null); setForm({ name: "", slug: "", description: "", is_active: true }); }}>
            <X className="w-4 h-4" /> Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-500" /> Support Departments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage departments users can route tickets to. Deleted departments are retained on existing tickets.</p>
        </div>
        {!adding && !editingId && (
          <Button onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        )}
      </div>

      {adding && !editingId && formPanel}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {depts.map(d => (
            editingId === d.id ? <div key={d.id}>{formPanel}</div> : (
              <Card key={d.id} className={!d.is_active ? "opacity-50" : ""}>
                <CardContent className="p-4 flex items-center gap-4">
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{d.name}</p>
                      <span className="text-xs font-mono text-muted-foreground">/{d.slug}</span>
                      {!d.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    {d.description && <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={d.is_active} onCheckedChange={() => toggleActive(d)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(d)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(d.id, d.name)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
          {depts.length === 0 && !adding && (
            <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground">
              No departments yet. Add your first one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

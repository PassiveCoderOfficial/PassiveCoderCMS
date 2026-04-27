"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tag, Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const supabase = createClient();

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("*").eq("type", "product").order("name").then(({ data }) => {
      setCategories(data ?? []);
      setLoading(false);
    });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleNameChange(v: string) {
    setForm(f => ({ ...f, name: v, slug: editingId ? f.slug : slugify(v) }));
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { name: form.name.trim(), slug: form.slug || slugify(form.name.trim()), description: form.description.trim() || null, type: "product" };
    if (editingId) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      setCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...payload } : c));
      setEditingId(null);
    } else {
      const { data, error } = await supabase.from("categories").insert(payload).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      setCategories(prev => [...prev, data as Category].sort((a, b) => a.name.localeCompare(b.name)));
      setAdding(false);
    }
    setForm({ name: "", slug: "", description: "" });
    setSaving(false);
    toast.success("Saved");
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? "" });
    setAdding(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  const FormPanel = () => (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h3 className="font-semibold text-sm">{editingId ? "Edit Category" : "New Category"}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1 block">Name *</Label>
            <Input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Clothing" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Slug</Label>
            <Input value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="clothing" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs mb-1 block">Description</Label>
            <Input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            {editingId ? "Update" : "Create"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditingId(null); setForm({ name: "", slug: "", description: "" }); }}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">{categories.length} categories</p>
        </div>
        {!adding && !editingId && (
          <Button size="sm" onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
        )}
      </div>

      {adding && !editingId && <FormPanel />}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : categories.length === 0 && !adding ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No categories yet</p>
            <p className="text-sm text-muted-foreground">Add categories to organise your products.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            editingId === cat.id ? <FormPanel key={cat.id} /> : (
              <Card key={cat.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{cat.name}</p>
                    {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">/{cat.slug}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(cat)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(cat.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  );
}

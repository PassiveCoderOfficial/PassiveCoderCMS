"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tag, Plus, Trash2, Pencil, Check, X, Loader2, ImagePlus, Package } from "lucide-react";
import { uploadMediaFile } from "@/app/(admin)/dashboard/media/actions";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  image_url: string | null;
  parent_id: string | null;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const supabase = createClient();

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Form state (shared for add + edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", image_url: "", parent_id: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getClientTenantId().then(async (tenantId) => {
      let cq = supabase.from("categories").select("*").eq("type", "product").order("order_index").order("name");
      if (tenantId) cq = cq.eq("tenant_id", tenantId);
      const { data: cats } = await cq;
      setCategories((cats as Category[]) ?? []);

      // Product counts per category (from products.category_ids jsonb)
      let pq = supabase.from("products").select("category_ids");
      if (tenantId) pq = pq.eq("tenant_id", tenantId);
      const { data: prods } = await pq;
      const map: Record<string, number> = {};
      (prods ?? []).forEach((p: { category_ids: string[] | null }) => {
        (p.category_ids ?? []).forEach((cid) => { map[cid] = (map[cid] ?? 0) + 1; });
      });
      setCounts(map);
      setLoading(false);
    });
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function handleNameChange(v: string) {
    setForm((f) => ({ ...f, name: v, slug: editingId ? f.slug : slugify(v) }));
  }

  function resetForm() {
    setForm({ name: "", slug: "", description: "", image_url: "", parent_id: "" });
    setEditingId(null);
  }

  async function handleImageUpload(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Select an image file"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadMediaFile(fd);
    setUploading(false);
    if (res.error || !res.url) { toast.error(res.error ?? "Upload failed"); return; }
    set("image_url", res.url);
    toast.success("Image uploaded");
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug || slugify(form.name.trim()),
      description: form.description.trim() || null,
      image_url: form.image_url || null,
      parent_id: form.parent_id || null,
      type: "product",
    };
    if (editingId) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      setCategories((prev) => prev.map((c) => c.id === editingId ? { ...c, ...payload } : c));
    } else {
      const tenantId = await getClientTenantId();
      if (!tenantId) { toast.error("No tenant found for your account"); setSaving(false); return; }
      const { data, error } = await supabase.from("categories").insert({ ...payload, tenant_id: tenantId }).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      setCategories((prev) => [...prev, data as Category].sort((a, b) => a.name.localeCompare(b.name)));
    }
    resetForm();
    setSaving(false);
    toast.success("Saved");
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setForm({
      name: c.name, slug: c.slug, description: c.description ?? "",
      image_url: c.image_url ?? "", parent_id: c.parent_id ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) resetForm();
  }

  const parentName = (pid: string | null) => pid ? categories.find((c) => c.id === pid)?.name : null;

  return (
    <div className="p-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
        {/* ── Left: add / edit form ── */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="h-6 w-6" /> Categories</h1>
            <p className="text-muted-foreground text-sm mt-1">{categories.length} product categories</p>
          </div>

          <div className="border rounded-xl p-5 space-y-4 bg-card">
            <h3 className="font-semibold text-sm">{editingId ? "Edit Category" : "Add New Category"}</h3>

            {/* Thumbnail */}
            <div>
              <Label className="text-xs mb-1.5 block">Thumbnail</Label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }} />
              <div
                onClick={() => !uploading && fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleImageUpload(f); }}
                className={cn(
                  "relative w-full aspect-video rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-colors",
                  form.image_url ? "border-border" : "border-border hover:border-primary/50 hover:bg-muted/30",
                )}
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : form.image_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image_url} alt="thumbnail" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); set("image_url", ""); }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs">Click or drop image</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Name *</Label>
              <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Clothing" className="h-9" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Slug</Label>
              <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="clothing" className="h-9" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Parent Category</Label>
              <select
                value={form.parent_id}
                onChange={(e) => set("parent_id", e.target.value)}
                className="w-full h-9 border rounded-md px-2 text-sm bg-background outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— None (top level) —</option>
                {categories.filter((c) => c.id !== editingId).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Optional"
                rows={3}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={save} disabled={saving || !form.name.trim()} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                {editingId ? "Update" : "Add Category"}
              </Button>
              {editingId && (
                <Button size="sm" variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: category cards grid ── */}
        <div>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : categories.length === 0 ? (
            <div className="border border-dashed rounded-xl flex flex-col items-center justify-center py-24 text-center">
              <Tag className="h-12 w-12 text-muted-foreground mb-3 opacity-40" />
              <p className="font-medium">No categories yet</p>
              <p className="text-sm text-muted-foreground">Use the form to add your first product category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={cn(
                    "group border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow",
                    editingId === cat.id && "ring-2 ring-primary",
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {cat.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Tag className="h-8 w-8 opacity-40" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-background/90 backdrop-blur text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Package className="h-3 w-3" /> {counts[cat.id] ?? 0}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-snug truncate">{cat.name}</h3>
                        <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                        {parentName(cat.parent_id) && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">in {parentName(cat.parent_id)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => remove(cat.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {cat.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cat.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

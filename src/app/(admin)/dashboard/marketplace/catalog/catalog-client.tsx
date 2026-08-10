"use client";

import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { Tag, Plus, Trash2, Loader2, Shapes, ChevronDown, ChevronRight, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MediaPickerInput } from "@/components/admin/media-picker-input";

interface Subcategory { id: string; name: string; sort_order: number; }
interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  icon: string | null;
  image_url?: string | null;
  description?: string | null;
  service_subcategories: Subcategory[];
}

/** Renders a category's Lucide icon by name (same lookup pattern as
 *  ServiceIcon in src/components/blocks/services/services-block.tsx),
 *  falling back to a generic placeholder if unset or unknown. */
function CategoryIcon({ name, className = "w-4 h-4" }: { name: string | null; className?: string }) {
  const Icon = name ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] : null;
  return Icon ? <Icon className={className} /> : <Shapes className={className} />;
}

const inputCls = "bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
const btnPrimary = "inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 px-3 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CatalogClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [newCat, setNewCat] = useState("");
  const [newSub, setNewSub] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  async function addCategory() {
    if (!newCat.trim()) return;
    setSaving(true);
    const res = await fetch("/api/marketplace/catalog", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _type: "category", name: newCat.trim(), slug: slugify(newCat) }),
    });
    if (res.ok) {
      const d = await res.json();
      setCategories(l => [...l, { ...d, service_subcategories: [] }]);
      setNewCat("");
      // Open the new category so its image and description fields are visible
      // immediately, rather than looking like a bare name-only row.
      setExpanded(p => [...p, d.id]);
    } else {
      toast.error("Failed to add category");
    }
    setSaving(false);
  }

  async function addSubcategory(categoryId: string) {
    const name = newSub[categoryId]?.trim();
    if (!name) return;
    const res = await fetch("/api/marketplace/catalog", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _type: "subcategory", name, category_id: categoryId }),
    });
    if (res.ok) {
      const d = await res.json();
      setCategories(l => l.map(c => c.id === categoryId ? { ...c, service_subcategories: [...c.service_subcategories, d] } : c));
      setNewSub(p => ({ ...p, [categoryId]: "" }));
    } else {
      toast.error("Failed to add service");
    }
  }

  async function delCategory(c: Category) {
    if (!confirm(`Delete category "${c.name}" and all its services?`)) return;
    await fetch(`/api/marketplace/catalog?type=category&id=${c.id}`, { method: "DELETE" });
    setCategories(l => l.filter(x => x.id !== c.id));
  }

  async function delSubcategory(categoryId: string, sub: Subcategory) {
    await fetch(`/api/marketplace/catalog?type=subcategory&id=${sub.id}`, { method: "DELETE" });
    setCategories(l => l.map(c => c.id === categoryId ? { ...c, service_subcategories: c.service_subcategories.filter(s => s.id !== sub.id) } : c));
  }

  /** Patches one field on a category, updating locally first so the UI stays
   *  responsive — these are single-field edits, so a failed save is cheap to
   *  retry rather than worth blocking the whole form for. */
  async function patchCategory(c: Category, patch: Partial<Category>) {
    setCategories(l => l.map(x => x.id === c.id ? { ...x, ...patch } : x));
    const res = await fetch("/api/marketplace/catalog", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _type: "category", id: c.id, ...patch }),
    });
    if (!res.ok) toast.error("Failed to save category");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="w-6 h-6 text-primary" /> Service Catalog
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Categories and the services vendors can offer under them — e.g. &ldquo;Aircon&rdquo; → &ldquo;Gas top up&rdquo;,
          &ldquo;Chemical wash&rdquo;. A category&apos;s image and description are what customers see on your site.
        </p>
      </div>

      <div className="flex gap-2">
        <input className={`${inputCls} flex-1`} placeholder="New category name (e.g. Electrician)" value={newCat}
          onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
        <button onClick={addCategory} disabled={saving} className={btnPrimary}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add category
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((c) => {
          const isOpen = expanded.includes(c.id);
          return (
            <div key={c.id} className="bg-card border rounded-xl overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-3 p-3">
                {/* Thumbnail doubles as the visual cue for whether an image is set */}
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt={c.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <CategoryIcon name={c.icon} className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {renaming === c.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        className={`${inputCls} py-1 text-sm flex-1`}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && renameValue.trim()) {
                            void patchCategory(c, { name: renameValue.trim(), slug: slugify(renameValue) });
                            setRenaming(null);
                          }
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (renameValue.trim()) void patchCategory(c, { name: renameValue.trim(), slug: slugify(renameValue) });
                          setRenaming(null);
                        }}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold truncate">{c.name}</h3>
                        <button
                          onClick={() => { setRenaming(c.id); setRenameValue(c.name); }}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                          title="Rename"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        /{c.slug} · {c.service_subcategories.length} service{c.service_subcategories.length === 1 ? "" : "s"}
                      </p>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setExpanded(p => p.includes(c.id) ? p.filter(x => x !== c.id) : [...p, c.id])}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  Edit
                </button>
                <button onClick={() => delCategory(c)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {isOpen && (
                <div className="border-t p-3 space-y-4">
                  {/* Presentation */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium mb-1.5">Thumbnail image</label>
                      <MediaPickerInput
                        value={c.image_url ?? ""}
                        onChange={(url) => void patchCategory(c, { image_url: url || null })}
                        placeholder="Upload or paste an image URL"
                      />
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Shown on category cards across your site. Falls back to the icon when unset.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5">Icon</label>
                      <input
                        className={`${inputCls} w-full py-1.5 text-xs`}
                        placeholder="Lucide icon name (e.g. Wind, Zap)"
                        defaultValue={c.icon ?? ""}
                        onBlur={(e) => void patchCategory(c, { icon: e.target.value.trim() || null })}
                      />
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Used when there&apos;s no image. Names from lucide.dev/icons.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5">Description</label>
                    <textarea
                      className={`${inputCls} w-full resize-y text-xs`}
                      rows={2}
                      placeholder="One line describing what this category covers"
                      defaultValue={c.description ?? ""}
                      onBlur={(e) => void patchCategory(c, { description: e.target.value.trim() || null })}
                    />
                  </div>

                  {/* Services */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      Services in this category ({c.service_subcategories.length})
                    </label>
                    <div className="space-y-1">
                      {c.service_subcategories.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-sm">
                          <span className="flex-1 truncate">{s.name}</span>
                          <button onClick={() => delSubcategory(c.id, s)} className="p-1 text-muted-foreground hover:text-destructive rounded">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {c.service_subcategories.length === 0 && (
                        <p className="text-xs text-muted-foreground py-1.5">No services yet.</p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <input className={`${inputCls} flex-1 py-1.5 text-xs`} placeholder="New service (e.g. Gas top up)"
                        value={newSub[c.id] ?? ""} onChange={(e) => setNewSub(p => ({ ...p, [c.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addSubcategory(c.id)} />
                      <button onClick={() => addSubcategory(c.id)} className="text-xs font-medium text-primary hover:opacity-80 px-2">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className={cn("border border-dashed rounded-xl text-center py-16 text-muted-foreground text-sm")}>
            No categories yet — add your first one above.
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { Tag, Plus, Trash2, Loader2, Shapes } from "lucide-react";

interface Subcategory { id: string; name: string; sort_order: number; }
interface Category { id: string; name: string; slug: string; sort_order: number; icon: string | null; service_subcategories: Subcategory[]; }

/** Renders a category's Lucide icon by name (same lookup pattern as
 *  ServiceIcon in src/components/blocks/services/services-block.tsx),
 *  falling back to a generic placeholder if unset or unknown. */
function CategoryIcon({ name, className = "w-4 h-4" }: { name: string | null; className?: string }) {
  const Icon = name ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] : null;
  return Icon ? <Icon className={className} /> : <Shapes className={className} />;
}

const inputCls = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const btnPrimary = "inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CatalogClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [newCat, setNewCat] = useState("");
  const [newSub, setNewSub] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
    }
  }

  async function delCategory(c: Category) {
    if (!confirm(`Delete category "${c.name}" and all its subcategories?`)) return;
    await fetch(`/api/marketplace/catalog?type=category&id=${c.id}`, { method: "DELETE" });
    setCategories(l => l.filter(x => x.id !== c.id));
  }

  async function delSubcategory(categoryId: string, sub: Subcategory) {
    await fetch(`/api/marketplace/catalog?type=subcategory&id=${sub.id}`, { method: "DELETE" });
    setCategories(l => l.map(c => c.id === categoryId ? { ...c, service_subcategories: c.service_subcategories.filter(s => s.id !== sub.id) } : c));
  }

  async function updateIcon(c: Category, icon: string) {
    setCategories(l => l.map(x => x.id === c.id ? { ...x, icon } : x));
    await fetch("/api/marketplace/catalog", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _type: "category", id: c.id, icon: icon.trim() || null }),
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Tag className="w-6 h-6 text-indigo-400" /> Service Catalog
      </h1>
      <p className="text-sm text-gray-500">Categories and services vendors can offer — e.g. "Aircon Servicing" → "Gas top up", "Condenser cleaning".</p>

      <div className="flex gap-2">
        <input className={`${inputCls} flex-1`} placeholder="New category name (e.g. Electrician)" value={newCat}
          onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
        <button onClick={addCategory} disabled={saving} className={btnPrimary}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add category
        </button>
      </div>

      <div className="space-y-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <CategoryIcon name={c.icon} className="w-4 h-4 text-indigo-400 shrink-0" />
                <h3 className="text-sm font-semibold text-white truncate">{c.name}</h3>
              </div>
              <input className={`${inputCls} w-36 py-1 text-xs`} placeholder="Lucide icon name"
                defaultValue={c.icon ?? ""} onBlur={(e) => updateIcon(c, e.target.value)}
                title="e.g. Wind, Zap, Droplets — see lucide.dev/icons" />
              <button onClick={() => delCategory(c)} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-gray-800"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1.5 pl-2">
              {c.service_subcategories.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="flex-1">{s.name}</span>
                  <button onClick={() => delSubcategory(c.id, s)} className="p-1 text-gray-600 hover:text-red-400 rounded"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input className={`${inputCls} flex-1 py-1.5 text-xs`} placeholder="New service (e.g. Gas top up)"
                  value={newSub[c.id] ?? ""} onChange={(e) => setNewSub(p => ({ ...p, [c.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addSubcategory(c.id)} />
                <button onClick={() => addSubcategory(c.id)} className="text-xs text-indigo-400 hover:text-indigo-300 px-2">Add</button>
              </div>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500 text-sm">
            No categories yet — add your first one above.
          </div>
        )}
      </div>
    </div>
  );
}

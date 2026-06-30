"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Plus, Package, Loader2, Pencil, Trash2, Eye, EyeOff,
  Star, ExternalLink, Upload, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEcommerceCurrency } from "@/lib/hooks/use-ecommerce-currency";

interface Category { id: string; name: string; }

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  status: "active" | "draft" | "archived";
  stock_quantity: number;
  track_inventory: boolean;
  images: string[];
  featured: boolean;
  category_ids: string[];
  created_at: string;
}

const STATUS_VARIANT: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  archived: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const supabase = createClient();

// ─── Inline editable cell ──────────────────────────────────────────────────────
function EditableCell({
  value,
  onSave,
  type = "text",
  className,
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  type?: "text" | "number";
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  async function commit() {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  function cancel() { setDraft(value); setEditing(false); }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
          className="border rounded px-2 py-1 text-xs w-24 outline-none focus:ring-1 focus:ring-primary"
        />
        {saving
          ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          : <>
            <button onClick={commit} className="p-0.5 text-green-600 hover:text-green-700"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={cancel} className="p-0.5 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
          </>}
      </div>
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={cn("cursor-pointer rounded px-1 -mx-1 hover:bg-muted/60 transition-colors select-none", className)}
    >
      {value}
    </span>
  );
}

// ─── Inline status select ──────────────────────────────────────────────────────
function StatusCell({ product, onUpdate }: { product: Product; onUpdate: (p: Partial<Product>) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function set(status: Product["status"]) {
    setSaving(true);
    await supabase.from("products").update({ status }).eq("id", product.id);
    onUpdate({ status });
    setSaving(false);
    setEditing(false);
    toast.success(`Status → ${status}`);
  }

  if (saving) return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;

  if (editing) {
    return (
      <div className="flex flex-col gap-1 bg-background border rounded-lg shadow-lg p-1 z-10 absolute">
        {(["active", "draft", "archived"] as const).map((s) => (
          <button key={s} onClick={() => set(s)}
            className={cn("text-xs px-3 py-1.5 rounded-md text-left hover:bg-muted capitalize", product.status === s && "font-bold")}>
            {s}
          </button>
        ))}
        <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 text-muted-foreground">Cancel</button>
      </div>
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to change status"
      className={cn("text-xs font-medium px-2 py-1 rounded-full capitalize cursor-pointer select-none", STATUS_VARIANT[product.status])}
    >
      {product.status}
    </span>
  );
}

// ─── Inline category cell ──────────────────────────────────────────────────────
function CategoryCell({
  product,
  categories,
  onUpdate,
}: {
  product: Product;
  categories: Category[];
  onUpdate: (p: Partial<Product>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>(product.category_ids ?? []);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setEditing(false);
    }
    if (editing) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing]);

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function save() {
    setSaving(true);
    await supabase.from("products").update({ category_ids: selected }).eq("id", product.id);
    onUpdate({ category_ids: selected });
    setSaving(false);
    setEditing(false);
  }

  const names = (product.category_ids ?? [])
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter(Boolean);

  return (
    <div className="relative" ref={ref}>
      <span
        onClick={() => setEditing(true)}
        title="Click to edit categories"
        className="text-xs cursor-pointer rounded px-1 -mx-1 hover:bg-muted/60 transition-colors select-none text-muted-foreground"
      >
        {names.length > 0 ? names.join(", ") : <span className="opacity-40">—</span>}
      </span>

      {editing && (
        <div className="absolute left-0 top-6 z-20 bg-background border rounded-xl shadow-xl p-3 min-w-[180px] space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Categories</p>
          {categories.length === 0
            ? <p className="text-xs text-muted-foreground">No categories yet</p>
            : categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer hover:text-foreground">
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                  className="accent-primary"
                />
                {c.name}
              </label>
            ))
          }
          <div className="flex gap-2 pt-2 border-t mt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 text-xs bg-primary text-primary-foreground rounded-lg py-1.5 font-medium hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "Save"}
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground px-2">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline stock cell (In Stock / tracked quantity) ───────────────────────────
function StockCell({ product, onUpdate }: { product: Product; onUpdate: (p: Partial<Product>) => void }) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(String(product.stock_quantity ?? 0));
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQty(String(product.stock_quantity ?? 0)); }, [product.stock_quantity]);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setEditing(false);
    }
    if (editing) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing]);

  async function setInStock() {
    setSaving(true);
    await supabase.from("products").update({ track_inventory: false }).eq("id", product.id);
    onUpdate({ track_inventory: false });
    setSaving(false);
    setEditing(false);
    toast.success("Marked In Stock (not tracked)");
  }

  async function setTracked() {
    const n = parseInt(qty, 10);
    if (isNaN(n) || n < 0) { toast.error("Enter a valid quantity"); return; }
    setSaving(true);
    await supabase.from("products").update({ track_inventory: true, stock_quantity: n }).eq("id", product.id);
    onUpdate({ track_inventory: true, stock_quantity: n });
    setSaving(false);
    setEditing(false);
    toast.success("Stock quantity updated");
  }

  // Display
  const tracked = product.track_inventory;
  const display = !tracked ? (
    <span className="text-sm font-medium text-green-600">In Stock</span>
  ) : product.stock_quantity === 0 ? (
    <span className="text-sm font-medium text-red-600">0 <span className="text-xs">Out of stock</span></span>
  ) : product.stock_quantity <= 5 ? (
    <span className="text-sm font-medium text-amber-600">{product.stock_quantity} <span className="text-xs">Low</span></span>
  ) : (
    <span className="text-sm font-medium">{product.stock_quantity}</span>
  );

  return (
    <div className="relative" ref={ref}>
      <span
        onClick={() => setEditing(true)}
        title="Click to edit stock"
        className="cursor-pointer rounded px-1 -mx-1 hover:bg-muted/60 transition-colors select-none inline-block"
      >
        {display}
      </span>

      {editing && (
        <div className="absolute left-0 top-7 z-20 bg-background border rounded-xl shadow-xl p-3 min-w-[220px] space-y-3">
          {/* In Stock (untracked) */}
          <button
            onClick={setInStock}
            disabled={saving}
            className={cn(
              "w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors",
              !tracked ? "border-green-500 bg-green-50 dark:bg-green-900/20 font-semibold" : "border-border hover:bg-muted"
            )}
          >
            <span className="text-green-600">● In Stock</span>
            <span className="block text-[10px] text-muted-foreground mt-0.5">Don&apos;t track quantity — always available</span>
          </button>

          {/* Track quantity */}
          <div className={cn(
            "rounded-lg border p-2.5 space-y-2",
            tracked ? "border-primary bg-primary/5" : "border-border"
          )}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Track Quantity</p>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setTracked(); }}
                className="border rounded px-2 py-1 text-xs w-full outline-none focus:ring-1 focus:ring-primary"
                placeholder="0"
              />
              <button
                onClick={setTracked}
                disabled={saving}
                className="text-xs bg-primary text-primary-foreground rounded-lg px-3 py-1.5 font-medium hover:opacity-90 disabled:opacity-60 shrink-0"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Set"}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">0 = Out of stock</p>
          </div>

          <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground w-full text-center">Cancel</button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"" | "active" | "draft" | "archived">("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const { format } = useEcommerceCurrency();

  useEffect(() => {
    getClientTenantId().then((tenantId) => {
      // Load products
      let pq = supabase
        .from("products")
        .select("id,name,slug,price,compare_price,status,stock_quantity,track_inventory,images,featured,category_ids,created_at")
        .order("created_at", { ascending: false });
      if (tenantId) pq = pq.eq("tenant_id", tenantId);
      pq.then(({ data }) => { setProducts((data as Product[]) ?? []); setLoading(false); });

      // Load product categories
      let cq = supabase.from("categories").select("id,name").eq("type", "product").order("name");
      if (tenantId) cq = cq.eq("tenant_id", tenantId);
      cq.then(({ data }) => setCategories((data as Category[]) ?? []));
    });
  }, []);

  function updateProduct(id: string, patch: Partial<Product>) {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
  }

  async function inlineUpdate(id: string, patch: Record<string, unknown>) {
    await supabase.from("products").update(patch).eq("id", id);
    updateProduct(id, patch as Partial<Product>);
  }

  async function toggleFeatured(p: Product) {
    await supabase.from("products").update({ featured: !p.featured }).eq("id", p.id);
    updateProduct(p.id, { featured: !p.featured });
  }

  async function toggleStatus(p: Product) {
    const next = p.status === "active" ? "draft" : "active";
    await supabase.from("products").update({ status: next }).eq("id", p.id);
    updateProduct(p.id, { status: next });
    toast.success(`${p.name} is now ${next}`);
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setDeleting(p.id);
    await supabase.from("products").delete().eq("id", p.id);
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    setDeleting(null);
    toast.success("Product deleted");
  }

  const filtered = filter ? products.filter((p) => p.status === filter) : products;
  const counts = {
    all: products.length,
    active: products.filter((p) => p.status === "active").length,
    draft: products.filter((p) => p.status === "draft").length,
    archived: products.filter((p) => p.status === "archived").length,
  };

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6" /> Products</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} total · click any cell to quick edit</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/ecommerce/products/bulk-upload">
              <Upload className="h-4 w-4 mr-2" /> Add Multiple
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/ecommerce/products/new"><Plus className="h-4 w-4 mr-2" /> Add Product</Link>
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([["", "All"], ["active", "Active"], ["draft", "Draft"], ["archived", "Archived"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              filter === val
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
            {label} <span className="ml-1 opacity-60">{val === "" ? counts.all : counts[val as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-xl">
          <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
          <h3 className="font-semibold mb-2">{filter ? `No ${filter} products` : "No products yet"}</h3>
          {!filter && (
            <Button asChild>
              <Link href="/dashboard/ecommerce/products/new"><Plus className="h-4 w-4 mr-2" /> Add First Product</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((product) => {
                const firstImage = Array.isArray(product.images) ? product.images[0] : undefined;
                return (
                  <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                    {/* Product name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-muted overflow-hidden shrink-0 border">
                          {firstImage
                            ? <img src={firstImage} alt={product.name} className="object-cover w-full h-full" /> // eslint-disable-line @next/next/no-img-element
                            : <div className="w-full h-full flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                          }
                        </div>
                        <div>
                          <Link href={`/dashboard/ecommerce/products/${product.id}`} className="font-medium hover:text-primary transition-colors">
                            {product.name}
                          </Link>
                          {product.featured && (
                            <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">Featured</span>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5 md:hidden">{format(product.price)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Price — click to edit */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <EditableCell
                        value={String(product.price)}
                        type="number"
                        onSave={async (v) => {
                          const price = parseFloat(v);
                          if (isNaN(price)) return;
                          await inlineUpdate(product.id, { price });
                          toast.success("Price updated");
                        }}
                        className="font-medium"
                      />
                      <span className="text-xs text-muted-foreground ml-1">
                        {format(product.price)}
                      </span>
                      {product.compare_price && (
                        <span className="text-xs text-muted-foreground line-through ml-1.5">{format(product.compare_price)}</span>
                      )}
                    </td>

                    {/* Stock — click to edit */}
                    <td className="px-4 py-3 hidden md:table-cell relative">
                      <StockCell
                        product={product}
                        onUpdate={(patch) => updateProduct(product.id, patch)}
                      />
                    </td>

                    {/* Category — click to edit */}
                    <td className="px-4 py-3 hidden md:table-cell relative">
                      <CategoryCell
                        product={product}
                        categories={categories}
                        onUpdate={(patch) => updateProduct(product.id, patch)}
                      />
                    </td>

                    {/* Status — click to edit */}
                    <td className="px-4 py-3 hidden md:table-cell relative">
                      <StatusCell
                        product={product}
                        onUpdate={(patch) => updateProduct(product.id, patch)}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleFeatured(product)} title={product.featured ? "Remove featured" : "Mark as featured"}
                          className={cn("p-1.5 rounded-lg transition-colors", product.featured
                            ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            : "text-muted-foreground hover:text-amber-500 hover:bg-muted")}>
                          <Star className="h-3.5 w-3.5" fill={product.featured ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => toggleStatus(product)} title={product.status === "active" ? "Set to draft" : "Set to active"}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          {product.status === "active" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        {product.status === "active" && (
                          <Link href={`/products/${product.slug}`} target="_blank"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="View product">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        <Link href={`/dashboard/ecommerce/products/${product.id}`}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button onClick={() => remove(product)} disabled={deleting === product.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors">
                          {deleting === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

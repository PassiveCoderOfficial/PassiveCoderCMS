"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, X, Package, ImageOff, Clock, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  images: string[];
  stock_quantity: number;
  track_inventory: boolean;
  status: string;
  approval_status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  category_ids: string[];
  created_at: string;
}

interface Category { id: string; name: string }

const APPROVAL_META = {
  pending: { label: "In review", cls: "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]", icon: Clock },
  approved: { label: "Live", cls: "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]", icon: CheckCircle2 },
  rejected: { label: "Rejected", cls: "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]", icon: AlertTriangle },
} as const;

const inputCls =
  "w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-lg px-3 py-2 text-sm text-[#1A1330] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25";
const tk = (n: number) => `৳${Number(n).toLocaleString()}`;

function ProductForm({
  categories, initial, onClose, onSaved,
}: {
  categories: Category[];
  initial: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    price: initial ? String(initial.price) : "",
    compare_price: initial?.compare_price ? String(initial.compare_price) : "",
    stock_quantity: initial ? String(initial.stock_quantity) : "0",
    short_description: "",
    description: "",
    category: initial?.category_ids?.[0] ?? "",
    image: initial?.images?.[0] ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.name.trim()) { setError("Product name required"); return; }
    if (!f.price || Number(f.price) <= 0) { setError("Enter a valid price"); return; }
    setSaving(true); setError(null);

    const payload = {
      ...(initial ? { id: initial.id } : {}),
      name: f.name.trim(),
      price: Number(f.price),
      compare_price: f.compare_price ? Number(f.compare_price) : null,
      stock_quantity: Number(f.stock_quantity || 0),
      short_description: f.short_description.trim() || null,
      description: f.description.trim() || null,
      category_ids: f.category ? [f.category] : [],
      images: f.image.trim() ? [f.image.trim()] : [],
    };

    const res = await fetch("/api/vendor/products", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Could not save"); return; }
    onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A1330]/40" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#EAECF0] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A1330]">
            {initial ? "Edit product" : "Add product"}
          </h2>
          <button onClick={onClose} className="text-[#98A2B3] hover:text-[#475467]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-amber-300/80 bg-amber-950/30 border border-amber-900/50 rounded-lg px-3 py-2">
          New and edited listings go to the marketplace team for review before they appear
          in the shop.
        </p>

        <input className={inputCls} placeholder="Product name *"
          value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} type="number" placeholder="Price (৳) *"
            value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
          <input className={inputCls} type="number" placeholder="Compare-at price"
            value={f.compare_price} onChange={(e) => setF({ ...f, compare_price: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} type="number" placeholder="Stock quantity"
            value={f.stock_quantity} onChange={(e) => setF({ ...f, stock_quantity: e.target.value })} />
          <select className={inputCls} value={f.category}
            onChange={(e) => setF({ ...f, category: e.target.value })}>
            <option value="">Category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <input className={inputCls} placeholder="Image URL"
          value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })} />
        <input className={inputCls} placeholder="Short description"
          value={f.short_description} onChange={(e) => setF({ ...f, short_description: e.target.value })} />
        <textarea className={inputCls} rows={3} placeholder="Full description"
          value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />

        {error && <p className="text-sm text-[#B42318]">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose}
            className="border border-[#EAECF0] hover:bg-[#F9FAFB] text-[#475467] px-3 py-2 rounded-lg text-sm">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {initial ? "Save changes" : "Submit for review"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorProductsClient({ categories }: { categories: Category[] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/vendor/products");
    const d = await res.json();
    setProducts(Array.isArray(d) ? d : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    await fetch(`/api/vendor/products?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1330]">My products</h1>
          <p className="text-sm text-[#667085] mt-1">
            Listings you sell on the marketplace.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#D0D5DD]" />
        </div>
      ) : products.length === 0 ? (
        <div className="border border-[#EAECF0] rounded-xl p-10 text-center">
          <Package className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-[#667085]">No products yet.</p>
          <p className="text-sm text-[#D0D5DD] mt-1">Add your first listing to start selling.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => {
            const meta = APPROVAL_META[p.approval_status];
            const img = Array.isArray(p.images) ? p.images[0] : undefined;
            const low = p.track_inventory && p.stock_quantity <= 5;
            return (
              <div key={p.id} className="border border-[#EAECF0] rounded-xl p-3 bg-white flex gap-3 items-center">
                <div className="w-14 h-14 shrink-0 rounded-lg bg-[#F9FAFB] overflow-hidden flex items-center justify-center">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff className="w-5 h-5 text-[#D0D5DD]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[#1A1330] truncate">{p.name}</h3>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-sm text-[#667085] mt-0.5">
                    {tk(p.price)}
                    <span className={low ? "text-[#B54708] ml-2" : "text-[#98A2B3] ml-2"}>
                      · {p.stock_quantity} in stock
                    </span>
                  </p>
                  {p.rejection_reason && (
                    <p className="text-xs text-[#B42318] mt-1">Rejected: {p.rejection_reason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setEditing(p); setShowForm(true); }}
                    className="text-xs border border-[#EAECF0] hover:bg-[#F9FAFB] text-[#475467] px-2.5 py-1.5 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-[#D0D5DD] hover:text-[#B42318] p-1.5"
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ProductForm
          categories={categories}
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";

interface Row {
  id?: string;
  name: string;
  price: string;
  stock_quantity: string;
  is_active: boolean;
}

const inputCls =
  "w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-lg px-2.5 py-2 text-sm text-[#1A1330] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25";

/** Seller: manage a product's options — e.g. "Red / XL" — each with its own
 *  price (blank = product price) and stock. */
export function VariantsEditor({
  productId, productName, basePrice, onClose, onSaved,
}: { productId: string; productName: string; basePrice: number; onClose: () => void; onSaved: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/vendor/products/variants?product_id=${productId}`)
      .then((r) => r.json())
      .then((d) =>
        setRows(
          (d.variants ?? [])
            .filter((v: { is_active: boolean }) => v.is_active !== false)
            .map((v: { id: string; name: string; price: number | null; stock_quantity: number; is_active: boolean }) => ({
              id: v.id,
              name: v.name,
              price: v.price == null ? "" : String(v.price),
              stock_quantity: String(v.stock_quantity ?? 0),
              is_active: true,
            })),
        ),
      );
  }, [productId]);

  const set = (i: number, patch: Partial<Row>) => setRows((r) => r!.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  async function save() {
    setSaving(true);
    setError(null);
    const r = await fetch("/api/vendor/products/variants", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        variants: (rows ?? []).map((v) => ({
          id: v.id,
          name: v.name,
          price: v.price === "" ? null : Number(v.price),
          stock_quantity: Number(v.stock_quantity || 0),
        })),
      }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) return setError(d.error ?? "Couldn't save");
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A1330]/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[#1A1330]">Options for {productName}</h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Sizes, colours, storage… Leave price blank to use ৳{basePrice.toLocaleString()}.
            </p>
          </div>
          <button onClick={onClose} className="text-[#98A2B3]"><X className="w-5 h-5" /></button>
        </div>

        {!rows ? (
          <Loader2 className="w-5 h-5 animate-spin text-[#D0D5DD]" />
        ) : (
          <div className="space-y-2">
            {rows.length > 0 && (
              <div className="grid grid-cols-[1fr_90px_70px_28px] gap-2 text-[11px] font-semibold uppercase text-[#667085]">
                <span>Option</span><span>Price ৳</span><span>Stock</span><span />
              </div>
            )}
            {rows.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_70px_28px] gap-2 items-center">
                <input className={inputCls} placeholder="e.g. Blue / 128GB" value={v.name} onChange={(e) => set(i, { name: e.target.value })} />
                <input className={inputCls} inputMode="decimal" placeholder={String(basePrice)} value={v.price} onChange={(e) => set(i, { price: e.target.value })} />
                <input className={inputCls} inputMode="numeric" value={v.stock_quantity} onChange={(e) => set(i, { stock_quantity: e.target.value })} />
                <button onClick={() => setRows(rows.filter((_, k) => k !== i))} className="text-[#D0D5DD] hover:text-[#B42318]" aria-label="Remove">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setRows([...rows, { name: "", price: "", stock_quantity: "0", is_active: true }])}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF5A1F]"
            >
              <Plus className="w-4 h-4" /> Add option
            </button>
          </div>
        )}

        {error && <p className="text-sm text-[#B42318]">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#475467]">Cancel</button>
          <button onClick={save} disabled={saving || !rows} className="px-4 py-2 rounded-lg bg-[#FF5A1F] text-white text-sm font-semibold disabled:opacity-50">
            {saving ? "Saving…" : "Save options"}
          </button>
        </div>
      </div>
    </div>
  );
}

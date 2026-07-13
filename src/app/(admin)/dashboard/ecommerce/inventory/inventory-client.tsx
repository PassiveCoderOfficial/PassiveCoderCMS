"use client";

import { useState } from "react";
import { Boxes, Search, AlertTriangle, Minus, Plus, Loader2 } from "lucide-react";

interface Product {
  id: string; name: string; sku: string | null; status: string; price: number;
  track_inventory: boolean; stock_quantity: number | null;
  low_stock_threshold: number | null; images: unknown;
}

const inputCls = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

export default function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const isLow = (p: Product) =>
    p.track_inventory && (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 0);

  async function patch(p: Product, fields: Record<string, unknown>) {
    setBusy(p.id);
    const res = await fetch("/api/ecommerce/inventory", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, ...fields }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts(list => list.map(x => x.id === p.id ? updated : x));
    }
    setBusy(null);
  }

  const shown = products.filter(p => {
    if (lowOnly && !isLow(p)) return false;
    if (q && !`${p.name} ${p.sku ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const lowCount = products.filter(isLow).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Boxes className="w-6 h-6 text-indigo-400" /> Inventory
        </h1>
        {lowCount > 0 && (
          <button onClick={() => setLowOnly(!lowOnly)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
              lowOnly ? "bg-red-900/40 border-red-700/50 text-red-300" : "border-gray-700 text-gray-300 hover:bg-gray-800"
            }`}>
            <AlertTriangle className="w-4 h-4" /> {lowCount} low stock
          </button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input className={`${inputCls} w-full pl-9`} placeholder="Search product or SKU…"
          value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {shown.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No products found.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {shown.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{p.name}</span>
                    {isLow(p) && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  </div>
                  <div className="text-xs text-gray-500">{p.sku || "No SKU"} · {p.status}</div>
                </div>

                <label className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                  <input type="checkbox" checked={p.track_inventory}
                    onChange={(e) => patch(p, { track_inventory: e.target.checked })}
                    className="accent-indigo-600" />
                  Track
                </label>

                {p.track_inventory && (
                  <>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => patch(p, { stock_quantity: (p.stock_quantity ?? 0) - 1 })}
                        disabled={busy === p.id || (p.stock_quantity ?? 0) <= 0}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 disabled:opacity-30">
                        <Minus className="w-4 h-4" />
                      </button>
                      <input type="number" min={0} value={p.stock_quantity ?? 0}
                        onChange={(e) => setProducts(list => list.map(x => x.id === p.id
                          ? { ...x, stock_quantity: Number(e.target.value) } : x))}
                        onBlur={(e) => patch(p, { stock_quantity: Number(e.target.value) })}
                        className={`${inputCls} w-20 text-center ${isLow(p) ? "border-red-700/60 text-red-300" : ""}`} />
                      <button onClick={() => patch(p, { stock_quantity: (p.stock_quantity ?? 0) + 1 })}
                        disabled={busy === p.id}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
                        {busy === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                      Alert at
                      <input type="number" min={0} value={p.low_stock_threshold ?? 0}
                        onChange={(e) => setProducts(list => list.map(x => x.id === p.id
                          ? { ...x, low_stock_threshold: Number(e.target.value) } : x))}
                        onBlur={(e) => patch(p, { low_stock_threshold: Number(e.target.value) })}
                        className={`${inputCls} w-16 text-center`} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

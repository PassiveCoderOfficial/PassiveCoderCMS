"use client";

import { useState } from "react";
import {
  ShoppingCart, Search, Plus, Minus, Trash2, Loader2, CheckCircle, Banknote, Ban,
} from "lucide-react";

interface Product {
  id: string; name: string; sku: string | null; price: number;
  stock_quantity: number | null; track_inventory: boolean; status: string;
}
interface CartLine { product_id: string; name: string; price: number; quantity: number }
interface RestTable { id: string; table_number: string; is_active: boolean }
interface Branch { id: string; name: string; restaurant_tables: RestTable[] }

const inputCls = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const PAYMENT_METHODS = ["cash", "bkash", "nagad", "card", "bank"];

interface AvailabilityRow { branch_id: string; product_id: string; in_stock: boolean }

export default function PosClient({ products, currency, branches = [], availability = [] }: {
  products: Product[]; currency: string; branches?: Branch[]; availability?: AvailabilityRow[];
}) {
  // Only a restaurant tenant has any branches at all — this whole block of
  // state stays inert (branchId/tableId always null) for a plain retail POS.
  const [branchId, setBranchId] = useState<string>(branches[0]?.id ?? "");
  const [tableId, setTableId] = useState<string>("");
  const [avail, setAvail] = useState<AvailabilityRow[]>(availability);
  const selectedBranch = branches.find(b => b.id === branchId);
  const activeTables = (selectedBranch?.restaurant_tables ?? []).filter(t => t.is_active);
  // A row's absence means available (migration 087) — only an explicit
  // in_stock:false row 86's a product for the currently selected branch.
  const eightySixed = new Set(
    avail.filter(a => a.branch_id === branchId && !a.in_stock).map(a => a.product_id),
  );

  async function toggle86(productId: string, currentlyOut: boolean) {
    setAvail(prev => {
      const next = prev.filter(a => !(a.branch_id === branchId && a.product_id === productId));
      next.push({ branch_id: branchId, product_id: productId, in_stock: currentlyOut });
      return next;
    });
    await fetch("/api/ecommerce/branch-availability", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch_id: branchId, product_id: productId, in_stock: currentlyOut }),
    }).catch(() => {});
  }
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState({ customer_name: "", customer_phone: "" });
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<{ orderNumber: string; total: number } | null>(null);

  const money = (n: number) => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n); }
    catch { return `${currency} ${n.toFixed(2)}`; }
  };

  function add(p: Product) {
    setCart(c => {
      const line = c.find(l => l.product_id === p.id);
      if (line) return c.map(l => l.product_id === p.id ? { ...l, quantity: l.quantity + 1 } : l);
      return [...c, { product_id: p.id, name: p.name, price: Number(p.price), quantity: 1 }];
    });
  }
  function setQty(id: string, qty: number) {
    setCart(c => qty <= 0 ? c.filter(l => l.product_id !== id)
      : c.map(l => l.product_id === id ? { ...l, quantity: qty } : l));
  }

  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  async function checkout() {
    setSaving(true);
    const res = await fetch("/api/ecommerce/pos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart, discount, payment_method: method, ...customer,
        branch_id: branchId || undefined,
        table_id: tableId || undefined,
      }),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { alert(d.error ?? "Sale failed"); return; }
    setReceipt({ orderNumber: d.orderNumber, total: d.total });
    setCart([]); setDiscount(0); setCustomer({ customer_name: "", customer_phone: "" }); setTableId("");
  }

  const shown = products.filter(p =>
    !q || `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-indigo-400" /> Point of Sale
      </h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Product picker */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputCls} w-full pl-9`} placeholder="Search products…"
              value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {shown.map((p) => {
              const stockOut = p.track_inventory && (p.stock_quantity ?? 0) <= 0;
              const branchOut = branchId && eightySixed.has(p.id);
              const out = stockOut || branchOut;
              return (
                <div key={p.id} className="relative group">
                  <button onClick={() => !out && add(p)} disabled={!!out}
                    className={`w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-3 transition-colors ${
                      out ? "opacity-40 cursor-not-allowed" : "hover:border-indigo-600/60"
                    }`}>
                    <div className="text-sm font-medium text-white truncate">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{money(Number(p.price))}</div>
                    {(p.track_inventory || branchId) && (
                      <div className={`text-[11px] mt-1 ${out ? "text-red-400" : "text-gray-600"}`}>
                        {branchOut ? "86'd" : stockOut ? "Out of stock" : p.track_inventory ? `${p.stock_quantity} in stock` : ""}
                      </div>
                    )}
                  </button>
                  {branchId && !stockOut && (
                    <button
                      onClick={() => toggle86(p.id, !branchOut)}
                      title={branchOut ? "Bring back on menu" : "86 this item"}
                      className={`absolute top-1.5 right-1.5 p-1 rounded-md transition-colors ${
                        branchOut ? "bg-red-500/20 text-red-400" : "bg-gray-800 text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400"
                      }`}>
                      <Ban className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            {!shown.length && <p className="text-sm text-gray-500 col-span-full py-8 text-center">No products found.</p>}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3 lg:sticky lg:top-4">
          <h2 className="text-sm font-semibold text-white">Current sale</h2>
          {branches.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <select value={branchId} onChange={(e) => { setBranchId(e.target.value); setTableId(""); }}
                className={inputCls}>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={tableId} onChange={(e) => setTableId(e.target.value)} className={inputCls}>
                <option value="">Takeaway / pickup</option>
                {activeTables.map(t => <option key={t.id} value={t.id}>Table {t.table_number}</option>)}
              </select>
            </div>
          )}
          {cart.length === 0 ? (
            <p className="text-sm text-gray-600 py-6 text-center">Tap products to add them.</p>
          ) : (
            <div className="space-y-2">
              {cart.map((l) => (
                <div key={l.product_id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white truncate">{l.name}</div>
                    <div className="text-xs text-gray-500">{money(l.price)} each</div>
                  </div>
                  <button onClick={() => setQty(l.product_id, l.quantity - 1)}
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="text-sm text-white w-6 text-center">{l.quantity}</span>
                  <button onClick={() => setQty(l.product_id, l.quantity + 1)}
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800"><Plus className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setQty(l.product_id, 0)}
                    className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-gray-800"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-800 pt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input className={inputCls} placeholder="Customer (optional)" value={customer.customer_name}
                onChange={(e) => setCustomer(c => ({ ...c, customer_name: e.target.value }))} />
              <input className={inputCls} placeholder="Phone (optional)" value={customer.customer_phone}
                onChange={(e) => setCustomer(c => ({ ...c, customer_phone: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">Discount</label>
              <input className={`${inputCls} flex-1`} type="number" min={0} step="0.01" value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`px-2.5 py-1 rounded-full text-xs border capitalize transition-colors ${
                    method === m ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-700 text-gray-400"
                  }`}>{m}</button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-400 pt-1">
              <span>Subtotal</span><span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-white">
              <span>Total</span><span>{money(total)}</span>
            </div>
            <button onClick={checkout} disabled={!cart.length || saving}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
              Complete sale
            </button>
          </div>
        </div>
      </div>

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setReceipt(null)} />
          <div className="relative bg-gray-950 border border-gray-800 rounded-2xl p-8 text-center space-y-3 max-w-sm w-full">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <p className="text-lg font-bold text-white">Sale complete</p>
            <p className="text-sm text-gray-400">{receipt.orderNumber} · {money(receipt.total)}</p>
            <p className="text-xs text-gray-500">Recorded in Orders and Accounting. Stock updated.</p>
            <button onClick={() => setReceipt(null)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              New sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

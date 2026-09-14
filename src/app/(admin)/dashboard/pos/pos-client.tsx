"use client";

import { useState } from "react";
import {
  ShoppingCart, Search, Plus, Minus, Trash2, Loader2, CheckCircle, Banknote, Ban, Split, X,
} from "lucide-react";
import { PrinterNotice } from "@/components/admin/printer-notice";

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
  // Split-bill (Tier 3 restaurant vertical): showSplit opens the seat
  // editor; seatCount picks how many even seats to start from (per-line
  // assignment below can still move an item to any seat after that).
  // seatOf maps product_id -> seat index (0-based); a line not present in
  // the map defaults to seat 0 the first time the editor opens.
  const [showSplit, setShowSplit] = useState(false);
  const [seatCount, setSeatCount] = useState(2);
  const [seatOf, setSeatOf] = useState<Record<string, number>>({});
  const [splitting, setSplitting] = useState(false);

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

  function openSplit() {
    // Default every line to seat 0 (or its previously-assigned seat if the
    // editor was opened before and the cart hasn't changed) — starting
    // everything in seat 0 means "assign at least one item elsewhere" is
    // the only action needed for a simple 2-way split.
    setSeatOf(prev => {
      const next: Record<string, number> = {};
      for (const l of cart) next[l.product_id] = prev[l.product_id] ?? 0;
      return next;
    });
    setShowSplit(true);
  }

  function seatLines(seat: number): CartLine[] {
    return cart.filter(l => (seatOf[l.product_id] ?? 0) === seat);
  }
  function seatTotal(seat: number): number {
    return seatLines(seat).reduce((s, l) => s + l.price * l.quantity, 0);
  }

  /** Checks out every non-empty seat as its own POS order, sharing one
   *  split_group_id (migration 097) so they read as pieces of one table's
   *  bill in Orders history. Discount is applied to the FIRST non-empty
   *  seat only — splitting a discount across seats proportionally would be
   *  a reasonable next step, but guessing that allocation silently is
   *  worse than a staff member seeing it land on one bill and adjusting by
   *  hand if that's not what they meant. */
  async function checkoutSplit() {
    const nonEmptySeats = Array.from({ length: seatCount }, (_, i) => i).filter(seat => seatLines(seat).length > 0);
    if (nonEmptySeats.length < 2) { alert("Assign items to at least 2 seats to split the bill."); return; }

    setSplitting(true);
    const groupId = crypto.randomUUID();
    let anyFailed = false;
    let lastOrderNumber = "";
    let lastTotal = 0;

    for (let i = 0; i < nonEmptySeats.length; i++) {
      const seat = nonEmptySeats[i];
      const lines = seatLines(seat);
      const seatDiscount = i === 0 ? discount : 0;
      const res = await fetch("/api/ecommerce/pos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines, discount: seatDiscount, payment_method: method, ...customer,
          branch_id: branchId || undefined,
          table_id: tableId || undefined,
          split_group_id: groupId,
          split_label: `Seat ${seat + 1} of ${nonEmptySeats.length}`,
        }),
      });
      const d = await res.json();
      if (!res.ok) { anyFailed = true; break; }
      lastOrderNumber = d.orderNumber;
      lastTotal = d.total;
    }

    setSplitting(false);
    if (anyFailed) {
      alert("One of the split bills failed to save — check Orders before re-ringing anything, some seats may have already gone through.");
      return;
    }
    setShowSplit(false);
    setReceipt({ orderNumber: `${nonEmptySeats.length} split bills (last: ${lastOrderNumber})`, total: lastTotal });
    setCart([]); setDiscount(0); setCustomer({ customer_name: "", customer_phone: "" }); setTableId(""); setSeatOf({});
  }

  const shown = products.filter(p =>
    !q || `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-indigo-400" /> Point of Sale
      </h1>

      {branches.length > 0 && <PrinterNotice />}

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
            {/* Split-bill only makes sense for a dine-in table with more
                than one item — a takeaway or single-item sale has nothing
                to divide. */}
            {tableId && cart.length > 1 && (
              <button onClick={openSplit}
                className="w-full flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-600 text-gray-300 px-4 py-2 rounded-lg text-xs font-medium transition-colors">
                <Split className="w-3.5 h-3.5" /> Split bill
              </button>
            )}
          </div>
        </div>
      </div>

      {showSplit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSplit(false)} />
          <div className="relative bg-gray-950 border border-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Split className="w-5 h-5 text-indigo-400" /> Split bill</h3>
              <button onClick={() => setShowSplit(false)} className="p-1 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Seats</label>
              <button onClick={() => setSeatCount(n => Math.max(2, n - 1))}
                className="p-1.5 bg-gray-800 rounded-lg text-gray-400 hover:text-white"><Minus className="w-3.5 h-3.5" /></button>
              <span className="text-sm text-white w-6 text-center">{seatCount}</span>
              <button onClick={() => setSeatCount(n => Math.min(8, n + 1))}
                className="p-1.5 bg-gray-800 rounded-lg text-gray-400 hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
              <span className="text-xs text-gray-600 ml-2">Tap a seat number next to each item to move it</span>
            </div>

            <div className="space-y-2">
              {cart.map(l => (
                <div key={l.product_id} className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg p-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white truncate">{l.quantity}× {l.name}</div>
                    <div className="text-xs text-gray-500">{money(l.price * l.quantity)}</div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: seatCount }, (_, seat) => (
                      <button key={seat} onClick={() => setSeatOf(prev => ({ ...prev, [l.product_id]: seat }))}
                        className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors ${
                          (seatOf[l.product_id] ?? 0) === seat
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-800 text-gray-500 hover:text-white"
                        }`}>
                        {seat + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-800 pt-3 space-y-1.5">
              {Array.from({ length: seatCount }, (_, seat) => (
                seatLines(seat).length > 0 && (
                  <div key={seat} className="flex justify-between text-sm text-gray-300">
                    <span>Seat {seat + 1} ({seatLines(seat).length} item{seatLines(seat).length === 1 ? "" : "s"})</span>
                    <span>{money(seatTotal(seat))}</span>
                  </div>
                )
              ))}
            </div>

            <button onClick={checkoutSplit} disabled={splitting}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              {splitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
              {splitting ? "Charging seats…" : "Charge all seats"}
            </button>
          </div>
        </div>
      )}

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

"use client";

import { useState } from "react";
import { ChefHat, Clock, CheckCircle2, UtensilsCrossed, Bike } from "lucide-react";

interface OrderItem { name: string; quantity: number }
interface KitchenOrder {
  id: string;
  order_number: string;
  items: OrderItem[];
  branch_id: string | null;
  table_id: string | null;
  kitchen_status: string;
  fulfillment_type: string;
  customer_name: string;
  created_at: string;
  restaurant_tables: { table_number: string } | { table_number: string }[] | null;
}
interface Branch { id: string; name: string }
interface TableRow { id: string; table_number: string; branch_id: string; occupied: boolean }

const STAGES = [
  { key: "new", label: "New", icon: Clock },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: CheckCircle2 },
  { key: "served", label: "Served / out", icon: Bike },
] as const;

function nextStage(current: string): string | null {
  const i = STAGES.findIndex(s => s.key === current);
  if (i === -1 || i === STAGES.length - 1) return "completed";
  return STAGES[i + 1].key;
}

function tableLabel(order: KitchenOrder): string {
  const t = Array.isArray(order.restaurant_tables) ? order.restaurant_tables[0] : order.restaurant_tables;
  if (t) return `Table ${t.table_number}`;
  return order.fulfillment_type === "pickup" ? "Pickup" : order.fulfillment_type === "delivery" ? "Delivery" : "Takeaway";
}

export default function KitchenClient({ branches, orders: initial, tables = [] }: { branches: Branch[]; orders: KitchenOrder[]; tables?: TableRow[] }) {
  const [orders, setOrders] = useState(initial);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);

  async function advance(order: KitchenOrder) {
    const next = nextStage(order.kitchen_status);
    if (!next) return;
    setBusy(order.id);
    // Optimistic: a kitchen screen that lags a network round-trip behind a
    // tap reads as broken to someone standing at a hot line. Roll back only
    // if the request actually fails.
    const prevStatus = order.kitchen_status;
    setOrders(prev => next === "completed"
      ? prev.filter(o => o.id !== order.id)
      : prev.map(o => o.id === order.id ? { ...o, kitchen_status: next } : o));
    const res = await fetch("/api/ecommerce/kitchen", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, kitchen_status: next }),
    });
    setBusy(null);
    if (!res.ok) {
      setOrders(prev => next === "completed"
        ? [...prev, { ...order, kitchen_status: prevStatus }]
        : prev.map(o => o.id === order.id ? { ...o, kitchen_status: prevStatus } : o));
    }
  }

  const shown = branchFilter === "all" ? orders : orders.filter(o => o.branch_id === branchFilter);
  const shownTables = branchFilter === "all" ? tables : tables.filter(t => t.branch_id === branchFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-indigo-400" /> Kitchen
        </h1>
        {branches.length > 1 && (
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="all">All branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {shownTables.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {shownTables.map(t => (
            <div key={t.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                t.occupied ? "bg-amber-500/10 border-amber-600/40 text-amber-400" : "bg-gray-900 border-gray-800 text-gray-500"
              }`}>
              Table {t.table_number} · {t.occupied ? "Occupied" : "Free"}
            </div>
          ))}
        </div>
      )}

      {branches.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No branches set up yet. Add one to start taking dine-in and pickup orders.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map(stage => {
            const inStage = shown.filter(o => o.kitchen_status === stage.key);
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2 min-h-[200px]">
                <div className="flex items-center gap-2 text-sm font-semibold text-white px-1">
                  <Icon className="w-4 h-4 text-indigo-400" /> {stage.label}
                  <span className="text-gray-600 font-normal">({inStage.length})</span>
                </div>
                {inStage.map(order => (
                  <button key={order.id} onClick={() => advance(order)} disabled={busy === order.id}
                    className="w-full text-left bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-3 transition-colors disabled:opacity-50">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-mono text-gray-500">{order.order_number}</span>
                      <span className="text-xs text-indigo-400 shrink-0">{tableLabel(order)}</span>
                    </div>
                    <div className="text-sm text-white mt-1">{order.customer_name}</div>
                    <ul className="text-xs text-gray-400 mt-1.5 space-y-0.5">
                      {order.items.slice(0, 4).map((it, i) => (
                        <li key={i}>{it.quantity}× {it.name}</li>
                      ))}
                      {order.items.length > 4 && <li className="text-gray-600">+{order.items.length - 4} more</li>}
                    </ul>
                  </button>
                ))}
                {inStage.length === 0 && <p className="text-xs text-gray-700 text-center py-6">Empty</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

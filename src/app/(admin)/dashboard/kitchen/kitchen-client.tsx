"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChefHat, Clock, CheckCircle2, UtensilsCrossed, Bike, UserPlus } from "lucide-react";

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
  rider_id: string | null;
  delivery_status: string | null;
  restaurant_tables: { table_number: string } | { table_number: string }[] | null;
}
interface Branch { id: string; name: string }
interface TableRow { id: string; table_number: string; branch_id: string; occupied: boolean }
interface Rider { id: string; name: string; branch_id: string }

const DELIVERY_LABEL: Record<string, string> = {
  assigned: "Assigned",
  picked_up: "Picked up",
  delivered: "Delivered",
};
function nextDeliveryStatus(current: string): string | null {
  if (current === "assigned") return "picked_up";
  if (current === "picked_up") return "delivered";
  return null;
}

const STAGES = [
  { key: "new", label: "New", icon: Clock },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: CheckCircle2 },
  { key: "served", label: "Served / picked up", icon: Bike },
] as const;

function nextStage(current: string): string | null {
  const i = STAGES.findIndex(s => s.key === current);
  if (i === -1 || i === STAGES.length - 1) return "completed";
  return STAGES[i + 1].key;
}

/**
 * Two short beeps via the Web Audio API — no audio file, no new dependency,
 * for one sound played rarely. A fresh AudioContext per call rather than a
 * shared one: browsers suspend an AudioContext that goes quiet for a while,
 * and resuming it reliably needs its own userland gesture handling, more
 * complexity than a sound this occasional is worth.
 */
function playNewOrderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [0, 0.18].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.15);
    });
  } catch {
    // Autoplay policy or no audio hardware — a missed chime is not worth
    // surfacing an error over, the board itself still updates visually.
  }
}

/**
 * A real OS-level notification, not just an in-tab chime — fires even when
 * the kitchen tab is in the background (a phone screen off, another app
 * focused), which the tab-title flash and Web Audio chime above cannot do
 * on their own.
 *
 * This is the browser Notification API, not push: it only fires while this
 * tab is open somewhere (background is fine, fully closed is not). True
 * closed-tab push needs a service worker plus a VAPID key pair and a
 * subscription stored per device — a real backend piece, not a follow-on to
 * this. Flagged rather than silently built, since it changes what "the
 * kitchen gets notified" can promise.
 */
function notifyNewOrder(order: KitchenOrder) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification("New order — " + order.order_number, {
      body: `${order.customer_name} · ${tableLabel(order)}`,
      tag: order.id, // replaces rather than stacks if the same order somehow fires twice
    });
  } catch {
    // Some platforms (iOS Safari, certain PWA contexts) reject `new
    // Notification()` even when permission reads "granted" — the chime and
    // title flash already cover the same event, so this is not fatal.
  }
}

function tableLabel(order: KitchenOrder): string {
  const t = Array.isArray(order.restaurant_tables) ? order.restaurant_tables[0] : order.restaurant_tables;
  if (t) return `Table ${t.table_number}`;
  return order.fulfillment_type === "pickup" ? "Pickup" : order.fulfillment_type === "delivery" ? "Delivery" : "Takeaway";
}

export default function KitchenClient({ branches, orders: initial, tables = [], riders = [] }: {
  branches: Branch[]; orders: KitchenOrder[]; tables?: TableRow[]; riders?: Rider[];
}) {
  const [orders, setOrders] = useState(initial);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [riderList, setRiderList] = useState(riders);
  const [showAddRider, setShowAddRider] = useState(false);
  const [newRider, setNewRider] = useState({ branch_id: branches[0]?.id ?? "", name: "", phone: "" });

  // Live polling — the board previously never updated after the initial
  // page load, so a new order sitting in the tab a staff member wasn't
  // looking at simply never appeared until they manually refreshed. A ref
  // (not state) for the known-order-id set avoids re-subscribing the
  // interval on every poll purely to keep its closure's id set current.
  const knownIds = useRef(new Set(initial.map(o => o.id)));
  const originalTitle = useRef<string>("");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof Notification === "undefined") { setNotifPermission("unsupported"); return; }
    setNotifPermission(Notification.permission);
  }, []);

  function requestNotifPermission() {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then(setNotifPermission);
  }

  useEffect(() => {
    originalTitle.current = document.title;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/ecommerce/kitchen");
        if (!res.ok) return;
        const { orders: fresh } = await res.json() as { orders: KitchenOrder[] };
        const freshIds = new Set(fresh.map(o => o.id));
        const newOrders = fresh.filter(o => !knownIds.current.has(o.id));
        knownIds.current = freshIds;
        setOrders(fresh);
        if (newOrders.length) {
          playNewOrderChime();
          document.title = "🔔 New order — " + originalTitle.current;
          newOrders.forEach(notifyNewOrder);
        }
      } catch {
        // A dropped poll just tries again next interval — nothing to
        // reconcile, the board's current state stays exactly as it was.
      }
    }, 8000);
    // Staff looking back at the tab is what should clear the flashed title,
    // not a timeout — a fixed delay could clear it while they're still away.
    const onFocus = () => { document.title = originalTitle.current; };
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus); document.title = originalTitle.current; };
  }, []);

  async function addRider(e: React.FormEvent) {
    e.preventDefault();
    if (!newRider.branch_id || !newRider.name.trim()) return;
    const res = await fetch("/api/ecommerce/riders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRider),
    });
    const data = await res.json();
    if (res.ok) {
      setRiderList(prev => [...prev, data.rider]);
      setNewRider({ branch_id: newRider.branch_id, name: "", phone: "" });
      setShowAddRider(false);
    }
  }

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

  // A delivery order at "ready" stays there — kitchen_status only tracks the
  // food, and the food is done. What happens next (rider assigned, picked
  // up, delivered) is delivery_status's job; the order only leaves the
  // board once actually delivered (see advanceDelivery below), not the
  // moment a rider is picked.
  async function assignRider(order: KitchenOrder, riderId: string) {
    setBusy(order.id);
    const res = await fetch("/api/ecommerce/delivery", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, rider_id: riderId }),
    });
    setBusy(null);
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, rider_id: riderId, delivery_status: "assigned" } : o));
    }
  }

  async function advanceDelivery(order: KitchenOrder) {
    const next = nextDeliveryStatus(order.delivery_status ?? "");
    if (!next) return;
    setBusy(order.id);
    const prev = order.delivery_status;
    // Delivered is the actual end of this order's life on the board — mark
    // kitchen_status completed at the same time so it drops off here,
    // exactly like advance() does for dine-in/pickup.
    setOrders(cur => next === "delivered"
      ? cur.filter(o => o.id !== order.id)
      : cur.map(o => o.id === order.id ? { ...o, delivery_status: next } : o));
    const res = await fetch("/api/ecommerce/delivery", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, delivery_status: next }),
    });
    if (res.ok && next === "delivered") {
      await fetch("/api/ecommerce/kitchen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, kitchen_status: "completed" }),
      });
    }
    setBusy(null);
    if (!res.ok) {
      setOrders(cur => next === "delivered"
        ? [...cur, { ...order, delivery_status: prev }]
        : cur.map(o => o.id === order.id ? { ...o, delivery_status: prev } : o));
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

      {notifPermission === "default" && (
        <button onClick={requestNotifPermission}
          className="w-full flex items-center justify-between gap-3 bg-indigo-500/10 border border-indigo-600/40 rounded-lg px-4 py-2.5 text-sm text-indigo-300 hover:bg-indigo-500/20 transition-colors">
          <span>Turn on notifications to hear new orders even when this tab isn't in front.</span>
          <span className="text-xs font-medium underline shrink-0">Enable</span>
        </button>
      )}
      {notifPermission === "denied" && (
        <p className="text-xs text-amber-400">
          Notifications are blocked for this site — enable them in your browser's site settings to get alerted on new orders.
        </p>
      )}

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

      {branches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {riderList.map(r => (
            <span key={r.id} className="px-2.5 py-1 rounded-lg text-xs bg-gray-900 border border-gray-800 text-gray-400">
              {r.name}
            </span>
          ))}
          <button onClick={() => setShowAddRider(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 transition-colors">
            <UserPlus className="w-3 h-3" /> Add rider
          </button>
        </div>
      )}

      {showAddRider && (
        <form onSubmit={addRider} className="flex flex-wrap gap-2 bg-gray-900 border border-gray-800 rounded-lg p-3">
          {branches.length > 1 && (
            <select value={newRider.branch_id} onChange={(e) => setNewRider(r => ({ ...r, branch_id: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-xs text-white">
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <input placeholder="Rider name" value={newRider.name}
            onChange={(e) => setNewRider(r => ({ ...r, name: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-xs text-white placeholder-gray-500" />
          <input placeholder="Phone (optional)" value={newRider.phone}
            onChange={(e) => setNewRider(r => ({ ...r, phone: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-xs text-white placeholder-gray-500" />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-md px-3 py-1.5 text-xs font-medium transition-colors">
            Add
          </button>
        </form>
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
                {inStage.map(order => {
                  // Only a "ready" delivery order branches away from plain
                  // tap-to-advance — every other stage/fulfillment combo
                  // behaves exactly as before.
                  const isDeliveryReady = stage.key === "ready" && order.fulfillment_type === "delivery";
                  const branchRiders = riderList.filter(r => r.branch_id === order.branch_id);
                  const cardBody = (
                    <>
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
                    </>
                  );

                  if (!isDeliveryReady) {
                    return (
                      <button key={order.id} onClick={() => advance(order)} disabled={busy === order.id}
                        className="w-full text-left bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-3 transition-colors disabled:opacity-50">
                        {cardBody}
                      </button>
                    );
                  }

                  return (
                    <div key={order.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                      {cardBody}
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        {!order.rider_id ? (
                          branchRiders.length > 0 ? (
                            <select disabled={busy === order.id} defaultValue=""
                              onChange={(e) => e.target.value && assignRider(order, e.target.value)}
                              className="w-full bg-gray-900 border border-gray-700 rounded-md px-2 py-1.5 text-xs text-white">
                              <option value="" disabled>Assign rider…</option>
                              {branchRiders.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                          ) : (
                            <p className="text-[11px] text-amber-400">No riders — add one in Rider settings</p>
                          )
                        ) : (
                          <button onClick={() => advanceDelivery(order)} disabled={busy === order.id}
                            className="w-full flex items-center justify-center gap-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-md px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50">
                            <Bike className="w-3 h-3" /> {DELIVERY_LABEL[order.delivery_status ?? "assigned"]} — tap to advance
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {inStage.length === 0 && <p className="text-xs text-gray-700 text-center py-6">Empty</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

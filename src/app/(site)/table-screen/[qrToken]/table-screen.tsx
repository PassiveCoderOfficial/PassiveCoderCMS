"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, UtensilsCrossed, ChefHat, CheckCircle2, Clock } from "lucide-react";
import { setDineInTableToken } from "@/lib/dine-in/table-context";

interface OrderItem { name: string; quantity: number }
interface TableOrder {
  id: string; order_number: string; items: OrderItem[]; kitchen_status: string; created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", cooking: "Cooking", ready: "Ready", served: "Served",
};
const STATUS_ICON: Record<string, typeof Clock> = {
  pending: Clock, cooking: ChefHat, ready: CheckCircle2, served: CheckCircle2,
};

const PIN_KEY_PREFIX = "pc_table_screen_pin_";

/**
 * PIN-gated persistent tablet view (see page.tsx for the full design
 * rationale). The PIN unlock is remembered in sessionStorage keyed by
 * qrToken — a tablet mounted at the table stays unlocked across reloads
 * within its session, since re-entering a PIN on every page refresh would
 * defeat the point of a persistent screen; staff can always force a
 * re-lock by clearing the tablet's browser data.
 */
export function TableScreen({ qrToken, tableId, tableNumber, branchName }: {
  qrToken: string; tableId: string; tableNumber: string; branchName: string;
}) {
  const [pin, setPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [orders, setOrders] = useState<TableOrder[]>([]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PIN_KEY_PREFIX + qrToken);
      if (saved) setPin(saved);
    } catch {
      // Private-browsing / storage-blocked tablet — just re-prompts for the
      // PIN every load, not a broken experience, only a less convenient one.
    }
  }, [qrToken]);

  useEffect(() => {
    // Stashing the table token here too — a tablet mounted at this table is
    // exactly where "order more" should route through the same dine-in
    // checkout path as the phone-scan flow, not a separate cart mechanism.
    setDineInTableToken(qrToken);
  }, [qrToken]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setPinError(null);
    const res = await fetch(`/api/public/table-screen/${qrToken}?pin=${encodeURIComponent(pinInput)}`);
    setChecking(false);
    if (res.ok) {
      setPin(pinInput);
      try { sessionStorage.setItem(PIN_KEY_PREFIX + qrToken, pinInput); } catch { /* see above */ }
    } else {
      setPinError("Incorrect PIN");
    }
  }

  useEffect(() => {
    if (!pin) return;
    let cancelled = false;
    function poll() {
      fetch(`/api/public/table-screen/${qrToken}?pin=${encodeURIComponent(pin!)}`)
        .then(r => {
          if (r.status === 401) { setPin(null); try { sessionStorage.removeItem(PIN_KEY_PREFIX + qrToken); } catch {} ; throw new Error(); }
          return r.json();
        })
        .then((d: { orders: TableOrder[] }) => { if (!cancelled) setOrders(d.orders); })
        .catch(() => {});
    }
    poll();
    const interval = setInterval(poll, 8000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [pin, qrToken]);

  if (!pin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950 text-white">
        <form onSubmit={unlock} className="w-full max-w-xs text-center space-y-4">
          <KeyRound className="w-8 h-8 mx-auto text-gray-500" />
          <div>
            <p className="font-semibold">{branchName}</p>
            <p className="text-sm text-gray-400">Table {tableNumber}</p>
          </div>
          <input
            type="password" inputMode="numeric" autoFocus
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter PIN"
            className="w-full text-center text-2xl tracking-[0.3em] bg-gray-900 border border-gray-700 rounded-lg py-3 text-white"
          />
          {pinError && <p className="text-xs text-red-400">{pinError}</p>}
          <button type="submit" disabled={checking || !pinInput}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium">
            {checking ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6 space-y-6">
      <div className="text-center">
        <p className="font-semibold">{branchName}</p>
        <p className="text-sm text-gray-400">Table {tableNumber}</p>
      </div>

      <div className="space-y-3 max-w-md mx-auto">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No orders yet from this table.</p>
          </div>
        ) : (
          orders.map(o => {
            const Icon = STATUS_ICON[o.kitchen_status] ?? Clock;
            return (
              <div key={o.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-gray-500">{o.order_number}</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-300">
                    <Icon className="w-3.5 h-3.5" /> {STATUS_LABEL[o.kitchen_status] ?? o.kitchen_status}
                  </span>
                </div>
                <ul className="text-xs text-gray-400 space-y-0.5">
                  {o.items.slice(0, 6).map((it, i) => <li key={i}>{it.quantity}× {it.name}</li>)}
                </ul>
              </div>
            );
          })
        )}
      </div>

      <div className="text-center pt-2">
        <a href="/" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-6 py-2.5 text-sm font-medium">
          Order more
        </a>
      </div>
    </div>
  );
}

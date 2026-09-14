"use client";

import { useEffect, useState } from "react";
import { ChefHat, Clock, CheckCircle2 } from "lucide-react";

interface MonitorOrder {
  id: string;
  order_number: string;
  kitchen_status: string;
  fulfillment_type: string;
  created_at: string;
}

// Same fulfillment-aware pipeline as KITCHEN (migration 092) — collapsed to
// 3 columns here since a waiting customer only needs "not started yet /
// being made / come get it", not the full staff-side granularity.
const COOKING_STATUSES = ["pending", "cooking"];
const READY_STATUSES = ["ready", "ready_to_pick"];

function orderLabel(o: MonitorOrder): string {
  // Last 4 digits of the order number reads better on a TV than a full
  // "ORD-1234567890" string — a waiting customer only needs enough to spot
  // their own receipt number in the crowd.
  return o.order_number.slice(-4);
}

/**
 * Public queue display — no interaction, polls every 5s, meant to run
 * unattended on a screen. Deliberately high-contrast/large-text: this is
 * read from a few meters away, not a dashboard someone sits in front of.
 */
export function MonitorBoard({ branchId, branchName }: { branchId: string; branchName: string }) {
  const [orders, setOrders] = useState<MonitorOrder[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function poll() {
      fetch(`/api/public/monitor/${branchId}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then((d: { orders: MonitorOrder[] }) => { if (!cancelled) { setOrders(d.orders); setError(false); } })
        .catch(() => { if (!cancelled) setError(true); });
    }
    poll();
    const interval = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [branchId]);

  const cooking = orders.filter(o => COOKING_STATUSES.includes(o.kitchen_status));
  const ready = orders.filter(o => READY_STATUSES.includes(o.kitchen_status));

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 sm:p-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-300">{branchName}</h1>
        {error && <p className="text-sm text-red-500 mt-1">Connection lost — retrying…</p>}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-amber-400 mb-6">
            <ChefHat className="w-7 h-7 sm:w-9 sm:h-9" />
            <h2 className="text-xl sm:text-3xl font-bold">Preparing</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {cooking.length === 0 && <p className="text-gray-600 text-lg mt-8">No orders in progress</p>}
            {cooking.map(o => (
              <div key={o.id} className="bg-gray-900 border-2 border-gray-800 rounded-2xl px-6 py-4 sm:px-8 sm:py-6">
                <span className="text-3xl sm:text-5xl font-black tabular-nums text-gray-200">#{orderLabel(o)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-green-400 mb-6">
            <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9" />
            <h2 className="text-xl sm:text-3xl font-bold">Ready</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {ready.length === 0 && <p className="text-gray-600 text-lg mt-8">Nothing ready yet</p>}
            {ready.map(o => (
              <div key={o.id} className="bg-green-950/60 border-2 border-green-600 rounded-2xl px-6 py-4 sm:px-8 sm:py-6 animate-pulse">
                <span className="text-3xl sm:text-5xl font-black tabular-nums text-green-300">#{orderLabel(o)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-gray-700 text-xs mt-8 flex items-center justify-center gap-1.5">
        <Clock className="w-3.5 h-3.5" /> Updates automatically
      </p>
    </div>
  );
}

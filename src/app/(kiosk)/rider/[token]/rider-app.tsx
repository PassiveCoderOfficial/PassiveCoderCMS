"use client";

import { useEffect, useState } from "react";
import { Bike, MapPin, Phone, Package, CheckCircle2, Navigation } from "lucide-react";

interface OrderItem { name: string; quantity: number }
interface BillingAddress { first_name?: string; last_name?: string; phone?: string; address?: string; city?: string }
interface RiderOrder {
  id: string; order_number: string; customer_name: string;
  billing_address: BillingAddress | null; items: OrderItem[]; delivery_status: string; created_at: string;
}

const STATUS_LABEL: Record<string, string> = { assigned: "Assigned to you", picked_up: "Picked up" };
function nextStatus(current: string): string | null {
  if (current === "assigned") return "picked_up";
  if (current === "picked_up") return "delivered";
  return null;
}
function nextLabel(current: string): string {
  if (current === "assigned") return "Mark picked up";
  return "Mark delivered";
}

/**
 * No-login rider app — token in the URL is the whole access control (see
 * page.tsx). Thin layer on the existing delivery_status pipeline (Phase 4):
 * this doesn't invent new delivery state, just gives the rider their own
 * phone-sized view of assigned/picked_up -> delivered, same two steps
 * kitchen-client.tsx already drives from the staff side.
 */
export function RiderApp({ token, riderName, branchName }: { token: string; riderName: string; branchName: string }) {
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [sharingLocation, setSharingLocation] = useState<"idle" | "on" | "denied" | "unsupported">("idle");

  useEffect(() => {
    let cancelled = false;
    function poll() {
      fetch(`/api/public/rider/${token}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then((d: { orders: RiderOrder[] }) => { if (!cancelled) { setOrders(d.orders); setError(false); } })
        .catch(() => { if (!cancelled) setError(true); });
    }
    poll();
    const interval = setInterval(poll, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [token]);

  // Live GPS (Tier 3, migration 098) — only shares while there's an actual
  // active delivery, not the moment the tablet/phone loads this page. Uses
  // watchPosition (continuous) rather than polling getCurrentPosition on a
  // timer — the browser's own throttling/battery optimization applies
  // either way, watchPosition is just the correct API for "keep me updated"
  // rather than "ask once, repeatedly".
  useEffect(() => {
    if (orders.length === 0) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) { setSharingLocation("unsupported"); return; }

    let lastSent = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setSharingLocation("on");
        const now = Date.now();
        // Client-side pace, independent of how often the browser itself
        // fires position updates (which can be every few seconds while
        // moving) — one post every ~20s is plenty for a staff-facing "last
        // seen" display, no reason to hammer the endpoint on every fix.
        if (now - lastSent < 20000) return;
        lastSent = now;
        fetch(`/api/public/rider/${token}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        }).catch(() => {});
      },
      () => setSharingLocation("denied"),
      { enableHighAccuracy: false, maximumAge: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [orders.length, token]);

  async function advance(order: RiderOrder) {
    const next = nextStatus(order.delivery_status);
    if (!next) return;
    setBusy(order.id);
    const res = await fetch(`/api/public/rider/${token}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, delivery_status: next }),
    });
    setBusy(null);
    if (res.ok) {
      if (next === "delivered") {
        setOrders(prev => prev.filter(o => o.id !== order.id));
      } else {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, delivery_status: next } : o));
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Bike className="w-5 h-5 text-indigo-400" />
          <div>
            <p className="font-semibold text-sm">{riderName}</p>
            <p className="text-xs text-gray-500">{branchName}</p>
          </div>
        </div>
        {orders.length > 0 && (
          <span className={`flex items-center gap-1 text-[11px] ${sharingLocation === "on" ? "text-green-400" : "text-gray-600"}`} title={
            sharingLocation === "denied" ? "Location permission denied — turn it on in your browser settings so staff can see where you are"
            : sharingLocation === "unsupported" ? "This device doesn't support location sharing"
            : sharingLocation === "on" ? "Sharing your location with staff"
            : "Waiting for location…"
          }>
            <Navigation className="w-3 h-3" /> {sharingLocation === "on" ? "Location on" : sharingLocation === "denied" ? "Location off" : "…"}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-red-500 text-center">Connection lost — retrying…</p>}

      <div className="space-y-3 max-w-md mx-auto">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No deliveries assigned right now.</p>
          </div>
        ) : (
          orders.map(o => {
            const addr = o.billing_address;
            return (
              <div key={o.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{o.customer_name}</p>
                    <p className="text-xs font-mono text-gray-500">{o.order_number}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 font-medium shrink-0">
                    {STATUS_LABEL[o.delivery_status] ?? o.delivery_status}
                  </span>
                </div>

                {addr?.address && (
                  <p className="text-xs text-gray-400 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {addr.address}{addr.city ? `, ${addr.city}` : ""}
                  </p>
                )}
                {addr?.phone && (
                  <a href={`tel:${addr.phone}`} className="text-xs text-indigo-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {addr.phone}
                  </a>
                )}

                <ul className="text-xs text-gray-400 space-y-0.5">
                  {o.items.slice(0, 6).map((it, i) => <li key={i}>{it.quantity}× {it.name}</li>)}
                </ul>

                <button onClick={() => advance(o)} disabled={busy === o.id}
                  className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> {busy === o.id ? "Updating…" : nextLabel(o.delivery_status)}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, PackageSearch, Store, Truck, ExternalLink, CheckCircle2, Circle, XCircle } from "lucide-react";

interface Parcel {
  id: string;
  number: string;
  status: string;
  seller: string;
  items: { name: string; quantity: number }[];
  courier: string | null;
  consignment_id: string | null;
  tracking_url: string | null;
  times: { placed: string; accepted: string | null; shipped: string | null; delivered: string | null };
  events: { status: string | null; message: string | null; at: string }[];
}
interface Result {
  timezone: string;
  order: { id: string; order_number: string; created_at: string; payment: string; ship_to: string };
  parcels: Parcel[];
}

const STEPS: { label: string; time: keyof Parcel["times"] | null }[] = [
  { label: "Order placed", time: "placed" },
  { label: "Confirmed by seller", time: "accepted" },
  { label: "Packed", time: null },
  { label: "With the courier", time: "shipped" },
  { label: "Delivered", time: "delivered" },
];
const RANK: Record<string, number> = { pending: 0, accepted: 1, packed: 2, shipped: 3, delivered: 4 };

const inputCls = "w-full border rounded-xl px-3.5 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary";

/** Customer parcel tracking: our steps per parcel plus the courier's own updates. */
export function TrackClient({ initialOrder, initialPhone, orderId }: { initialOrder: string; initialPhone: string; orderId: string | null }) {
  const [order, setOrder] = useState(initialOrder);
  const [phone, setPhone] = useState(initialPhone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<Result | null>(null);

  const lookup = useCallback(async (body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/storefront/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setRes(null); setError(d.error ?? "Could not find that order"); return; }
    setRes(d);
    if (d.order?.order_number) setOrder(d.order.order_number);
  }, []);

  useEffect(() => {
    if (orderId) lookup({ id: orderId });
    else if (initialOrder && initialPhone) lookup({ order_number: initialOrder, phone: initialPhone });
  }, [orderId, initialOrder, initialPhone, lookup]);

  const fmt = (iso: string | null | undefined) => {
    if (!iso) return "";
    try {
      return new Intl.DateTimeFormat("en-GB", { timeZone: res?.timezone || "Asia/Dhaka", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
    } catch {
      return new Date(iso).toLocaleString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card border p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <PackageSearch className="w-7 h-7 text-primary shrink-0" />
          <div>
            <h1 className="text-xl font-bold">Track your order</h1>
            <p className="text-sm text-muted-foreground">Enter your order number and the mobile number you ordered with.</p>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); lookup({ order_number: order, phone }); }} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
          <input className={inputCls} value={order} onChange={(e) => setOrder(e.target.value.toUpperCase())} placeholder="Order number, e.g. SK-M3X1Y2" aria-label="Order number" required />
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" inputMode="tel" aria-label="Mobile number" required={!orderId} />
          <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Track
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      {res && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-card border p-4 text-sm flex flex-wrap gap-x-6 gap-y-1">
            <span>Order <b className="font-mono">{res.order.order_number}</b></span>
            <span className="text-muted-foreground">Placed {fmt(res.order.created_at)}</span>
            <span className="text-muted-foreground">{res.order.payment}</span>
            {res.order.ship_to && <span className="text-muted-foreground">To {res.order.ship_to}</span>}
          </div>

          {res.parcels.length > 1 && (
            <p className="text-sm text-muted-foreground">This order ships as {res.parcels.length} separate parcels, one per seller.</p>
          )}
          {res.parcels.length === 0 && (
            <p className="text-sm text-muted-foreground">This order has no parcels to track yet.</p>
          )}

          {res.parcels.map((p) => {
            const stopped = p.status === "cancelled" || p.status === "returned";
            const rank = RANK[p.status] ?? (p.times.shipped ? 3 : p.times.accepted ? 1 : 0);
            return (
              <div key={p.id} className="rounded-2xl bg-card border p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Store className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{p.seller}</span>
                  <span className="text-xs font-mono text-muted-foreground">{p.number}</span>
                  <span className={`ml-auto text-[11px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${stopped ? "bg-red-100 text-red-700" : p.status === "delivered" ? "bg-green-100 text-green-800" : "bg-primary/10 text-primary"}`}>
                    {p.status === "shipped" ? "On the way" : p.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{p.items.map((i) => `${i.name} x ${i.quantity}`).join(", ")}</p>

                {p.courier && (
                  <div className="flex flex-wrap items-center gap-2 text-sm rounded-xl bg-muted/50 px-3 py-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <span className="font-medium">{p.courier}</span>
                    {p.consignment_id && <span className="font-mono text-muted-foreground">{p.consignment_id}</span>}
                    {p.tracking_url && (
                      <a href={p.tracking_url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                        Track on {p.courier} <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                <ol className="space-y-3 pl-1">
                  {STEPS.map((s, i) => {
                    const done = rank >= i;
                    const t = s.time ? p.times[s.time] : null;
                    return (
                      <li key={s.label} className="flex items-start gap-3">
                        {done ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> : <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${done ? "font-medium" : "text-muted-foreground"}`}>{s.label}</p>
                          {done && t && <p className="text-xs text-muted-foreground">{fmt(t)}</p>}
                        </div>
                      </li>
                    );
                  })}
                  {stopped && (
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                      <p className="text-sm font-medium text-red-700">{p.status === "cancelled" ? "Cancelled" : "Returned to seller"}</p>
                    </li>
                  )}
                </ol>

                {p.events.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Courier updates</p>
                    <ul className="space-y-2">
                      {[...p.events].reverse().map((e, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{fmt(e.at)}</span>
                          <span>{e.message || e.status}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

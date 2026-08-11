"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Phone, MapPin, Package, Banknote, Truck } from "lucide-react";

interface SubOrder {
  id: string;
  sub_order_number: string;
  status: "pending" | "accepted" | "packed" | "shipped" | "delivered" | "cancelled" | "returned";
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  commission_amount: number;
  vendor_earning: number;
  cod_amount: number;
  courier: string | null;
  tracking_number: string | null;
  created_at: string;
  orders: {
    order_number: string;
    payment_method: string;
    shipping_address: {
      name?: string; phone?: string; address?: string; area?: string; city?: string; note?: string;
    } | null;
  } | null;
}

/** Mirrors the server-side FLOW map in /api/vendor/orders — the API is the
 *  authority, this only decides which button to show. */
const NEXT_STEP: Record<string, { to: SubOrder["status"]; label: string } | null> = {
  pending: { to: "accepted", label: "Accept order" },
  accepted: { to: "packed", label: "Mark packed" },
  packed: { to: "shipped", label: "Mark shipped" },
  shipped: { to: "delivered", label: "Mark delivered" },
  delivered: null,
  cancelled: null,
  returned: null,
};

const STATUS_CLS: Record<SubOrder["status"], string> = {
  pending: "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]",
  accepted: "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]",
  packed: "bg-[#EEF4FF] text-[#3538CD] border-[#C7D7FE]",
  shipped: "bg-[#F4F3FF] text-[#5925DC] border-[#D9D6FE]",
  delivered: "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]",
  cancelled: "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]",
  returned: "bg-[#FFF6ED] text-[#B93815] border-[#F9DBAF]",
};

const COURIERS = ["Pathao", "Steadfast", "RedX", "Sundarban", "Self delivery"];
const tk = (n: number) => `৳${Number(n).toLocaleString()}`;

const TABS = ["pending", "accepted", "packed", "shipped", "delivered", "all"] as const;

export default function VendorOrdersClient() {
  const [orders, setOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const [draft, setDraft] = useState<Record<string, { courier: string; tracking: string }>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = tab === "all" ? "" : `?status=${tab}`;
    const res = await fetch(`/api/vendor/orders${qs}`);
    const d = await res.json();
    setOrders(Array.isArray(d) ? d : []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function advance(o: SubOrder, to: SubOrder["status"]) {
    setBusy(o.id);
    setError(null);
    const extra = draft[o.id];
    const res = await fetch("/api/vendor/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: o.id,
        status: to,
        ...(extra?.courier ? { courier: extra.courier } : {}),
        ...(extra?.tracking ? { tracking_number: extra.tracking } : {}),
      }),
    });
    const d = await res.json();
    setBusy(null);
    if (!res.ok) { setError(d.error ?? "Could not update order"); return; }
    load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1330]">Orders</h1>
        <p className="text-sm text-[#667085] mt-1">
          Each order here is your part of a customer&apos;s basket. You pack and ship it directly.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm border capitalize transition-colors ${
              tab === t
                ? "bg-[#FF5A1F] border-[#FF5A1F] text-white"
                : "border-[#EAECF0] text-[#667085] hover:bg-[#F9FAFB]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-[#B42318] border border-[#FECDCA] bg-[#FEF3F2] rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#D0D5DD]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-[#EAECF0] rounded-xl p-10 text-center text-[#98A2B3]">
          No {tab === "all" ? "" : tab} orders.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const step = NEXT_STEP[o.status];
            const addr = o.orders?.shipping_address;
            const isCod = o.orders?.payment_method === "cod";
            const needsCourier = o.status === "packed";
            return (
              <div key={o.id} className="border border-[#EAECF0] rounded-2xl bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-[#EAECF0] flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-[#1A1330]">{o.sub_order_number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_CLS[o.status]}`}>
                    {o.status}
                  </span>
                  {isCod && (
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-[#F9FAFB] border-[#EAECF0] text-[#475467] flex items-center gap-1">
                      <Banknote className="w-3 h-3" /> COD {tk(o.cod_amount)}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-[#98A2B3]">
                    {new Date(o.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="p-4 grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-3">
                    <ul className="space-y-1.5">
                      {(o.items ?? []).map((it, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Package className="w-3.5 h-3.5 text-[#D0D5DD] shrink-0" />
                          <span className="text-gray-200 truncate">{it.name}</span>
                          <span className="text-[#98A2B3]">× {it.quantity}</span>
                          <span className="ml-auto text-[#667085]">{tk(it.price * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>

                    {addr && (
                      <div className="text-sm text-[#667085] space-y-1 border-t border-[#EAECF0] pt-3">
                        <p className="text-gray-200">{addr.name}</p>
                        {addr.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            <a href={`tel:${addr.phone}`} className="hover:text-[#1A1330]">{addr.phone}</a>
                          </p>
                        )}
                        <p className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>
                            {addr.address}
                            {addr.area ? `, ${addr.area}` : ""}
                            {addr.city ? `, ${addr.city}` : ""}
                          </span>
                        </p>
                        {addr.note && <p className="text-[#98A2B3] italic">Note: {addr.note}</p>}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-[#667085]">
                      <span>Items</span><span>{tk(o.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#667085]">
                      <span>Delivery</span><span>{tk(o.shipping_cost)}</span>
                    </div>
                    <div className="flex justify-between text-[#98A2B3]">
                      <span>Commission</span><span>−{tk(o.commission_amount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-[#1A1330] border-t border-[#EAECF0] pt-2">
                      <span>You earn</span><span>{tk(o.vendor_earning)}</span>
                    </div>

                    {(needsCourier || o.courier) && (
                      <div className="space-y-2 pt-2">
                        <select
                          value={draft[o.id]?.courier ?? o.courier ?? ""}
                          onChange={(e) =>
                            setDraft((p) => ({
                              ...p,
                              [o.id]: { courier: e.target.value, tracking: p[o.id]?.tracking ?? o.tracking_number ?? "" },
                            }))
                          }
                          className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-lg px-2 py-1.5 text-sm text-[#1A1330]"
                        >
                          <option value="">Select courier</option>
                          {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                          value={draft[o.id]?.tracking ?? o.tracking_number ?? ""}
                          onChange={(e) =>
                            setDraft((p) => ({
                              ...p,
                              [o.id]: { courier: p[o.id]?.courier ?? o.courier ?? "", tracking: e.target.value },
                            }))
                          }
                          placeholder="Tracking / consignment no."
                          className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-lg px-2 py-1.5 text-sm text-[#1A1330] placeholder-[#98A2B3]"
                        />
                      </div>
                    )}

                    {o.courier && o.status !== "packed" && (
                      <p className="text-xs text-[#98A2B3] flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" /> {o.courier}
                        {o.tracking_number ? ` · ${o.tracking_number}` : ""}
                      </p>
                    )}

                    {step && (
                      <button
                        onClick={() => advance(o, step.to)}
                        disabled={busy === o.id}
                        className="w-full inline-flex items-center justify-center gap-2 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 mt-1"
                      >
                        {busy === o.id && <Loader2 className="w-4 h-4 animate-spin" />}
                        {step.label}
                      </button>
                    )}
                    {o.status === "pending" && (
                      <button
                        onClick={() => advance(o, "cancelled")}
                        disabled={busy === o.id}
                        className="w-full text-xs text-[#98A2B3] hover:text-[#B42318] disabled:opacity-50"
                      >
                        Cannot fulfil — cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

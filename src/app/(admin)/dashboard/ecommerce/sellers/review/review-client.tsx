"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2, X, Check, Store, ImageOff } from "lucide-react";

interface ReviewProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  images: string[];
  description: string | null;
  short_description: string | null;
  stock_quantity: number;
  approval_status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  status: string;
  created_at: string;
  vendors: { id: string; name: string; slug: string | null } | null;
}

const TABS = [
  { key: "pending", label: "Awaiting review" },
  { key: "rejected", label: "Rejected" },
  { key: "approved", label: "Approved" },
] as const;

const btnGhost =
  "inline-flex items-center gap-2 border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors";

export default function ReviewClient() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("pending");
  const [items, setItems] = useState<ReviewProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejecting, setRejecting] = useState<ReviewProduct | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/marketplace-ecom/product-review?status=${tab}`);
    const d = await res.json();
    setItems(Array.isArray(d) ? d : []);
    setSelected(new Set());
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function act(ids: string[], action: "approve" | "reject", why?: string) {
    if (!ids.length) return;
    setBusy(ids[0]);
    const res = await fetch("/api/marketplace-ecom/product-review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action, reason: why }),
    });
    setBusy(null);
    if (res.ok) {
      setItems((prev) => prev.filter((p) => !ids.includes(p.id)));
      setSelected(new Set());
      setRejecting(null);
      setReason("");
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BadgeCheck className="w-6 h-6 text-indigo-400" /> Listing review
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Seller listings stay out of the catalogue until approved here.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              tab === t.key
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "border-gray-700 text-gray-400 hover:bg-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
        {selected.size > 0 && tab === "pending" && (
          <button
            onClick={() => act([...selected], "approve")}
            className="ml-auto inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Check className="w-4 h-4" /> Approve {selected.size} selected
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="border border-gray-800 rounded-xl p-10 text-center text-gray-500">
          Nothing in this queue.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const img = Array.isArray(p.images) ? p.images[0] : undefined;
            return (
              <div key={p.id} className="border border-gray-800 rounded-xl p-4 bg-gray-900/40 flex gap-4">
                {tab === "pending" && (
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="mt-1 w-4 h-4 shrink-0 accent-indigo-500"
                  />
                )}
                <div className="w-20 h-20 shrink-0 rounded-lg bg-gray-800 overflow-hidden flex items-center justify-center">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff className="w-6 h-6 text-gray-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{p.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Store className="w-3.5 h-3.5" />
                        {p.vendors?.name ?? "Unknown seller"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-semibold">৳{Number(p.price).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{p.stock_quantity} in stock</p>
                    </div>
                  </div>

                  {(p.short_description || p.description) && (
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                      {p.short_description || p.description}
                    </p>
                  )}

                  {p.rejection_reason && (
                    <p className="text-sm text-red-400 mt-2">Rejected: {p.rejection_reason}</p>
                  )}

                  {tab !== "approved" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => act([p.id], "approve")}
                        disabled={busy === p.id}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-green-900/40 border border-green-700/50 text-green-300 hover:bg-green-900/60 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      {tab === "pending" && (
                        <button
                          onClick={() => { setRejecting(p); setReason(""); }}
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-red-900/40 border border-red-700/50 text-red-300 hover:bg-red-900/60"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setRejecting(null)} />
          <div className="relative w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-lg font-semibold text-white">Reject listing</h2>
            <p className="text-sm text-gray-400">
              The seller sees this reason and can edit the listing to resubmit it.
            </p>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Photos are unclear, add a real product image"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejecting(null)} className={btnGhost}>Cancel</button>
              <button
                onClick={() => act([rejecting.id], "reject", reason)}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Reject listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

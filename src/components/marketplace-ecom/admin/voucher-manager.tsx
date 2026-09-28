"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Ticket, Trash2, X } from "lucide-react";

interface Voucher {
  id: string;
  code: string;
  title: string;
  kind: "percent" | "fixed" | "free_shipping";
  value: number;
  max_discount: number | null;
  min_spend: number;
  ends_at: string | null;
  usage_limit: number | null;
  per_user_limit: number;
  used_count: number;
  is_public: boolean;
  status: "active" | "paused";
}

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;
const inputCls =
  "w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-sm text-[#1A1330] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25";

function describe(v: Pick<Voucher, "kind" | "value" | "max_discount">) {
  if (v.kind === "free_shipping") return "Free delivery";
  if (v.kind === "percent") return `${Number(v.value)}% off${v.max_discount ? ` (max ${tk(v.max_discount)})` : ""}`;
  return `${tk(v.value)} off`;
}

/**
 * Voucher list + create form. One component for both the store admin
 * (platform vouchers, `endpoint=/api/marketplace-ecom/vouchers`) and sellers
 * (shop vouchers, `/api/vendor/vouchers`).
 */
export function VoucherManager({ endpoint, seller = false }: { endpoint: string; seller?: boolean }) {
  const [rows, setRows] = useState<Voucher[] | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    code: "", title: "", kind: "fixed", value: "", max_discount: "", min_spend: "",
    ends_at: "", usage_limit: "", per_user_limit: "1", is_public: true,
  });

  const load = useCallback(async () => {
    const r = await fetch(endpoint);
    const d = await r.json();
    setRows(d.vouchers ?? []);
  }, [endpoint]);
  useEffect(() => { load(); }, [load]);

  async function create() {
    setSaving(true);
    setError(null);
    const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) return setError(d.error ?? "Couldn't save");
    setOpen(false);
    setF({ ...f, code: "", title: "", value: "", max_discount: "", min_spend: "", ends_at: "", usage_limit: "" });
    load();
  }

  async function toggle(v: Voucher) {
    await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: v.id, status: v.status === "active" ? "paused" : "active" }) });
    load();
  }
  async function remove(v: Voucher) {
    await fetch(`${endpoint}?id=${v.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#667085]">
          {seller
            ? "Shop vouchers come off your sales (commission is charged on the discounted price)."
            : "Platform vouchers are paid by the marketplace — sellers still receive their full price."}
        </p>
        <button onClick={() => setOpen(true)} className="shrink-0 inline-flex items-center gap-1.5 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white text-sm font-semibold px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> New voucher
        </button>
      </div>

      {!rows ? (
        <Loader2 className="w-5 h-5 animate-spin text-[#D0D5DD]" />
      ) : rows.length === 0 ? (
        <div className="bg-white border border-[#EAECF0] rounded-xl p-10 text-center text-sm text-[#667085]">
          <Ticket className="w-8 h-8 mx-auto mb-2 text-[#D0D5DD]" />
          No vouchers yet. Vouchers show on product pages and at checkout.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map((v) => {
            const expired = v.ends_at && new Date(v.ends_at) < new Date();
            return (
              <div key={v.id} className={`flex rounded-xl border border-[#EAECF0] bg-white overflow-hidden ${v.status !== "active" || expired ? "opacity-60" : ""}`}>
                <div className="w-24 shrink-0 bg-gradient-to-b from-[#FF5A1F] to-[#FF8A3D] text-white flex flex-col items-center justify-center p-2 text-center">
                  <Ticket className="w-5 h-5" />
                  <span className="text-xs font-bold mt-1 leading-tight">{describe(v)}</span>
                </div>
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#1A1330]">{v.code}</span>
                    <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${expired ? "bg-[#F2F4F7] text-[#667085]" : v.status === "active" ? "bg-[#ECFDF3] text-[#027A48]" : "bg-[#FFFAEB] text-[#B54708]"}`}>
                      {expired ? "Expired" : v.status}
                    </span>
                    {!v.is_public && <span className="text-[10px] text-[#667085]">hidden</span>}
                  </div>
                  <p className="text-xs text-[#667085] mt-0.5 truncate">{v.title}</p>
                  <p className="text-xs text-[#667085] mt-1">
                    Min {tk(v.min_spend)} · used {v.used_count}{v.usage_limit ? `/${v.usage_limit}` : ""}
                    {v.ends_at && ` · ends ${new Date(v.ends_at).toLocaleDateString()}`}
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => toggle(v)} className="text-xs font-semibold text-[#FF5A1F]">
                      {v.status === "active" ? "Pause" : "Resume"}
                    </button>
                    <button onClick={() => remove(v)} className="text-xs text-[#98A2B3] hover:text-[#B42318] inline-flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> {v.used_count ? "End" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1330]/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#1A1330]">New {seller ? "shop" : "platform"} voucher</h2>
              <button onClick={() => setOpen(false)} className="text-[#98A2B3]"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-[#667085] col-span-1">Code
                <input className={inputCls} placeholder="SAVE100" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
              </label>
              <label className="text-xs text-[#667085]">Type
                <select className={inputCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
                  <option value="fixed">Amount off (৳)</option>
                  <option value="percent">Percent off</option>
                  {!seller && <option value="free_shipping">Free delivery</option>}
                </select>
              </label>
              <label className="text-xs text-[#667085] col-span-2">Title (shown to shoppers)
                <input className={inputCls} placeholder="৳100 off orders over ৳1,000" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
              </label>
              {f.kind !== "free_shipping" && (
                <label className="text-xs text-[#667085]">{f.kind === "percent" ? "Percent" : "Amount ৳"}
                  <input className={inputCls} inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
                </label>
              )}
              <label className="text-xs text-[#667085]">Max discount ৳ (optional)
                <input className={inputCls} inputMode="decimal" value={f.max_discount} onChange={(e) => setF({ ...f, max_discount: e.target.value })} />
              </label>
              <label className="text-xs text-[#667085]">Min spend ৳
                <input className={inputCls} inputMode="decimal" value={f.min_spend} onChange={(e) => setF({ ...f, min_spend: e.target.value })} />
              </label>
              <label className="text-xs text-[#667085]">Ends (optional)
                <input className={inputCls} type="datetime-local" value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} />
              </label>
              <label className="text-xs text-[#667085]">Total uses (optional)
                <input className={inputCls} inputMode="numeric" value={f.usage_limit} onChange={(e) => setF({ ...f, usage_limit: e.target.value })} />
              </label>
              <label className="text-xs text-[#667085]">Uses per buyer
                <input className={inputCls} inputMode="numeric" value={f.per_user_limit} onChange={(e) => setF({ ...f, per_user_limit: e.target.value })} />
              </label>
              <label className="col-span-2 flex items-center gap-2 text-sm text-[#1A1330]">
                <input type="checkbox" checked={f.is_public} onChange={(e) => setF({ ...f, is_public: e.target.checked })} />
                Show on product pages and checkout (untick for code-only / private)
              </label>
            </div>
            {error && <p className="text-sm text-[#B42318]">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-[#475467]">Cancel</button>
              <button onClick={create} disabled={saving} className="px-4 py-2 rounded-lg bg-[#FF5A1F] text-white text-sm font-semibold disabled:opacity-50">
                {saving ? "Saving…" : "Create voucher"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

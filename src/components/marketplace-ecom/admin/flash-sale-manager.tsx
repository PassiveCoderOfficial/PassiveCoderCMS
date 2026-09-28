"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Zap } from "lucide-react";

interface Item {
  id: string;
  product_id: string;
  sale_price: number;
  quantity_limit: number | null;
  sold: number;
  products: { name: string; price: number; images: string[] | null } | null;
}
interface Sale {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: "draft" | "active" | "ended";
  flash_sale_items: Item[];
}
interface Prod { id: string; name: string; price: number; vendors: { name: string } | null }

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;
const inputCls =
  "w-full bg-white border border-[#EAECF0] rounded-lg px-3 py-2 text-sm text-[#1A1330] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25";

function phase(s: Sale) {
  const now = Date.now();
  if (s.status !== "active") return s.status === "draft" ? "Draft" : "Ended";
  if (new Date(s.starts_at).getTime() > now) return "Scheduled";
  if (new Date(s.ends_at).getTime() <= now) return "Ended";
  return "Live";
}

/** Store admin: schedule flash-sale campaigns and pick products + prices.
 *  Live campaigns drive the homepage Flash Deals rail, product-page banner
 *  and checkout price. */
export function FlashSaleManager() {
  const [data, setData] = useState<{ sales: Sale[]; products: Prod[] } | null>(null);
  const [nf, setNf] = useState({ title: "", starts_at: "", ends_at: "" });
  const [add, setAdd] = useState<Record<string, { product_id: string; sale_price: string; quantity_limit: string }>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/marketplace-ecom/flash-sales");
    setData(await r.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  async function post(body: Record<string, unknown>) {
    setError(null);
    const r = await fetch("/api/marketplace-ecom/flash-sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) { setError(d.error ?? "Failed"); return false; }
    await load();
    return true;
  }

  if (!data) return <Loader2 className="w-5 h-5 animate-spin text-[#D0D5DD]" />;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#EAECF0] rounded-xl p-4 space-y-3">
        <p className="font-semibold text-[#1A1330] flex items-center gap-2"><Zap className="w-4 h-4 text-[#FF5A1F]" /> New campaign</p>
        <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
          <label className="text-xs text-[#667085]">Title
            <input className={inputCls} placeholder="10.10 Mega Flash" value={nf.title} onChange={(e) => setNf({ ...nf, title: e.target.value })} />
          </label>
          <label className="text-xs text-[#667085]">Starts
            <input className={inputCls} type="datetime-local" value={nf.starts_at} onChange={(e) => setNf({ ...nf, starts_at: e.target.value })} />
          </label>
          <label className="text-xs text-[#667085]">Ends
            <input className={inputCls} type="datetime-local" value={nf.ends_at} onChange={(e) => setNf({ ...nf, ends_at: e.target.value })} />
          </label>
          <button
            onClick={async () => { if (await post({ action: "create", ...nf })) setNf({ title: "", starts_at: "", ends_at: "" }); }}
            className="h-10 px-4 rounded-lg bg-[#FF5A1F] text-white text-sm font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-[#B42318]">{error}</p>}

      {data.sales.map((s) => {
        const ph = phase(s);
        const a = add[s.id] ?? { product_id: "", sale_price: "", quantity_limit: "" };
        const chosen = data.products.find((p) => p.id === a.product_id);
        return (
          <div key={s.id} className="bg-white border border-[#EAECF0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-[#EAECF0] bg-[#FFF6F2]">
              <span className="font-semibold text-[#1A1330]">{s.title}</span>
              <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${ph === "Live" ? "bg-[#FF5A1F] text-white" : ph === "Scheduled" ? "bg-[#EFF8FF] text-[#175CD3]" : "bg-[#F2F4F7] text-[#667085]"}`}>{ph}</span>
              <span className="text-xs text-[#667085]">
                {new Date(s.starts_at).toLocaleString()} → {new Date(s.ends_at).toLocaleString()}
              </span>
              <button
                onClick={() => post({ action: "status", id: s.id, status: s.status === "active" ? "ended" : "active" })}
                className="ml-auto text-xs font-semibold text-[#FF5A1F]"
              >
                {s.status === "active" ? "End now" : "Reactivate"}
              </button>
            </div>
            <div className="p-4 space-y-2">
              {s.flash_sale_items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 text-sm">
                  {it.products?.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.products.images[0]} alt="" className="w-10 h-10 rounded object-cover" />
                  )}
                  <span className="flex-1 truncate text-[#1A1330]">{it.products?.name}</span>
                  <span className="text-[#98A2B3] line-through text-xs">{tk(it.products?.price ?? 0)}</span>
                  <span className="font-bold text-[#FF5A1F]">{tk(it.sale_price)}</span>
                  <span className="text-xs text-[#667085] w-24 text-right">{it.sold}{it.quantity_limit ? `/${it.quantity_limit}` : ""} sold</span>
                  <button onClick={() => post({ action: "remove_item", item_id: it.id })} className="text-[#D0D5DD] hover:text-[#B42318]" aria-label="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="grid sm:grid-cols-[1fr_120px_120px_auto] gap-2 items-end pt-2 border-t border-[#F2F4F7]">
                <label className="text-xs text-[#667085]">Product
                  <select className={inputCls} value={a.product_id} onChange={(e) => setAdd({ ...add, [s.id]: { ...a, product_id: e.target.value } })}>
                    <option value="">Choose a product…</option>
                    {data.products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {p.vendors?.name} ({tk(p.price)})</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-[#667085]">Flash price ৳
                  <input className={inputCls} inputMode="decimal" placeholder={chosen ? String(Math.round(chosen.price * 0.8)) : ""} value={a.sale_price} onChange={(e) => setAdd({ ...add, [s.id]: { ...a, sale_price: e.target.value } })} />
                </label>
                <label className="text-xs text-[#667085]">Qty limit
                  <input className={inputCls} inputMode="numeric" placeholder="no limit" value={a.quantity_limit} onChange={(e) => setAdd({ ...add, [s.id]: { ...a, quantity_limit: e.target.value } })} />
                </label>
                <button
                  onClick={async () => { if (await post({ action: "add_item", flash_sale_id: s.id, ...a })) setAdd({ ...add, [s.id]: { product_id: "", sale_price: "", quantity_limit: "" } }); }}
                  disabled={!a.product_id || !a.sale_price}
                  className="h-10 px-4 rounded-lg bg-[#1A1330] text-white text-sm font-semibold disabled:opacity-40"
                >
                  Add
                </button>
              </div>
              <p className="text-[11px] text-[#98A2B3]">
                Flash prices apply to products without options. The price difference comes off the seller&apos;s sale — agree it with the seller first.
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

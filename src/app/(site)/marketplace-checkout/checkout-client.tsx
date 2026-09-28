"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Store, Truck, Banknote, Smartphone, ShoppingCart, ArrowLeft, Ticket, X, Zap } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";

interface Group {
  vendor_id: string;
  vendor_name: string;
  items: { product_id: string; name: string; price: number; quantity: number; original_price?: number; flash_item_id?: string }[];
  subtotal: number;
  shipping_cost: number;
  discount: number;
  platform_discount: number;
  total: number;
}

interface PublicVoucher {
  id: string;
  vendor_id: string | null;
  code: string;
  title: string;
  kind: string;
  value: number;
  min_spend: number;
  vendors: { name: string } | null;
}

interface Quote {
  groups: Group[];
  subtotal: number;
  shipping_total: number;
  discount_total: number;
  platform_discount_total: number;
  grand_total: number;
  vouchers: { code: string; title: string; amount: number; vendor_id: string | null }[];
  voucher_errors: string[];
  shipping_rate: { name: string; rate: number; free_above: number | null } | null;
}

const AREAS = [
  "Dhaka", "Savar", "Keraniganj", "Narayanganj", "Gazipur",
  "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh",
];

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;
const inputCls =
  "w-full border border-[#EAECF0] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#1A1330] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F] transition-all";

export default function MarketplaceCheckoutClient() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<"cod" | "bkash">("cod");
  const [codes, setCodes] = useState<string[]>([]);
  const [codeInput, setCodeInput] = useState("");
  const [available, setAvailable] = useState<PublicVoucher[]>([]);
  const [f, setF] = useState({
    name: "", phone: "", email: "", address: "", area: "Dhaka", note: "",
  });

  const priceCart = useCallback(async () => {
    if (!items.length) { setQuote(null); return; }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/storefront/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        area: f.area,
        phone: f.phone.trim() || undefined,
        vouchers: codes,
        items: items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })),
      }),
    });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) { setError(d.error ?? "Could not price your cart"); setQuote(null); return; }
    setQuote(d);
  }, [items, f.area, f.phone, codes]);

  useEffect(() => { priceCart(); }, [priceCart]);

  const vendorKey = quote?.groups.map((g) => g.vendor_id).join(",") ?? "";
  useEffect(() => {
    fetch(`/api/storefront/vouchers${vendorKey ? `?vendors=${vendorKey}` : ""}`)
      .then((r) => r.json())
      .then((d) => setAvailable(d.vouchers ?? []))
      .catch(() => {});
  }, [vendorKey]);

  const rejected = quote?.voucher_errors ?? [];

  function addCode(c: string) {
    const code = c.trim().toUpperCase();
    if (code && !codes.includes(code)) setCodes([...codes, code]);
    setCodeInput("");
  }

  async function placeOrder() {
    setError(null);
    if (!f.name.trim()) return setError("Please enter your name");
    if (!/^01[3-9]\d{8}$/.test(f.phone.trim())) return setError("Enter a valid 11-digit mobile number");
    if (!f.address.trim()) return setError("Please enter your delivery address");

    setPlacing(true);
    const res = await fetch("/api/storefront/checkout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_method: method,
        // Only codes the latest quote accepted — a rejected code never blocks the order.
        vouchers: quote?.vouchers.map((v) => v.code) ?? [],
        items: items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })),
        address: {
          name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() || undefined,
          address: f.address.trim(), area: f.area, city: f.area, note: f.note.trim() || undefined,
        },
      }),
    });
    const d = await res.json();
    setPlacing(false);
    if (!res.ok) { setError(d.error ?? "Could not place your order"); return; }
    clearCart();
    router.push(`/order-confirmation/${d.order_id}`);
  }

  if (!items.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground opacity-30 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <Link href="/shop"
          className="inline-flex items-center gap-2 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-6 py-3 rounded-full font-semibold mt-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#1A1330] mb-6">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-5">
          <section className="bg-white border border-[#EAECF0] rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-[#1A1330]">Delivery details</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              <input className={inputCls} placeholder="Full name *"
                value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <input className={inputCls} placeholder="Mobile number * (01XXXXXXXXX)"
                value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            </div>
            <input className={inputCls} placeholder="Email (optional — for order updates)"
              value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <textarea className={inputCls} rows={2} placeholder="Full address — house, road, area *"
              value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
            <select className={inputCls} value={f.area}
              onChange={(e) => setF({ ...f, area: e.target.value })}>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <input className={inputCls} placeholder="Delivery note (optional)"
              value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          </section>

          <section className="bg-white border border-[#EAECF0] rounded-2xl p-5 space-y-2">
            <h2 className="font-semibold text-[#1A1330]">Payment</h2>
            <label className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer ${
              method === "cod" ? "border-[#FF5A1F] bg-[#FFF6F2]" : "border-[#EAECF0] hover:border-[#D0D5DD]"
            }`}>
              <input type="radio" checked={method === "cod"} onChange={() => setMethod("cod")} />
              <Banknote className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Cash on delivery</p>
                <p className="text-xs text-muted-foreground">Pay the courier when your parcel arrives</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer ${
              method === "bkash" ? "border-[#FF5A1F] bg-[#FFF6F2]" : "border-[#EAECF0] hover:border-[#D0D5DD]"
            }`}>
              <input type="radio" checked={method === "bkash"} onChange={() => setMethod("bkash")} />
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">bKash</p>
                <p className="text-xs text-muted-foreground">Pay now from your bKash account</p>
              </div>
            </label>
          </section>

          <section className="bg-white border border-[#EAECF0] rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-[#1A1330] flex items-center gap-2"><Ticket className="w-4 h-4 text-[#FF5A1F]" /> Vouchers</h2>
            <form onSubmit={(e) => { e.preventDefault(); addCode(codeInput); }} className="flex gap-2">
              <input className={inputCls} placeholder="Enter voucher code" value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())} />
              <button className="px-5 rounded-xl bg-[#1A1330] text-white text-sm font-semibold">Apply</button>
            </form>
            {codes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {codes.map((c) => {
                  const ok = quote?.vouchers.find((v) => v.code.toUpperCase() === c);
                  const bad = rejected.find((e) => e.startsWith(`${c}:`));
                  return (
                    <span key={c} className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full pl-3 pr-1.5 py-1 ${ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                      {c}{ok ? ` −${tk(ok.amount)}` : bad ? ` · ${bad.split(": ")[1]}` : ""}
                      <button type="button" onClick={() => setCodes(codes.filter((x) => x !== c))} aria-label="Remove"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  );
                })}
              </div>
            )}
            {available.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                {available.map((v) => (
                  <div key={v.id} className="shrink-0 w-56 flex rounded-xl border border-[#FFD2BF] overflow-hidden">
                    <div className="w-2 bg-[#FF5A1F]" />
                    <div className="flex-1 p-2.5">
                      <p className="text-sm font-bold text-[#FF5A1F]">
                        {v.kind === "percent" ? `${Number(v.value)}% off` : v.kind === "fixed" ? `${tk(v.value)} off` : "Free delivery"}
                      </p>
                      <p className="text-[11px] text-[#667085] line-clamp-1">{v.vendors?.name ?? "All shops"} · min {tk(v.min_spend)}</p>
                      <button
                        type="button"
                        onClick={() => addCode(v.code)}
                        disabled={codes.includes(v.code.toUpperCase())}
                        className="mt-1.5 text-xs font-bold text-white bg-[#FF5A1F] rounded-full px-3 py-1 disabled:opacity-40"
                      >
                        {codes.includes(v.code.toUpperCase()) ? "Applied" : "Use"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-[#EAECF0] rounded-2xl p-5 space-y-4 lg:sticky lg:top-28">
            <h2 className="font-semibold text-[#1A1330]">Your order</h2>

            {loading && !quote ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : quote ? (
              <>
                {quote.groups.length > 1 && (
                  <p className="text-xs text-[#1A1330] bg-[#FFF6F2] border border-[#FFE4D6] rounded-xl px-3 py-2.5">
                    Your order is split across {quote.groups.length} sellers. Each parcel is
                    shipped and charged separately.
                  </p>
                )}

                <div className="space-y-3">
                  {quote.groups.map((g) => (
                    <div key={g.vendor_id} className="border border-[#EAECF0] rounded-xl p-3.5 space-y-2 bg-[#FCFCFD]">
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-muted-foreground" /> {g.vendor_name}
                      </p>
                      <ul className="space-y-1">
                        {g.items.map((it, i) => (
                          <li key={i} className="flex justify-between text-sm text-muted-foreground">
                            <span className="truncate pr-2">
                              {it.flash_item_id && <Zap className="inline w-3 h-3 text-[#FF5A1F] fill-[#FF5A1F] mr-0.5" />}
                              {it.name} × {it.quantity}
                            </span>
                            <span className="shrink-0">
                              {it.original_price && <span className="line-through text-[11px] mr-1 text-[#98A2B3]">{tk(it.original_price * it.quantity)}</span>}
                              {tk(it.price * it.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Delivery
                        </span>
                        <span>{g.shipping_cost === 0 ? "Free" : tk(g.shipping_cost)}</span>
                      </div>
                      {g.discount > 0 && (
                        <div className="flex justify-between text-xs text-green-700">
                          <span>Shop voucher</span><span>−{tk(g.discount)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 border-t pt-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span>{tk(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery{quote.shipping_rate ? ` (${quote.shipping_rate.name})` : ""}</span>
                    <span>{quote.shipping_total === 0 ? "Free" : tk(quote.shipping_total)}</span>
                  </div>
                  {quote.discount_total > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Shop vouchers</span><span>−{tk(quote.discount_total)}</span>
                    </div>
                  )}
                  {quote.platform_discount_total > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Platform voucher</span><span>−{tk(quote.platform_discount_total)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t pt-2">
                    <span>Total</span><span>{tk(quote.grand_total)}</span>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  onClick={placeOrder}
                  disabled={placing || loading}
                  className="w-full bg-[#FF5A1F] hover:bg-[#E64A0F] text-white rounded-xl py-3.5 font-semibold disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
                >
                  {placing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {method === "cod" ? `Place order · ${tk(quote.grand_total)}` : `Pay ${tk(quote.grand_total)}`}
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  By placing this order you agree to the marketplace terms.
                </p>
              </>
            ) : (
              error && <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

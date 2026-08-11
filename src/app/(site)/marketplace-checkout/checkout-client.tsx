"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Store, Truck, Banknote, Smartphone, ShoppingCart, ArrowLeft } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";

interface Group {
  vendor_id: string;
  vendor_name: string;
  items: { product_id: string; name: string; price: number; quantity: number }[];
  subtotal: number;
  shipping_cost: number;
  total: number;
}

interface Quote {
  groups: Group[];
  subtotal: number;
  shipping_total: number;
  grand_total: number;
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
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      }),
    });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) { setError(d.error ?? "Could not price your cart"); setQuote(null); return; }
    setQuote(d);
  }, [items, f.area]);

  useEffect(() => { priceCart(); }, [priceCart]);

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
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
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
          <section className="border border-[#EAECF0] rounded-2xl p-5 space-y-3">
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

          <section className="border border-[#EAECF0] rounded-2xl p-5 space-y-2">
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
        </div>

        <div className="lg:col-span-2">
          <div className="border border-[#EAECF0] rounded-2xl p-5 space-y-4 lg:sticky lg:top-24">
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
                            <span className="truncate pr-2">{it.name} × {it.quantity}</span>
                            <span className="shrink-0">{tk(it.price * it.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Delivery
                        </span>
                        <span>{g.shipping_cost === 0 ? "Free" : tk(g.shipping_cost)}</span>
                      </div>
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart/cart-context";
import { ChatNowButton } from "../chat/chat-now-button";

interface P {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  stock: number | null; // null = not tracked
  vendorId: string;
}

export interface VariantOpt {
  id: string;
  name: string;
  price: number | null;
  stock_quantity: number;
  image: string | null;
}

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;

/**
 * Quantity + Add to cart + Buy now, plus the Shopee-style sticky bottom bar
 * (Chat | Add to cart | Buy now) on phones.
 */
export function BuyBox({ product, variants = [] }: { product: P; variants?: VariantOpt[] }) {
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const [qty, setQty] = useState(1);
  const [vid, setVid] = useState<string | null>(null);
  const [needPick, setNeedPick] = useState(false);
  const v = variants.find((x) => x.id === vid) ?? null;
  const stock = v ? v.stock_quantity : product.stock;
  const price = v?.price ?? product.price;
  const out = variants.length ? variants.every((x) => x.stock_quantity <= 0) || (v !== null && v.stock_quantity <= 0) : product.stock !== null && product.stock <= 0;
  const max = stock ?? 99;

  function add(buyNow = false) {
    if (variants.length && !v) {
      setNeedPick(true);
      document.getElementById("options")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addItem({
      id: v ? `${product.id}:${v.id}` : product.id,
      product_id: product.id,
      variant_id: v?.id,
      name: v ? `${product.name} (${v.name})` : product.name,
      slug: product.slug,
      price,
      image: (v?.image || product.image) ?? undefined,
      quantity: qty,
    });
    if (buyNow) router.push("/checkout");
    else toast.success("Added to cart", { action: { label: "View cart", onClick: openCart } });
  }

  return (
    <>
      {variants.length > 0 && (
        <div id="options" className={`flex gap-4 rounded-xl ${needPick && !v ? "ring-2 ring-[#FF5A1F]/40 p-2 -m-2" : ""}`}>
          <span className="text-sm text-[#667085] w-20 shrink-0 pt-2">Options</span>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2">
              {variants.map((x) => {
                const soldOut = x.stock_quantity <= 0;
                const on = x.id === vid;
                return (
                  <button
                    key={x.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() => { setVid(on ? null : x.id); setQty(1); setNeedPick(false); }}
                    className={`relative flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${on ? "border-[#FF5A1F] text-[#FF5A1F] bg-[#FFF6F2]" : "border-[#D0D5DD] text-[#1A1330] hover:border-[#FF5A1F]"} disabled:opacity-40 disabled:line-through`}
                  >
                    {x.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={x.image} alt="" className="w-6 h-6 rounded object-cover" />
                    )}
                    {x.name}
                  </button>
                );
              })}
            </div>
            {v && <p className="mt-2 text-sm text-[#1A1330]">Selected: <b>{v.name}</b> · <span className="text-[#FF5A1F] font-bold">{tk(price)}</span></p>}
            {needPick && !v && <p className="mt-2 text-sm text-[#FF5A1F] font-medium">Please choose an option first</p>}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className="text-sm text-[#667085] w-20">Quantity</span>
        <div className="flex items-center border border-[#D0D5DD] rounded-lg overflow-hidden">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1 || out} className="px-3 py-2 hover:bg-[#F2F4F7] disabled:opacity-40" aria-label="Less">
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center text-sm font-semibold">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max || out} className="px-3 py-2 hover:bg-[#F2F4F7] disabled:opacity-40" aria-label="More">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {stock !== null && (!variants.length || v) && (
          <span className={`text-sm ${out ? "text-red-600 font-semibold" : stock <= 5 ? "text-[#FF5A1F] font-semibold" : "text-[#667085]"}`}>
            {out ? "Out of stock" : `${stock} available`}
          </span>
        )}
      </div>

      <div className="hidden md:flex gap-3 pt-2">
        <button
          onClick={() => add(false)}
          disabled={out}
          className="flex-1 h-12 rounded-xl border-2 border-[#FF5A1F] bg-[#FFF1EB] text-[#FF5A1F] font-bold flex items-center justify-center gap-2 hover:bg-[#FFE4D6] disabled:opacity-40"
        >
          <ShoppingCart className="w-5 h-5" /> Add to cart
        </button>
        <button
          onClick={() => add(true)}
          disabled={out}
          className="flex-1 h-12 rounded-xl bg-[#FF5A1F] text-white font-bold hover:bg-[#E64A0F] disabled:opacity-40"
        >
          Buy now
        </button>
      </div>

      {/* Mobile sticky bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#EAECF0] flex h-16 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(16,24,40,0.06)]">
        <ChatNowButton
          vendorId={product.vendorId}
          productId={product.id}
          compact
          label="Chat"
          className="w-16 flex flex-col items-center justify-center gap-0.5 text-[#FF5A1F]"
        />
        <button onClick={() => add(false)} disabled={out} className="w-20 flex flex-col items-center justify-center gap-0.5 text-[#FF5A1F] border-l border-[#EAECF0] disabled:opacity-40">
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[11px]">Add to cart</span>
        </button>
        <button onClick={() => add(true)} disabled={out} className="flex-1 m-2 rounded-xl bg-[#FF5A1F] text-white font-bold text-base disabled:opacity-40">
          {out ? "Out of stock" : "Buy now"}
        </button>
      </div>
    </>
  );
}

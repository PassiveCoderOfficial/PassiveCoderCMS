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

/**
 * Quantity + Add to cart + Buy now, plus the Shopee-style sticky bottom bar
 * (Chat | Add to cart | Buy now) on phones.
 */
export function BuyBox({ product }: { product: P }) {
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const [qty, setQty] = useState(1);
  const out = product.stock !== null && product.stock <= 0;
  const max = product.stock ?? 99;

  function add(buyNow = false) {
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image ?? undefined,
      quantity: qty,
    });
    if (buyNow) router.push("/checkout");
    else toast.success("Added to cart", { action: { label: "View cart", onClick: openCart } });
  }

  return (
    <>
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
        {product.stock !== null && (
          <span className={`text-sm ${out ? "text-red-600 font-semibold" : product.stock <= 5 ? "text-[#FF5A1F] font-semibold" : "text-[#667085]"}`}>
            {out ? "Out of stock" : `${product.stock} available`}
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

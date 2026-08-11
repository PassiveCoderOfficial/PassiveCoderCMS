"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import type { CartItem } from "@/types/cms";

export default function AddToCartButton({
  product,
  disabled,
}: {
  product: Omit<CartItem, "quantity">;
  disabled?: boolean;
}) {
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);

  if (disabled) {
    return (
      <button
        disabled
        className="w-full mt-2.5 border border-[#EAECF0] rounded-xl py-2.5 text-sm font-medium text-[#98A2B3] cursor-not-allowed"
      >
        Out of stock
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        addItem({ ...product, quantity: 1 });
        setAdded(true);
        openCart();
        // Brief confirmation, then back to the normal label — the cart drawer
        // opening is the real feedback.
        setTimeout(() => setAdded(false), 1500);
      }}
      className="w-full mt-2.5 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white rounded-xl py-2.5 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
    >
      {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
      {added ? "Added" : "Add to cart"}
    </button>
  );
}

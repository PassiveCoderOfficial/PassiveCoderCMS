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
        className="w-full mt-2 border rounded-lg py-2 text-sm text-muted-foreground cursor-not-allowed"
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
      className="w-full mt-2 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5"
    >
      {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
      {added ? "Added" : "Add to cart"}
    </button>
  );
}

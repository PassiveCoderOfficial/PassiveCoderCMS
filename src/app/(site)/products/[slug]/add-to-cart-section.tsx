"use client";

import React, { useState } from "react";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { toast } from "sonner";

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
    inStock: boolean;
  };
}

export function AddToCartSection({ product }: Props) {
  const [qty, setQty] = useState(1);
  const { addItem, openCart } = useCart();

  function handleAdd() {
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image ?? undefined,
      quantity: qty,
    });
    toast.success(`${product.name} added to cart`, {
      action: {
        label: "View Cart",
        onClick: openCart,
      },
    });
  }

  if (!product.inStock) {
    return (
      <div className="pt-2">
        <button disabled className="w-full py-3 rounded-xl bg-muted text-muted-foreground font-semibold cursor-not-allowed text-sm">
          Out of Stock
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Qty</span>
        <div className="flex items-center border rounded-lg overflow-hidden">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-2 hover:bg-muted transition-colors"
            disabled={qty <= 1}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="px-4 py-2 text-sm font-semibold min-w-[40px] text-center">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="px-3 py-2 hover:bg-muted transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Add to Cart button */}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <ShoppingCart className="h-4 w-4" />
        Add to Cart
      </button>
    </div>
  );
}

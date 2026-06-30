"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useEcommerceCurrency } from "@/lib/hooks/use-ecommerce-currency";
import { useCart } from "@/lib/cart/cart-context";
import { toast } from "sonner";
import type { ProductCardData } from "./product-card";

interface Props {
  product: ProductCardData;
  showAddToCart?: boolean;
}

export function ProductCardMinimal({ product, showAddToCart = true }: Props) {
  const { addItem, openCart } = useCart();
  const { format } = useEcommerceCurrency();
  const firstImage = product.images[0] as string | undefined;
  const inStock = product.inStock !== false;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!inStock) return;
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: firstImage,
      quantity: 1,
    });
    toast.success(`${product.name} added to cart`, {
      action: { label: "View Cart", onClick: openCart },
    });
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all group">
      <Link href={`/products/${product.slug}`} className="shrink-0">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted border relative">
          {firstImage ? (
            <Image src={firstImage} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.slug}`}>
          <p className="text-sm font-medium leading-snug hover:text-primary transition-colors truncate">{product.name}</p>
        </Link>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-sm font-bold">{format(product.price)}</span>
          {product.compare_price && (
            <span className="text-xs text-muted-foreground line-through">{format(product.compare_price)}</span>
          )}
        </div>
      </div>

      {showAddToCart && (
        <button
          onClick={handleAdd}
          disabled={!inStock}
          className="shrink-0 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          title={inStock ? "Add to cart" : "Out of stock"}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

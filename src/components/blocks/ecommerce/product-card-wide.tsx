"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useEcommerceCurrency } from "@/lib/hooks/use-ecommerce-currency";
import { useCart } from "@/lib/cart/cart-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "./product-card";

type CardStyle = "default" | "flat" | "minimal" | "shadow" | "bordered";

interface Props {
  product: ProductCardData;
  showAddToCart?: boolean;
  showDescription?: boolean;
  cardStyle?: CardStyle;
  listMode?: boolean;
}

export function ProductCardWide({ product, showAddToCart = true, showDescription = true, cardStyle = "default", listMode = false }: Props) {
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

  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

  return (
    <div className={cn(
      "flex gap-4 group",
      listMode
        ? "p-4 hover:bg-muted/30 transition-colors"
        : cardStyle === "shadow"
          ? "rounded-xl shadow-md hover:shadow-xl transition-shadow bg-white dark:bg-gray-900 p-3"
          : cardStyle === "bordered"
            ? "rounded-xl border-2 border-border hover:border-primary transition-colors bg-background p-3"
            : "rounded-xl border hover:shadow-md transition-shadow bg-white dark:bg-gray-900 p-3"
    )}>
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="shrink-0">
        <div className={cn(
          "relative overflow-hidden rounded-lg bg-muted",
          listMode ? "w-20 h-20" : "w-28 h-28 sm:w-32 sm:h-32"
        )}>
          {firstImage ? (
            <Image src={firstImage} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          {discount && discount > 0 && (
            <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">-{discount}%</span>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold text-sm leading-snug hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
          </Link>
          {showDescription && product.short_description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.short_description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold">{format(product.price)}</span>
            {product.compare_price && (
              <span className="text-xs text-muted-foreground line-through">{format(product.compare_price)}</span>
            )}
          </div>

          {showAddToCart && (
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className={cn(
                "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors shrink-0",
                inStock
                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:opacity-80"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <ShoppingCart className="h-3 w-3" />
              {inStock ? "Add" : "Sold out"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

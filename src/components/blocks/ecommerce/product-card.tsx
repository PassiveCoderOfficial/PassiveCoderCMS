"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useEcommerceCurrency } from "@/lib/hooks/use-ecommerce-currency";
import { useCart } from "@/lib/cart/cart-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CardStyle = "default" | "flat" | "minimal" | "shadow" | "bordered";
type ImageRatio = "square" | "portrait" | "landscape" | "auto";

const RATIO_CLASS: Record<ImageRatio, string> = {
  square:    "aspect-square",
  portrait:  "aspect-[3/4]",
  landscape: "aspect-video",
  auto:      "aspect-square",
};

const CARD_STYLE: Record<CardStyle, string> = {
  default:  "border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-gray-900",
  flat:     "rounded-xl overflow-hidden bg-muted/30 hover:bg-muted/60 transition-colors",
  minimal:  "rounded-xl overflow-hidden",
  shadow:   "rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-white dark:bg-gray-900",
  bordered: "border-2 border-border rounded-xl overflow-hidden hover:border-primary transition-colors bg-background",
};

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  images: string[];
  short_description?: string | null;
  inStock?: boolean;
}

interface ProductCardProps {
  product: ProductCardData;
  showAddToCart?: boolean;
  showDescription?: boolean;
  showBadges?: boolean;
  cardStyle?: CardStyle;
  imageRatio?: ImageRatio;
  featured?: boolean;
}

export function ProductCard({
  product,
  showAddToCart = true,
  showDescription = true,
  showBadges = true,
  cardStyle = "default",
  imageRatio = "square",
  featured = false,
}: ProductCardProps) {
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
    <div className={cn(CARD_STYLE[cardStyle], featured && "h-full")}>
      <Link href={`/products/${product.slug}`}>
        <div className={cn("relative overflow-hidden bg-gray-50 dark:bg-gray-800", RATIO_CLASS[imageRatio])}>
          {firstImage ? (
            <Image
              src={firstImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingCart className="h-12 w-12" />
            </div>
          )}
          {showBadges && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {discount && discount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">-{discount}%</span>
              )}
              {!inStock && (
                <span className="bg-gray-800/80 text-white text-xs px-2 py-0.5 rounded-full font-medium">Out of Stock</span>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className={cn("p-4", featured && "p-5")}>
        <Link href={`/products/${product.slug}`}>
          <h3 className={cn("font-semibold leading-snug hover:text-primary transition-colors", featured ? "text-lg" : "text-sm")}>
            {product.name}
          </h3>
        </Link>

        {showDescription && product.short_description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.short_description}</p>
        )}

        <div className={cn("mt-3 flex items-center", showAddToCart ? "justify-between" : "justify-start", "gap-2")}>
          <div className="flex items-baseline gap-2">
            <span className={cn("font-bold", featured ? "text-xl" : "text-sm")}>{format(product.price)}</span>
            {product.compare_price && (
              <span className="text-xs text-muted-foreground line-through">{format(product.compare_price)}</span>
            )}
          </div>

          {showAddToCart && (
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className={cn(
                "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0",
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

"use client";

import React from "react";
import Link from "next/link";
import Image from "@/components/ui/smart-image";
import { ShoppingCart } from "lucide-react";
import { useEcommerceCurrency } from "@/lib/hooks/use-ecommerce-currency";
import { useCart } from "@/lib/cart/cart-context";
import { toast } from "sonner";
import { AskPriceButton, useProductPrice } from "@/components/site/no-price";
import { cn } from "@/lib/utils";
import { useStoreText } from "@/components/site/use-store-text";
import type { CardLabels, ProductCardData } from "./product-card";

type CardStyle = "default" | "flat" | "minimal" | "shadow" | "bordered" | "boutique" | "retail";

interface Props {
  product: ProductCardData;
  showAddToCart?: boolean;
  showDescription?: boolean;
  cardStyle?: CardStyle;
  listMode?: boolean;
  labels?: CardLabels;
}

export function ProductCardWide({ product, showAddToCart = true, showDescription = true, cardStyle = "default", listMode = false, labels }: Props) {
  const { addItem, openCart } = useCart();
  const { format } = useEcommerceCurrency();
  const firstImage = product.images[0] as string | undefined;
  const href = product.href ?? `/products/${product.slug}`;
  const storeT = useStoreText();
  const t = labels ? { ...storeT, ...labels } : storeT;
  const inStock = product.inStock !== false;
  const pp = useProductPrice(product);
  const ask = !pp.sellable;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!inStock) return;
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: pp.price,
      image: firstImage,
      quantity: 1,
    });
    toast.success(t.addedToCart(product.name), {
      action: { label: t.viewCart, onClick: openCart },
    });
  }

  const discount = pp.priced && product.compare_price && product.compare_price > pp.price
    ? Math.round((1 - pp.price / product.compare_price) * 100)
    : null;

  return (
    <div className={cn(
      "flex gap-4 group",
      listMode
        ? "p-4 hover:bg-muted/30 transition-colors"
        : cardStyle === "shadow"
          ? "rounded-xl shadow-md hover:shadow-xl transition-shadow bg-card text-card-foreground p-3"
          : cardStyle === "bordered"
            ? "rounded-xl border-2 border-border hover:border-primary transition-colors bg-background p-3"
            : "rounded-xl border hover:shadow-md transition-shadow bg-card text-card-foreground p-3"
    )}>
      {/* Image */}
      <Link href={href} className="shrink-0">
        <div className={cn(
          "relative overflow-hidden rounded-lg bg-muted",
          listMode ? "w-20 h-20" : "w-28 h-28 sm:w-32 sm:h-32"
        )}>
          {firstImage ? (
            <Image src={firstImage} alt={product.name} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
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
          <Link href={href}>
            <h3 className="font-semibold text-sm leading-snug hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
          </Link>
          {showDescription && product.short_description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.short_description}</p>
          )}
          {!!product.dietary_info?.spice_level && (
            <span className="text-xs mt-1 inline-block">{"🌶".repeat(product.dietary_info.spice_level)}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between mt-2 gap-2">
          <div className="flex items-baseline gap-2">
            {!ask && <span className="text-sm font-bold">{format(pp.price)}</span>}
            {!ask && pp.priced && product.compare_price && (
              <span className="text-xs text-muted-foreground line-through">{format(product.compare_price)}</span>
            )}
          </div>

          {ask ? (
<AskPriceButton product={product} compact className="flex items-center text-xs px-2.5 py-1.5 rounded-lg bg-foreground text-background hover:opacity-80 max-w-full min-w-0 text-left" />
) : showAddToCart && (
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className={cn(
                "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors shrink-0",
                inStock
                  ? "bg-foreground text-background hover:opacity-80"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <ShoppingCart className="h-3 w-3" />
              {inStock ? t.add : t.soldOut}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

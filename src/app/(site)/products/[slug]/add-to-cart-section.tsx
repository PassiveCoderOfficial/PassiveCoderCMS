"use client";

import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { useEcommerceCurrency } from "@/lib/hooks/use-ecommerce-currency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface VariantOption {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  inStock: boolean;
  image: string | null;
}

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
    inStock: boolean;
  };
  comparePrice?: number | null;
  /** Server-formatted base prices, shown before any option is picked. */
  priceLabel?: string;
  comparePriceLabel?: string | null;
  variants?: VariantOption[];
}

/**
 * Price + options + quantity + add to cart. With variants (sizes etc.) the
 * shopper must pick one; the cart line carries the variant id and its own
 * price, and /api/ecommerce/orders re-prices it from product_variants.
 */
export function AddToCartSection({ product, comparePrice, priceLabel, comparePriceLabel, variants = [] }: Props) {
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);
  const { addItem, openCart } = useCart();
  const { format } = useEcommerceCurrency();

  const hasVariants = variants.length > 0;
  const selected = variants.find((v) => v.id === variantId) ?? null;
  const min = hasVariants ? Math.min(...variants.map((v) => v.price)) : product.price;
  const max = hasVariants ? Math.max(...variants.map((v) => v.price)) : product.price;

  const shownPrice = selected
    ? format(selected.price)
    : hasVariants
      ? (min === max ? format(min) : `${format(min)} – ${format(max)}`)
      : (priceLabel ?? format(product.price));
  const shownCompare = selected
    ? (selected.compare_price && selected.compare_price > selected.price ? format(selected.compare_price) : null)
    : hasVariants ? null : (comparePrice && comparePrice > product.price ? (comparePriceLabel ?? format(comparePrice)) : null);
  const inStock = selected ? selected.inStock : product.inStock;

  function handleAdd() {
    if (hasVariants && !selected) {
      toast.error("Please choose an option first");
      return;
    }
    addItem({
      id: selected ? `${product.id}:${selected.id}` : product.id,
      product_id: product.id,
      ...(selected ? { variant_id: selected.id } : {}),
      name: selected ? `${product.name} - ${selected.name}` : product.name,
      slug: product.slug,
      price: selected ? selected.price : product.price,
      image: (selected?.image || product.image) ?? undefined,
      quantity: qty,
    });
    toast.success(`${product.name} added to cart`, {
      action: { label: "View Cart", onClick: openCart },
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline flex-wrap gap-3">
        {shownCompare && <span className="text-xl text-muted-foreground line-through">{shownCompare}</span>}
        <span className="text-3xl sm:text-4xl font-semibold" style={{ fontFamily: "var(--heading-font, inherit)" }}>{shownPrice}</span>
      </div>

      {hasVariants && (
        <div>
          <p className="text-sm font-semibold mb-2">
            Size{selected ? <span className="font-normal text-muted-foreground">: {selected.name}</span> : null}
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id === variantId ? null : v.id)}
                disabled={!v.inStock}
                className={cn(
                  "min-w-[4rem] px-4 py-2 rounded-full border text-sm uppercase transition-colors",
                  v.id === variantId ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary",
                  !v.inStock && "opacity-40 line-through cursor-not-allowed",
                )}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {!inStock ? (
        <button disabled className="w-full sm:w-auto px-10 py-3.5 rounded-full bg-muted text-muted-foreground font-semibold cursor-not-allowed text-sm uppercase">
          Out of Stock
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-border rounded-full overflow-hidden h-12">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3.5 h-full hover:bg-muted transition-colors" disabled={qty <= 1}>
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="px-3 text-sm font-semibold min-w-[40px] text-center">{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(99, q + 1))} className="px-3.5 h-full hover:bg-muted transition-colors">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="h-12 px-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity"
          >
            Add to cart
          </button>
        </div>
      )}
    </div>
  );
}

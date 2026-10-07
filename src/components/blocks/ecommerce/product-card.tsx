"use client";

import React from "react";
import Link from "next/link";
import Image from "@/components/ui/smart-image";
import { ShoppingCart } from "lucide-react";
import { useEcommerceCurrency } from "@/lib/hooks/use-ecommerce-currency";
import { useCart } from "@/lib/cart/cart-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CardStyle = "default" | "flat" | "minimal" | "shadow" | "bordered" | "boutique" | "retail";
type ImageRatio = "square" | "portrait" | "landscape" | "auto";

const RATIO_CLASS: Record<ImageRatio, string> = {
  square:    "aspect-square",
  portrait:  "aspect-[3/4]",
  landscape: "aspect-video",
  auto:      "aspect-square",
};

// Theme tokens, not `dark:` utilities: the dark variant follows the visitor's
// OS setting rather than the site's own theme, which made these cards
// unreadable whenever the two disagreed.
const CARD_STYLE: Record<CardStyle, string> = {
  default:  "border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-card text-card-foreground",
  flat:     "rounded-xl overflow-hidden bg-muted/30 hover:bg-muted/60 transition-colors",
  minimal:  "rounded-xl overflow-hidden",
  shadow:   "rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-card text-card-foreground",
  bordered: "border-2 border-border rounded-xl overflow-hidden hover:border-primary transition-colors bg-background",
  // Luxury-retail look: thin frame, centred heading-font title, full-width pill button.
  boutique: "group border border-border rounded-md overflow-hidden bg-card text-card-foreground flex flex-col hover:shadow-md transition-shadow",
  // Department-store look: no frame, small upper-case name, pill button, size chips.
  retail: "group flex flex-col h-full",
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
  /** Restaurant menu metadata (2026-09-12) — empty/absent on ordinary
   *  ecommerce products, so this renders nothing for non-menu catalogs. */
  dietary_info?: { diet?: "veg" | "non_veg" | "vegan"; spice_level?: number; tags?: string[] };
  /** Variable products (sizes, colours): the card shows the price range and
   *  links to the product page to choose, rather than adding the base price. */
  variants?: { count: number; min: number; max: number; labels: string[] } | null;
  /** Featured products get a "Best Seller" badge on the retail card. */
  featured?: boolean | null;
}

const DIET_DOT: Record<string, string> = {
  veg: "border-green-600 text-green-600",
  vegan: "border-green-700 text-green-700",
  non_veg: "border-red-600 text-red-600",
};

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
  const variable = !!product.variants && product.variants.count > 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!inStock) return;
    if (variable) { window.location.href = `/products/${product.slug}`; return; }
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

  if (cardStyle === "retail") {
    const v = product.variants;
    const priceLabel = variable && v && v.min !== v.max ? `${format(v.min)} – ${format(v.max)}` : format(variable && v ? v.min : product.price);
    const btn = "w-full max-w-[12rem] mx-auto inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[15px] uppercase transition-opacity hover:opacity-90";
    const btnStyle: React.CSSProperties = { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" };
    return (
      <div className={CARD_STYLE.retail}>
        <Link href={`/products/${product.slug}`} className="block">
          <div className={cn("relative overflow-hidden bg-white", RATIO_CLASS[imageRatio])}>
            {firstImage ? (
              <Image src={firstImage} alt={product.name} fill className="object-contain group-hover:scale-[1.03] transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ShoppingCart className="h-12 w-12" /></div>
            )}
            {showBadges && (
              <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                {discount && discount > 0 && <span className="bg-[#ff0000] text-white text-[13px] font-semibold px-2.5 py-1">SALE</span>}
                {product.featured && <span className="bg-[#808080] text-white text-[10px] font-semibold px-2.5 py-1.5">Best Seller</span>}
              </div>
            )}
            {showBadges && !inStock && (
              <span className="absolute top-2 right-2 bg-black/75 text-white text-[11px] px-2 py-0.5">Out of Stock</span>
            )}
          </div>
        </Link>
        <div className="flex flex-col flex-1 pt-4 text-center gap-2.5">
          <Link href={`/products/${product.slug}`} className="uppercase text-[13px] tracking-wide leading-snug hover:opacity-70 min-h-[2.5em]">{product.name}</Link>
          <div className="flex items-baseline justify-center gap-2 text-[14px]">
            {!variable && product.compare_price && product.compare_price > product.price && (
              <span className="line-through text-muted-foreground">{format(product.compare_price)}</span>
            )}
            <span>{priceLabel}</span>
          </div>
          <div className="mt-auto pt-1">
            {showAddToCart && (variable ? (
              <Link href={`/products/${product.slug}`} className={btn} style={btnStyle}>Choose size</Link>
            ) : (
              <button onClick={handleAdd} disabled={!inStock} className={cn(btn, !inStock && "opacity-50 cursor-not-allowed")} style={btnStyle}>
                {inStock ? "Add to cart" : "Sold out"}
              </button>
            ))}
            {variable && v && v.labels.length > 0 && (
              <div className="flex justify-center gap-1.5 mt-2.5 flex-wrap">
                {v.labels.slice(0, 5).map((l) => (
                  <Link key={l} href={`/products/${product.slug}`} className="border border-black/20 text-[12px] uppercase px-2.5 py-1 hover:border-black">{l}</Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (cardStyle === "boutique") {
    const v = product.variants;
    const priceLabel = variable && v && v.min !== v.max ? `${format(v.min)} – ${format(v.max)}` : format(variable && v ? v.min : product.price);
    const btn = "mt-auto w-full inline-flex items-center justify-center rounded-full px-4 py-3 text-[0.8rem] font-semibold uppercase tracking-wide transition-opacity hover:opacity-90";
    const btnStyle: React.CSSProperties = { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" };
    return (
      <div className={cn(CARD_STYLE.boutique, featured && "h-full")}>
        <Link href={`/products/${product.slug}`} className="block">
          <div className={cn("relative overflow-hidden bg-muted", RATIO_CLASS[imageRatio])}>
            {firstImage ? (
              <Image src={firstImage} alt={product.name} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ShoppingCart className="h-12 w-12" /></div>
            )}
            {showBadges && discount && discount > 0 && (
              <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded font-semibold" style={btnStyle}>Sale!</span>
            )}
            {showBadges && !inStock && (
              <span className="absolute top-3 right-3 bg-black/75 text-white text-xs px-2 py-0.5 rounded font-medium">Out of Stock</span>
            )}
            {variable && v && v.labels.length > 0 && (
              <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 px-2 flex-wrap">
                {v.labels.slice(0, 4).map((l) => (
                  <span key={l} className="bg-white/95 text-[0.68rem] uppercase rounded-full px-3 py-0.5 text-neutral-800 shadow-sm">{l}</span>
                ))}
              </div>
            )}
          </div>
        </Link>
        <div className="flex flex-col flex-1 px-3 pt-5 pb-4 text-center gap-3">
          <Link href={`/products/${product.slug}`}>
            <h3 className="uppercase leading-snug tracking-wide text-[1.05rem] hover:opacity-75 transition-opacity" style={{ fontFamily: "var(--heading-font, inherit)" }}>
              {product.name}
            </h3>
          </Link>
          <div className="flex items-baseline justify-center gap-2 text-[0.95rem] font-semibold" style={{ color: "hsl(var(--primary))" }}>
            {!variable && product.compare_price && product.compare_price > product.price && (
              <span className="line-through opacity-70 font-normal">{format(product.compare_price)}</span>
            )}
            <span>{priceLabel}</span>
          </div>
          {showAddToCart && (variable ? (
            <Link href={`/products/${product.slug}`} className={btn} style={btnStyle}>Select options</Link>
          ) : (
            <button onClick={handleAdd} disabled={!inStock} className={cn(btn, !inStock && "opacity-50 cursor-not-allowed")} style={btnStyle}>
              {inStock ? "Add to cart" : "Sold out"}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(CARD_STYLE[cardStyle], featured && "h-full")}>
      <Link href={`/products/${product.slug}`}>
        <div className={cn("relative overflow-hidden bg-muted", RATIO_CLASS[imageRatio])}>
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

        {(product.dietary_info?.diet || !!product.dietary_info?.spice_level) && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {product.dietary_info?.diet && (
              <span
                className={cn(
                  "w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center shrink-0",
                  DIET_DOT[product.dietary_info.diet],
                )}
                title={product.dietary_info.diet.replace("_", "-")}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
              </span>
            )}
            {!!product.dietary_info?.spice_level && (
              <span className="text-xs">{"🌶".repeat(product.dietary_info.spice_level)}</span>
            )}
          </div>
        )}

        <div className={cn("mt-3 flex flex-wrap items-center", showAddToCart ? "justify-between" : "justify-start", "gap-2")}>
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
                  ? "bg-foreground text-background hover:opacity-80"
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

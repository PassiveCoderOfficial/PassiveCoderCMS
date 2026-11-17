"use client";

import React from "react";
import Link from "next/link";
import Image from "@/components/ui/smart-image";
import { Award, BellRing, ShoppingCart } from "lucide-react";
import { useEcommerceCurrency } from "@/lib/hooks/use-ecommerce-currency";
import { useCart } from "@/lib/cart/cart-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStoreText } from "@/components/site/use-store-text";
import { AskPriceButton, useProductPrice } from "@/components/site/no-price";
import type { NoPriceSetting } from "@/lib/ecommerce/price-display";
import type { StoreText } from "@/lib/i18n-site/storefront-text";

/** A block's own button / badge words; unset keys keep the storefront wording (page language). */
export type CardLabels = Partial<Pick<StoreText, "add" | "addToCart" | "soldOut" | "outOfStock" | "sale" | "saleTag" | "bestSeller" | "chooseSize" | "chooseOptions" | "selectOptions">>;

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
  default:  "group border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-card text-card-foreground",
  flat:     "group rounded-xl overflow-hidden bg-muted/30 hover:bg-muted/60 transition-colors",
  minimal:  "group rounded-xl overflow-hidden",
  shadow:   "group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-card text-card-foreground",
  bordered: "group border-2 border-border rounded-xl overflow-hidden hover:border-primary transition-colors bg-background",
  // Luxury-retail look: thin frame, centred heading-font title, full-width pill button.
  boutique: "group border border-border rounded-md overflow-hidden bg-card text-card-foreground flex flex-col hover:shadow-md transition-shadow",
  // Department-store look: no frame, small upper-case name, pill button, size chips.
  retail: "group flex flex-col h-full",
};

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  /** null = no price: the card shows Message for Price / Request Price / 0 per the store setting. */
  price: number | null;
  compare_price: number | null;
  /** Product's own no-price choice (products.attributes.noPrice). */
  noPrice?: NoPriceSetting | null;
  images: string[];
  short_description?: string | null;
  inStock?: boolean;
  /** Restaurant menu metadata (2026-09-12) — empty/absent on ordinary
   *  ecommerce products, so this renders nothing for non-menu catalogs. */
  dietary_info?: { diet?: "veg" | "non_veg" | "vegan"; spice_level?: number; tags?: string[] };
  /** Variable products (sizes, colours): the card shows the price range and
   *  links to the product page to choose, rather than adding the base price. */
  variants?: { count: number; min: number; max: number; labels: string[]; quickPick?: boolean; list?: { id: string; name: string; price: number; compare_price: number | null; inStock: boolean }[] } | null;
  /** Featured products get a "Best Seller" badge on the retail card. */
  featured?: boolean | null;
  /** Product page address when not /products/<slug> (a language version: /ar/products/<slug>). */
  href?: string;
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
  /** Size/colour chips on the card (retail quick-pick, boutique labels).
   *  Off = variable products just link to their page to choose. Default on. */
  showVariantPicker?: boolean;
  labels?: CardLabels;
}

export function ProductCard({
  product,
  showAddToCart = true,
  showDescription = true,
  showBadges = true,
  cardStyle = "default",
  imageRatio = "square",
  featured = false,
  showVariantPicker = true,
  labels,
}: ProductCardProps) {
  const { addItem, openCart } = useCart();
  const { format } = useEcommerceCurrency();
  const firstImage = product.images[0] as string | undefined;
  const href = product.href ?? `/products/${product.slug}`;
  // Sold out: the card's button opens the product page at its back-in-stock form.
  const notifyHref = `${href}#notify-me`;
  const storeT = useStoreText();
  const t = labels ? { ...storeT, ...labels } : storeT;
  // Second photo fades in on hover (when the product has one).
  const secondImage = product.images[1] as string | undefined;
  const [pickId, setPickId] = React.useState<string | null>(null);
  const inStock = product.inStock !== false;
  const variable = !!product.variants && product.variants.count > 0;
  const pp = useProductPrice(product);
  const unitPrice = pp.price;
  const ask = !variable && !pp.sellable;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!inStock) return;
    if (variable) { window.location.href = href; return; }
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: unitPrice,
      image: firstImage,
      quantity: 1,
    });
    toast.success(t.addedToCart(product.name), {
      action: { label: t.viewCart, onClick: openCart },
    });
  }

  const discount = pp.priced && product.compare_price && product.compare_price > unitPrice
    ? Math.round((1 - unitPrice / product.compare_price) * 100)
    : null;

  if (cardStyle === "retail") {
    const v = product.variants;
    const quick = showVariantPicker && variable && v?.quickPick && (v.list?.length ?? 0) > 0;
    const picked = quick ? v!.list!.find((x) => x.id === pickId) ?? null : null;
    const priceLabel = picked ? format(picked.price) : variable && v && v.min !== v.max ? `${format(v.min)} – ${format(v.max)}` : (ask ? "" : format(variable && v ? v.min : unitPrice));
    const addPicked = () => {
      if (!picked) { toast.error(t.chooseSizeFirst); return; }
      addItem({ id: `${product.id}:${picked.id}`, product_id: product.id, variant_id: picked.id, name: `${product.name} - ${picked.name}`, slug: product.slug, price: picked.price, image: firstImage, quantity: 1 });
      toast.success(t.addedToCart(product.name), { action: { label: t.viewCart, onClick: openCart } });
    };
    const btn = "w-full max-w-[12rem] mx-auto inline-flex items-center justify-center rounded-full px-2.5 sm:px-4 py-2 sm:py-2.5 text-[12px] sm:text-[15px] leading-tight uppercase transition-opacity hover:opacity-90";
    const btnStyle: React.CSSProperties = { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" };
    return (
      <div className={CARD_STYLE.retail}>
        <Link href={href} className="block">
          <div className={cn("relative overflow-hidden bg-white", RATIO_CLASS[imageRatio])}>
            {firstImage ? (
              <>
              <Image src={firstImage} alt={product.name} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className={"object-contain group-hover:scale-[1.03] transition-all duration-500" + (secondImage ? " group-hover:opacity-0" : "") } />
              {secondImage && <Image src={secondImage} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-contain absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ShoppingCart className="h-12 w-12" /></div>
            )}
            {showBadges && (
              <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                {discount && discount > 0 && <span className="bg-[#ff0000] text-white text-[13px] font-semibold px-2.5 py-1">{t.percentOff(discount)}</span>}
                {product.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#b8893f] text-white text-[10px] font-semibold uppercase tracking-wide pl-1.5 pr-2.5 py-1 shadow-sm">
                    <Award className="h-3.5 w-3.5" aria-hidden />{t.bestSeller}
                  </span>
                )}
              </div>
            )}
            {showBadges && !inStock && (
              <span className="absolute top-2 right-2 bg-black/75 text-white text-[11px] px-2 py-0.5">{t.soldOut}</span>
            )}
          </div>
        </Link>
        <div className="flex flex-col flex-1 pt-4 text-center gap-2.5">
          <Link href={href} className="uppercase text-[13px] tracking-wide leading-snug hover:opacity-70 min-h-[2.5em]">{product.name}</Link>
          <div className="flex items-baseline justify-center gap-2 text-[14px]">
            {picked?.compare_price && picked.compare_price > picked.price && <span className="line-through text-muted-foreground">{format(picked.compare_price)}</span>}
            {!variable && pp.priced && product.compare_price && product.compare_price > unitPrice && (
              <span className="line-through text-muted-foreground">{format(product.compare_price)}</span>
            )}
            <span>{priceLabel}</span>
          </div>
          <div className="mt-auto pt-1">
            {ask ? (
              <AskPriceButton product={product} compact className={cn(btn, "normal-case whitespace-nowrap")} style={btnStyle} />
            ) : showAddToCart && (quick ? (
              <button onClick={addPicked} disabled={!!picked && !picked.inStock} className={cn(btn, picked && !picked.inStock && "opacity-50 cursor-not-allowed")} style={btnStyle}>
                {!picked ? t.chooseSize : picked.inStock ? t.addToCart : t.soldOut}
              </button>
            ) : variable ? (
              <Link href={href} className={btn} style={btnStyle}>{t.chooseOptions}</Link>
            ) : !inStock ? (
              <Link href={notifyHref} className={cn(btn, "gap-1.5")} style={btnStyle}><BellRing className="h-4 w-4" aria-hidden />{t.notifyMe}</Link>
            ) : (
              <button onClick={handleAdd} className={btn} style={btnStyle}>{t.addToCart}</button>
            ))}
            {quick ? (
              <div className="flex justify-center gap-1.5 mt-2.5 flex-wrap">
                {v!.list!.slice(0, 6).map((x) => (
                  <button key={x.id} type="button" onClick={() => setPickId(x.id === pickId ? null : x.id)}
                    className={cn("border text-[12px] uppercase px-2.5 py-1 transition-colors", x.id === pickId ? "border-foreground bg-foreground text-background" : "border-black/20 hover:border-black", !x.inStock && "opacity-40 line-through")}>
                    {x.name}
                  </button>
                ))}
              </div>
            ) : showVariantPicker && variable && v && v.labels.length > 0 && (
              <div className="flex justify-center gap-1.5 mt-2.5 flex-wrap">
                {v.labels.slice(0, 5).map((l) => (
                  <Link key={l} href={href} className="border border-black/20 text-[12px] uppercase px-2.5 py-1 hover:border-black">{l}</Link>
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
    const priceLabel = variable && v && v.min !== v.max ? `${format(v.min)} – ${format(v.max)}` : (ask ? "" : format(variable && v ? v.min : unitPrice));
    const btn = "mt-auto w-full inline-flex items-center justify-center rounded-full px-2.5 sm:px-4 py-2.5 sm:py-3 text-[0.68rem] sm:text-[0.8rem] leading-tight font-semibold uppercase sm:tracking-wide whitespace-nowrap transition-opacity hover:opacity-90";
    const btnStyle: React.CSSProperties = { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" };
    return (
      <div className={cn(CARD_STYLE.boutique, featured && "h-full")}>
        <Link href={href} className="block">
          <div className={cn("relative overflow-hidden bg-muted", RATIO_CLASS[imageRatio])}>
            {firstImage ? (
              <>
              <Image src={firstImage} alt={product.name} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className={"object-cover group-hover:scale-[1.03] transition-all duration-500" + (secondImage ? " group-hover:opacity-0" : "")} />
              {secondImage && <Image src={secondImage} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ShoppingCart className="h-12 w-12" /></div>
            )}
            {showBadges && discount && discount > 0 && (
              <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded font-semibold" style={btnStyle}>{t.percentOff(discount)}</span>
            )}
            {showBadges && !inStock && (
              <span className="absolute top-3 right-3 bg-black/75 text-white text-xs px-2 py-0.5 rounded font-medium">{t.soldOut}</span>
            )}
            {showVariantPicker && variable && v && v.labels.length > 0 && (
              <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 px-2 flex-wrap">
                {v.labels.slice(0, 4).map((l) => (
                  <span key={l} className="bg-white/95 text-[0.68rem] uppercase rounded-full px-3 py-0.5 text-neutral-800 shadow-sm">{l}</span>
                ))}
              </div>
            )}
          </div>
        </Link>
        <div className="flex flex-col flex-1 px-2.5 sm:px-3 pt-4 sm:pt-5 pb-3 sm:pb-4 text-center gap-2.5 sm:gap-3">
          <Link href={href}>
            <h3 className="uppercase leading-snug tracking-wide text-[0.85rem] sm:text-[1.05rem] hover:opacity-75 transition-opacity" style={{ fontFamily: "var(--heading-font, inherit)" }}>
              {product.name}
            </h3>
          </Link>
          <div className="flex items-baseline justify-center gap-2 text-[0.95rem] font-semibold" style={{ color: "hsl(var(--primary))" }}>
            {!variable && pp.priced && product.compare_price && product.compare_price > unitPrice && (
              <span className="line-through opacity-70 font-normal">{format(product.compare_price)}</span>
            )}
            <span>{priceLabel}</span>
          </div>
          {ask ? (
            <AskPriceButton product={product} compact className={btn} style={btnStyle} />
          ) : showAddToCart && (variable ? (
            <Link href={href} className={btn} style={btnStyle}>{t.selectOptions}</Link>
          ) : !inStock ? (
            <Link href={notifyHref} className={cn(btn, "gap-1.5")} style={btnStyle}><BellRing className="h-3.5 w-3.5" aria-hidden />{t.notifyMe}</Link>
          ) : (
            <button onClick={handleAdd} className={btn} style={btnStyle}>{t.addToCart}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(CARD_STYLE[cardStyle], featured && "h-full")}>
      <Link href={href}>
        <div className={cn("relative overflow-hidden bg-muted", RATIO_CLASS[imageRatio])}>
          {firstImage ? (
            <>
            <Image
              src={firstImage}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className={"object-cover group-hover:scale-105 transition-all duration-300" + (secondImage ? " group-hover:opacity-0" : "")}
            />
            {secondImage && <Image src={secondImage} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingCart className="h-12 w-12" />
            </div>
          )}
          {showBadges && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {discount && discount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">{t.percentOff(discount)}</span>
              )}
              {!inStock && (
                <span className="bg-gray-800/80 text-white text-xs px-2 py-0.5 rounded-full font-medium">{t.outOfStock}</span>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className={cn("p-4", featured && "p-5")}>
        <Link href={href}>
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
            {!ask && <span className={cn("font-bold", featured ? "text-xl" : "text-sm")}>{format(unitPrice)}</span>}
            {!ask && pp.priced && product.compare_price && (
              <span className="text-xs text-muted-foreground line-through">{format(product.compare_price)}</span>
            )}
          </div>

          {ask ? (
            <AskPriceButton product={product} compact className="flex items-center text-xs px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-80 shrink-0" />
          ) : showAddToCart && !inStock ? (
            <Link href={notifyHref} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-80 shrink-0">
              <BellRing className="h-3 w-3" aria-hidden />{t.notifyMe}
            </Link>
          ) : showAddToCart && (
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
              {inStock ? t.add : t.soldOut}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

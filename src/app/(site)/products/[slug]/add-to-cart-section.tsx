"use client";

import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { useEcommerceCurrency } from "@/lib/hooks/use-ecommerce-currency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AskPriceButton, useProductPrice } from "@/components/site/no-price";
import type { NoPriceSetting } from "@/lib/ecommerce/price-display";
import { resolveOptions, variantAttrs, type ProductOption } from "@/lib/ecommerce/variations";
import { useStoreText } from "@/components/site/use-store-text";

export interface VariantOption {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  inStock: boolean;
  image: string | null;
  attributes?: Record<string, string>;
  images?: string[];
}

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    /** null = no price (see price-display). */
    price: number | null;
    image: string | null;
    inStock: boolean;
    noPrice?: NoPriceSetting | null;
  };
  comparePrice?: number | null;
  /** Server-formatted base prices, shown before any option is picked. */
  priceLabel?: string;
  comparePriceLabel?: string | null;
  variants?: VariantOption[];
  /** Option types (Size, Colour…). Empty = one derived "Size" option from variant names. */
  options?: ProductOption[];
  defaultVariantId?: string | null;
}

/**
 * Price + options + quantity + add to cart. With variants (sizes etc.) the
 * shopper must pick one; the cart line carries the variant id and its own
 * price, and /api/ecommerce/orders re-prices it from product_variants.
 */
export function AddToCartSection({ product, comparePrice, priceLabel, comparePriceLabel, variants = [], options: optionDefs, defaultVariantId }: Props) {
  const [qty, setQty] = useState(1);
  const options = React.useMemo(() => resolveOptions(optionDefs ?? null, variants.map((v) => ({ name: v.name, attributes: v.attributes ?? {} }))), [optionDefs, variants]);
  const attrsOf = React.useCallback((v: VariantOption) => variantAttrs({ name: v.name, attributes: v.attributes ?? {} }, options), [options]);
  const def = variants.find((v) => v.id === defaultVariantId);
  const [sel, setSel] = useState<Record<string, string>>(() => (def ? attrsOf(def) : {}));
  const match = variants.find((v) => { const a = attrsOf(v); return options.every((o) => sel[o.name] && a[o.name] === sel[o.name]); });
  const variantId = match?.id ?? null;
  // Selected variation's own photos replace the gallery (event read by ProductGallery).
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("product-variant-images", { detail: match?.images?.length ? match.images : match?.image ? [match.image] : null }));
  }, [match]);
  /** Value exists with the other current choices; and whether that one is in stock. */
  const valueState = (optName: string, value: string) => {
    const hits = variants.filter((v) => { const a = attrsOf(v); return a[optName] === value && options.every((o) => o.name === optName || !sel[o.name] || a[o.name] === sel[o.name]); });
    return { exists: hits.length > 0, inStock: hits.some((h) => h.inStock) };
  };
  const { addItem, openCart } = useCart();
  const { format } = useEcommerceCurrency();
  const t = useStoreText();

  const hasVariants = variants.length > 0;
  const pp = useProductPrice(product);
  const ask = !hasVariants && !pp.sellable;
  const base = pp.price;
  const selected = variants.find((v) => v.id === variantId) ?? null;
  const min = hasVariants ? Math.min(...variants.map((v) => v.price)) : base;
  const max = hasVariants ? Math.max(...variants.map((v) => v.price)) : base;

  const shownPrice = selected
    ? format(selected.price)
    : hasVariants
      ? (min === max ? format(min) : `${format(min)} – ${format(max)}`)
      : ask ? "" : pp.priced ? (priceLabel ?? format(base)) : format(0);
  const shownCompare = selected
    ? (selected.compare_price && selected.compare_price > selected.price ? format(selected.compare_price) : null)
    : hasVariants ? null : (pp.priced && comparePrice && comparePrice > base ? (comparePriceLabel ?? format(comparePrice)) : null);
  const inStock = selected ? selected.inStock : product.inStock;
  // How much is off, beside the struck-out price ("50% OFF"), matching the product cards.
  const was = selected ? selected.compare_price : comparePrice;
  const now = selected ? selected.price : base;
  const offPct = shownCompare && was && was > now ? Math.round((1 - now / was) * 100) : 0;

  function handleAdd() {
    if (hasVariants && !selected) {
      toast.error(t.chooseOptionFirst);
      return;
    }
    addItem({
      id: selected ? `${product.id}:${selected.id}` : product.id,
      product_id: product.id,
      ...(selected ? { variant_id: selected.id } : {}),
      name: selected ? `${product.name} - ${selected.name}` : product.name,
      slug: product.slug,
      price: selected ? selected.price : base,
      image: (selected?.image || product.image) ?? undefined,
      quantity: qty,
    });
    toast.success(t.addedToCart(product.name), {
      action: { label: t.viewCart, onClick: openCart },
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline flex-wrap gap-3">
        {shownCompare && <span className="text-xl text-muted-foreground line-through">{shownCompare}</span>}
        {shownPrice && <span className="text-3xl sm:text-4xl font-semibold" style={{ fontFamily: "var(--heading-font, inherit)" }}>{shownPrice}</span>}
        {offPct > 0 && <span className="self-center bg-[#ff0000] text-white text-sm font-semibold px-2.5 py-1">{t.percentOff(offPct)}</span>}
      </div>

      {hasVariants && options.map((o) => (
        <div key={o.id}>
          <p className="text-sm font-semibold mb-2">
            {t.optionName(o.name)}{sel[o.name] ? <span className="font-normal text-muted-foreground">: {sel[o.name]}</span> : null}
          </p>
          {o.display === "dropdown" ? (
            <select value={sel[o.name] ?? ""} onChange={(e) => setSel({ ...sel, [o.name]: e.target.value })} className="h-11 min-w-[12rem] rounded-full border border-border bg-background px-4 text-sm">
              <option value="">{t.chooseOption(o.name)}</option>
              {o.values.map((v) => { const st = valueState(o.name, v.label); return <option key={v.id} value={v.label} disabled={!st.exists}>{v.label}{st.exists && !st.inStock ? t.soldOutSuffix : ""}</option>; })}
            </select>
          ) : (
            <div className="flex flex-wrap gap-2">
              {o.values.map((v) => {
                const st = valueState(o.name, v.label);
                const on = sel[o.name] === v.label;
                const pick = () => setSel({ ...sel, [o.name]: on ? "" : v.label });
                return o.display === "swatches" ? (
                  <button key={v.id} type="button" onClick={pick} disabled={!st.exists} title={v.label} aria-label={v.label}
                    className={cn("relative w-10 h-10 rounded-full border-2 transition", on ? "border-foreground" : "border-transparent hover:border-border", (!st.exists || !st.inStock) && "opacity-40")}>
                    <span className="absolute inset-1 rounded-full bg-center bg-cover" style={{ background: v.image ? `url(${v.image}) center/cover` : v.color ?? "#ccc" }} />
                    {!st.inStock && <span className="absolute inset-0 m-auto h-[2px] w-full rotate-45 bg-foreground/60" />}
                  </button>
                ) : (
                  <button key={v.id} type="button" onClick={pick} disabled={!st.exists}
                    className={cn("min-w-[4rem] px-4 py-2 rounded-full border text-sm uppercase transition-colors",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary",
                      !st.exists && "opacity-30 cursor-not-allowed", st.exists && !st.inStock && "opacity-50 line-through")}>
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {ask ? (
        <AskPriceButton product={product} className="h-12 px-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold tracking-wide hover:opacity-90 transition-opacity inline-flex items-center justify-center" />
      ) : !inStock ? (
        <NotifyMe productId={product.id} variantId={variantId} />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-border rounded-full overflow-hidden h-12">
            <button type="button" aria-label={t.decrease} onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3.5 h-full hover:bg-muted transition-colors" disabled={qty <= 1}>
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="px-3 text-sm font-semibold min-w-[40px] text-center">{qty}</span>
            <button type="button" aria-label={t.increase} onClick={() => setQty((q) => Math.min(99, q + 1))} className="px-3.5 h-full hover:bg-muted transition-colors">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="h-12 px-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity"
          >
            {t.addToCart}
          </button>
        </div>
      )}
    </div>
  );
}

/** Sold out: collect an email for a back-in-stock message. */
function NotifyMe({ productId, variantId }: { productId: string; variantId: string | null }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const t = useStoreText();
  if (done) return <p id="notify-me" className="text-sm rounded-lg bg-muted px-4 py-3">{t.notifyDone}</p>;
  return (
    <div id="notify-me" className="space-y-2 scroll-mt-32">
      <p className="text-sm font-semibold">{t.soldOutNotify}</p>
      <form className="flex flex-wrap gap-2" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        const r = await fetch("/api/ecommerce/stock-alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, variantId, email }) });
        setBusy(false);
        if (r.ok) setDone(true); else toast.error((await r.json().catch(() => ({}))).error ?? t.couldNotSave);
      }}>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.yourEmail} className="h-11 flex-1 min-w-[12rem] rounded-full border border-border bg-background px-4 text-sm" />
        <button disabled={busy} className="h-11 px-6 rounded-full bg-foreground text-background text-sm font-semibold uppercase tracking-wide disabled:opacity-60">{t.notifyMe}</button>
      </form>
    </div>
  );
}

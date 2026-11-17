"use client";

import React from "react";
import { strictStyleText } from "@/lib/security/style-text";
import type { EcommerceProductsBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ProductCard, type CardLabels } from "./product-card";
import { ProductCardMinimal } from "./product-card-minimal";
import { ProductCardWide } from "./product-card-wide";
import type { toProductCardData } from "@/lib/ecommerce/product-card-data";
import { ProductCarousel } from "./product-carousel";
import { uiText } from "@/modules/page-builder/ui-text";

const PADDING = {
  none: "py-0",
  sm:   "py-6",
  md:   "py-12",
  lg:   "py-20",
  xl:   "py-28",
};

const ALIGN = {
  left:   "text-left",
  center: "text-center",
  right:  "text-right",
};

/** The block's own card words (Words on this section); undefined = storefront wording. */
function cardLabels(data: EcommerceProductsBlockProps["data"]): CardLabels | undefined {
  const own = uiText("ecommerce_products", data).own;
  const map: CardLabels = {
    add: own("addLabel"), addToCart: own("addToCartLabel"), soldOut: own("soldOutLabel"), outOfStock: own("outOfStockLabel"),
    sale: own("saleLabel"), saleTag: own("saleTagLabel"), bestSeller: own("bestSellerLabel"), chooseSize: own("chooseSizeLabel"),
    chooseOptions: own("chooseOptionsLabel"), selectOptions: own("selectOptionsLabel"),
  };
  const set = Object.fromEntries(Object.entries(map).filter(([, v]) => v)) as CardLabels;
  return Object.keys(set).length ? set : undefined;
}

/** `href`: the tile's link when not /shop?category=<slug> (a language version: /ar/shop?...). */
export type CategoryTile = { id: string; name: string; slug: string; image_url: string | null; count?: number; href?: string };

/** Products per category id, from rows of products.category_ids. */
export function countByCategory(rows: { category_ids: unknown }[] | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows ?? []) for (const id of Array.isArray(r.category_ids) ? r.category_ids : []) out[id as string] = (out[id as string] ?? 0) + 1;
  return out;
}

/**
 * Products block markup, shared by the live site (server fetch) and the page
 * builder canvas (browser fetch), so the editor shows the real grid.
 */
export function EcommerceProductsView({ data, products, categories }: {
  data: EcommerceProductsBlockProps["data"];
  products: ReturnType<typeof toProductCardData>[];
  categories?: CategoryTile[];
}) {
  const {
    title, subtitle, layout = "grid", columns = 3,
    showAddToCart = true, showVariantPicker = true,
    showDescription = true, showBadges = true,
    cardStyle = "default", imageRatio = "square",
    sectionPadding = "md", backgroundColor,
    titleAlignment = "center", ctaLabel, ctaUrl,
  } = data;
  if (data.showAs === "categories") return <CategoryTiles data={data} categories={categories ?? []} />;
  if (!products.length) {
    return (
      <div className={cn("max-w-7xl mx-auto px-4", PADDING[sectionPadding])}>
        {title && <h2 className={cn("text-3xl font-bold mb-10", ALIGN[titleAlignment])}>{title}</h2>}
        <p className="text-center text-muted-foreground py-12">{uiText("ecommerce_products", data)("emptyText")}</p>
      </div>
    );
  }
  const labels = cardLabels(data);

  const normalizedProducts = products;

  const colMap: Record<number, string> = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  };

  const wrapStyle: React.CSSProperties = backgroundColor ? { backgroundColor } : {};

  return (
    <div style={wrapStyle} className={cn(PADDING[sectionPadding])}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        {data.headingStyle === "compact" && (title || data.headerLink?.label) ? (
          <div className={cn("mb-6", ALIGN[titleAlignment])}>
            {title && <h2 className="text-[16px] uppercase tracking-wide font-normal m-0">{title}</h2>}
            {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
            {data.headerLink?.label && <Link href={data.headerLink.url || "/shop"} className="inline-block mt-3 text-[10px] uppercase underline underline-offset-2">{data.headerLink.label}</Link>}
          </div>
        ) : (title || subtitle) && (
          <div className={cn("mb-10", ALIGN[titleAlignment])}>
            {title && <h2 className="text-3xl font-bold tracking-tight">{title}</h2>}
            {subtitle && <p className="text-muted-foreground mt-2 text-base">{subtitle}</p>}
          </div>
        )}

        {/* ── Grid layout (default; also fallback for any unknown layout value) ── */}
        {layout === "carousel" && (
          <ProductCarousel perView={columns}>
            {normalizedProducts.map((product) => (
              <ProductCard key={product.id} product={product} showAddToCart={showAddToCart} showVariantPicker={showVariantPicker} showDescription={showDescription}
                showBadges={showBadges} cardStyle={cardStyle} imageRatio={imageRatio} labels={labels} />
            ))}
          </ProductCarousel>
        )}

        {(layout === "grid" || !["list", "featured", "minimal", "wide-cards", "carousel"].includes(layout)) && (
          // Two products per row on phones (shop-app style), more from sm up.
          <div className={cn("grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-6", colMap[columns] ?? colMap[3])}>
            {normalizedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showAddToCart={showAddToCart} showVariantPicker={showVariantPicker}
                showDescription={showDescription}
                showBadges={showBadges}
                cardStyle={cardStyle}
                imageRatio={imageRatio}
                labels={labels}
              />
            ))}
          </div>
        )}

        {/* ── Wide cards (horizontal cards) ── */}
        {layout === "wide-cards" && (
          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-5", data.wideCols === 3 && "lg:grid-cols-3")}>
            {normalizedProducts.map((product) => (
              <ProductCardWide
                key={product.id}
                product={product}
                showAddToCart={showAddToCart}
                showDescription={showDescription}
                cardStyle={cardStyle}
                labels={labels}
              />
            ))}
          </div>
        )}

        {/* ── List layout ── */}
        {layout === "list" && (
          <div className="flex flex-col divide-y border rounded-xl overflow-hidden">
            {normalizedProducts.map((product) => (
              <ProductCardWide
                key={product.id}
                product={product}
                showAddToCart={showAddToCart}
                showDescription={showDescription}
                cardStyle="flat"
                listMode
                labels={labels}
              />
            ))}
          </div>
        )}

        {/* ── Featured layout (first item large, rest small) ── */}
        {layout === "featured" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hero card */}
            <ProductCard
              product={normalizedProducts[0]}
              showAddToCart={showAddToCart} showVariantPicker={showVariantPicker}
              showDescription={showDescription}
              showBadges={showBadges}
              cardStyle={cardStyle}
              imageRatio="portrait"
              featured
              labels={labels}
            />
            {/* Side grid */}
            <div className="grid grid-cols-2 gap-4 content-start">
              {normalizedProducts.slice(1).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showAddToCart={showAddToCart} showVariantPicker={showVariantPicker}
                  showDescription={false}
                  showBadges={showBadges}
                  cardStyle={cardStyle}
                  imageRatio="square"
                  labels={labels}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Minimal layout (name + price row, no image frame) ── */}
        {layout === "minimal" && (
          <div className={cn("grid grid-cols-1 gap-3", colMap[columns] ?? colMap[3])}>
            {normalizedProducts.map((product) => (
              <ProductCardMinimal
                key={product.id}
                product={product}
                showAddToCart={showAddToCart}
                labels={labels}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        {ctaLabel && ctaUrl && (
          <div className={cn("mt-10", ALIGN[titleAlignment])}>
            <Link
              href={ctaUrl}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {ctaLabel} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const RATIO_STYLE: Record<string, string> = { square: "1 / 1", portrait: "3 / 4", landscape: "4 / 3", auto: "1 / 1" };

/** Collection tiles: category photo, name under it, and a Shop now button. */
function ClassicCategoryTiles({ data, categories }: { data: EcommerceProductsBlockProps["data"]; categories: CategoryTile[] }) {
  const cols = data.columns ?? 4;
  // Flex rather than grid so a short last row sits centred instead of leaving a gap.
  const basis = cols === 2 ? "sm:basis-[calc((100%-1.25rem)/2)]" : cols === 3 ? "sm:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-2.5rem)/3)]" : cols === 5 ? "sm:basis-[calc((100%-2.5rem)/3)] lg:basis-[calc((100%-5rem)/5)]" : "sm:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-3.75rem)/4)]";
  return (
    <div className={PADDING[data.sectionPadding ?? "md"]} style={data.backgroundColor ? { backgroundColor: data.backgroundColor } : undefined}>
      <div className="max-w-7xl mx-auto px-4">
        {data.title && <h2 className={cn("uppercase text-[18px] font-normal m-0 mb-6", ALIGN[data.titleAlignment ?? "center"])}>{data.title}</h2>}
        {data.subtitle && <p className={cn("text-muted-foreground -mt-3 mb-6 text-sm", ALIGN[data.titleAlignment ?? "center"])}>{data.subtitle}</p>}
        {categories.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">{uiText("ecommerce_products", data)("emptyText")}</p>}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-8">
          {categories.map((c) => (
            <Link key={c.id} href={c.href ?? `/shop?category=${c.slug}`} className={cn("group text-center basis-[calc((100%-1.25rem)/2)] grow-0 shrink-0", basis)}>
              <div className="overflow-hidden rounded bg-muted" style={{ aspectRatio: RATIO_STYLE[data.imageRatio ?? "portrait"] ?? "3 / 4" }}>
                {c.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt={c.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                )}
              </div>
              <h3 className="mt-4 mb-3 uppercase tracking-wide text-[15px] font-medium">{c.name}</h3>
              {data.categoryButtonLabel !== "-" && (
                <span className="inline-flex rounded-full px-6 py-2 text-[13px] uppercase" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                  {data.categoryButtonLabel || "Shop now"}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Category tiles. "classic" (the default, for blocks saved before the tile
 * options existed) is the portrait photo + Shop now button above; the other
 * shapes are compact shop-app tiles where every size, colour and column
 * count is set in the block settings.
 */
function CategoryTiles({ data, categories }: { data: EcommerceProductsBlockProps["data"]; categories: CategoryTile[] }) {
  const shape = data.tileShape ?? "classic";
  const rid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  if (shape === "classic") return <ClassicCategoryTiles data={data} categories={categories} />;
  const id = `pct-${rid}`;
  const m = data.colsMobile ?? 2, t = data.colsTablet ?? 4, dk = data.colsDesktop ?? 6;
  const gap = data.tileGap ?? 16;
  const radius = shape === "circle" ? "9999px" : shape === "rounded" ? `${data.tileRadius ?? 18}px` : "0";
  const hover = data.tileHover ?? "zoom";
  const css = `
#${id} .pct-grid{display:grid;grid-template-columns:repeat(${m},minmax(0,1fr));gap:${gap}px}
@media(min-width:768px){#${id} .pct-grid{grid-template-columns:repeat(${t},minmax(0,1fr))}}
@media(min-width:1024px){#${id} .pct-grid{grid-template-columns:repeat(${dk},minmax(0,1fr))}}
${data.mobileScroll ? `@media(max-width:767.98px){#${id} .pct-grid{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:4px}#${id} .pct-grid::-webkit-scrollbar{display:none}#${id} .pct-tile{flex:0 0 calc((100% - ${gap * (m - 1)}px) / ${m} - 6px);scroll-snap-align:start}}` : ""}
#${id} .pct-img{transition:transform .5s ease}
${hover === "zoom" ? `#${id} .pct-tile:hover .pct-img{transform:scale(1.07)}` : ""}
${hover === "lift" ? `#${id} .pct-frame{transition:transform .2s ease,box-shadow .2s ease}#${id} .pct-tile:hover .pct-frame{transform:translateY(-4px);box-shadow:0 10px 24px rgba(0,0,0,.12)}` : ""}`;
  const tt = uiText("ecommerce_products", data);
  const labelStyle: React.CSSProperties = {
    fontSize: data.labelSize ?? 13, fontWeight: data.labelWeight ?? 600, color: data.labelColor || undefined,
    textTransform: data.labelCase === "upper" ? "uppercase" : data.labelCase === "capitalize" ? "capitalize" : undefined,
    letterSpacing: data.labelCase === "upper" ? "0.04em" : undefined,
  };
  return (
    <div id={id} className={PADDING[data.sectionPadding ?? "md"]} style={data.backgroundColor ? { backgroundColor: data.backgroundColor } : undefined}>
      <style dangerouslySetInnerHTML={{ __html: strictStyleText(css) }} />
      <div className="max-w-7xl mx-auto px-4">
        {data.title && <h2 className={cn("text-2xl md:text-3xl font-bold m-0 mb-2", ALIGN[data.titleAlignment ?? "center"])}>{data.title}</h2>}
        {data.subtitle && <p className={cn("text-muted-foreground mb-8 text-sm md:text-base", ALIGN[data.titleAlignment ?? "center"])}>{data.subtitle}</p>}
        {!data.subtitle && data.title && <div className="mb-6" />}
        {categories.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">{uiText("ecommerce_products", data)("emptyText")}</p>}
        <div className="pct-grid">
          {categories.map((c) => (
            <Link key={c.id} href={c.href ?? `/shop?category=${c.slug}`} className="pct-tile group flex flex-col items-center text-center min-w-0">
              <div className="pct-frame w-full overflow-hidden" style={{
                aspectRatio: "1 / 1", maxWidth: data.tileMaxWidth ?? 140, borderRadius: radius,
                background: data.tileBg || "hsl(var(--muted))", padding: data.imagePadding ?? 0,
                border: data.tileBorderColor ? `1px solid ${data.tileBorderColor}` : undefined,
              }}>
                {c.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt={c.name} loading="lazy" className="pct-img w-full h-full"
                    style={{ objectFit: data.imageFit ?? "cover", borderRadius: data.imagePadding ? radius : undefined }} />
                )}
              </div>
              <span className="mt-2 leading-tight line-clamp-2" style={labelStyle}>{c.name}</span>
              {data.showCount && <span className="text-[11px] text-muted-foreground mt-0.5">{tt.own("itemLabel") || tt.own("itemsLabel")
                ? `${c.count ?? 0} ${c.count === 1 ? tt("itemLabel") : tt("itemsLabel")}`
                : <>{c.count ?? 0} item{c.count === 1 ? "" : "s"}</>}</span>}
              {data.categoryButtonLabel && data.categoryButtonLabel !== "-" && (
                <span className="mt-2 inline-flex rounded-full px-4 py-1.5 text-[12px]" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>{data.categoryButtonLabel}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

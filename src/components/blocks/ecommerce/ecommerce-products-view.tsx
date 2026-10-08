"use client";

import React from "react";
import type { EcommerceProductsBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ProductCard } from "./product-card";
import { ProductCardMinimal } from "./product-card-minimal";
import { ProductCardWide } from "./product-card-wide";
import type { toProductCardData } from "@/lib/ecommerce/product-card-data";
import { ProductCarousel } from "./product-carousel";

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

export type CategoryTile = { id: string; name: string; slug: string; image_url: string | null };

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
    showAddToCart = true,
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
        <p className="text-center text-muted-foreground py-12">No products available.</p>
      </div>
    );
  }

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
              <ProductCard key={product.id} product={product} showAddToCart={showAddToCart} showDescription={showDescription}
                showBadges={showBadges} cardStyle={cardStyle} imageRatio={imageRatio} />
            ))}
          </ProductCarousel>
        )}

        {(layout === "grid" || !["list", "featured", "minimal", "wide-cards", "carousel"].includes(layout)) && (
          <div className={cn("grid grid-cols-1 gap-6", colMap[columns] ?? colMap[3])}>
            {normalizedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showAddToCart={showAddToCart}
                showDescription={showDescription}
                showBadges={showBadges}
                cardStyle={cardStyle}
                imageRatio={imageRatio}
              />
            ))}
          </div>
        )}

        {/* ── Wide cards (horizontal cards) ── */}
        {layout === "wide-cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {normalizedProducts.map((product) => (
              <ProductCardWide
                key={product.id}
                product={product}
                showAddToCart={showAddToCart}
                showDescription={showDescription}
                cardStyle={cardStyle}
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
              showAddToCart={showAddToCart}
              showDescription={showDescription}
              showBadges={showBadges}
              cardStyle={cardStyle}
              imageRatio="portrait"
              featured
            />
            {/* Side grid */}
            <div className="grid grid-cols-2 gap-4 content-start">
              {normalizedProducts.slice(1).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showAddToCart={showAddToCart}
                  showDescription={false}
                  showBadges={showBadges}
                  cardStyle={cardStyle}
                  imageRatio="square"
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
function CategoryTiles({ data, categories }: { data: EcommerceProductsBlockProps["data"]; categories: CategoryTile[] }) {
  const cols = data.columns ?? 4;
  const grid = cols === 2 ? "sm:grid-cols-2" : cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : cols === 5 ? "sm:grid-cols-3 lg:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div className={PADDING[data.sectionPadding ?? "md"]} style={data.backgroundColor ? { backgroundColor: data.backgroundColor } : undefined}>
      <div className="max-w-7xl mx-auto px-4">
        {data.title && <h2 className={cn("uppercase text-[18px] font-normal m-0 mb-6", ALIGN[data.titleAlignment ?? "center"])}>{data.title}</h2>}
        {data.subtitle && <p className={cn("text-muted-foreground -mt-3 mb-6 text-sm", ALIGN[data.titleAlignment ?? "center"])}>{data.subtitle}</p>}
        {categories.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Pick categories in the block settings.</p>}
        <div className={cn("grid grid-cols-2 gap-x-5 gap-y-8", grid)}>
          {categories.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="group text-center">
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

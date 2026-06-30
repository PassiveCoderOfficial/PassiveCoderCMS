import React from "react";
import { headers } from "next/headers";
import type { EcommerceProductsBlockProps } from "@/types/cms";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ProductCard } from "./product-card";
import { ProductCardMinimal } from "./product-card-minimal";
import { ProductCardWide } from "./product-card-wide";

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

export async function EcommerceProductsBlock({ block }: { block: EcommerceProductsBlockProps }) {
  const { data } = block;
  const {
    title, subtitle, displayCount, layout = "grid", columns = 3,
    sortBy = "latest", showAddToCart = true,
    showDescription = true, showBadges = true,
    cardStyle = "default", imageRatio = "square",
    sectionPadding = "md", backgroundColor,
    titleAlignment = "center", ctaLabel, ctaUrl,
  } = data;

  const supabase = await createClient();
  const tenantId = (await headers()).get("x-tenant-id");
  const orderMap = { latest: "created_at", price_asc: "price", price_desc: "price", featured: "featured" } as const;
  const ascending = sortBy === "price_asc";

  let productsQuery = supabase
    .from("products")
    .select("id, name, slug, price, compare_price, images, short_description, track_inventory, stock_quantity")
    .eq("status", "active")
    .order(orderMap[sortBy] ?? "created_at", { ascending })
    .limit(displayCount);
  if (tenantId) productsQuery = productsQuery.eq("tenant_id", tenantId);
  const { data: products } = await productsQuery;

  if (!products?.length) {
    return (
      <div className={cn("max-w-7xl mx-auto px-4", PADDING[sectionPadding])}>
        {title && <h2 className={cn("text-3xl font-bold mb-10", ALIGN[titleAlignment])}>{title}</h2>}
        <p className="text-center text-muted-foreground py-12">No products available.</p>
      </div>
    );
  }

  const normalizedProducts = products.map((p) => ({
    ...p,
    images: Array.isArray(p.images) ? p.images as string[] : [],
    inStock: !p.track_inventory || p.stock_quantity > 0,
  }));

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
        {(title || subtitle) && (
          <div className={cn("mb-10", ALIGN[titleAlignment])}>
            {title && <h2 className="text-3xl font-bold tracking-tight">{title}</h2>}
            {subtitle && <p className="text-muted-foreground mt-2 text-base">{subtitle}</p>}
          </div>
        )}

        {/* ── Grid layout (default) ── */}
        {(layout === "grid" || layout === "wide-cards") && layout !== "wide-cards" && (
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

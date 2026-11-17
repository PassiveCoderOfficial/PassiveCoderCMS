import React from "react";
import { headers } from "next/headers";
import type { EcommerceProductsBlockProps } from "@/types/cms";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { EcommerceProductsView, countByCategory, type CategoryTile } from "./ecommerce-products-view";
import { ProductCardMinimal } from "./product-card-minimal";
import { ProductCardWide } from "./product-card-wide";
import { PRODUCT_CARD_SELECT, cardMapper, inStockFirst, previewProductCards, toProductCardData, type PreviewProduct } from "@/lib/ecommerce/product-card-data";
import { renderLang } from "@/lib/collections/render";
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

export async function EcommerceProductsBlock({ block }: { block: EcommerceProductsBlockProps }) {
  const { data } = block;
  const {
    title, subtitle, layout = "grid", columns = 3,
    sortBy = "latest", showAddToCart = true,
    showDescription = true, showBadges = true,
    cardStyle = "default", imageRatio = "square",
    sectionPadding = "md", backgroundColor,
    titleAlignment = "center", ctaLabel, ctaUrl,
  } = data;
  // Old blocks may lack displayCount; guard against .limit(undefined) → 0 rows.
  const displayCount = data.displayCount && data.displayCount > 0 ? data.displayCount : 8;

  const supabase = await createClient();
  const tenantId = (await headers()).get("x-tenant-id");
  // No site (template preview): show the template's sample products, never
  // other stores' real catalogue.
  if (!tenantId) {
    const samples = (data as { previewProducts?: PreviewProduct[] }).previewProducts;
    if (data.showAs === "categories") return <EcommerceProductsView data={data} products={[]} categories={[]} />;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <EcommerceProductsView data={data} products={previewProductCards(samples, displayCount) as any} />;
  }
  const orderMap = { latest: "created_at", price_asc: "price", price_desc: "price", featured: "featured" } as const;
  const ascending = sortBy === "price_asc";

  // Category filter — products.category_ids is a jsonb array, so match products
  // whose array contains ANY of the selected ids. Falls back to the legacy
  // single-category field. Empty/unset = all categories.
  const selectedCategories = data.categoryIds?.length
    ? data.categoryIds
    : data.categoryId
      ? [data.categoryId]
      : [];

  let productsQuery = supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("status", "active")
    .order(orderMap[sortBy] ?? "created_at", { ascending })
    .limit(displayCount);
  productsQuery = productsQuery.eq("tenant_id", tenantId);
  if (selectedCategories.length > 0) {
    productsQuery = productsQuery.or(
      selectedCategories.map((id) => `category_ids.cs.["${id}"]`).join(","),
    );
  }
  const { data: products } = await productsQuery;
  // On a language version (/ar page) cards and tiles use that language's
  // names and link to its own product and shop pages.
  const lang = renderLang();
  if (data.showAs === "categories") {
    let cq = supabase.from("categories").select("id, name, slug, image_url, translations").eq("type", "product").order("order_index");
    cq = cq.eq("tenant_id", tenantId);
    if (selectedCategories.length) cq = cq.in("id", selectedCategories);
    const { data: cats } = await cq;
    let ordered = (selectedCategories.length ? selectedCategories.map((id) => (cats ?? []).find((c) => c.id === id)).filter(Boolean) : cats ?? []) as CategoryTile[];
    if (data.showCount) {
      const { data: rows } = await supabase.from("products").select("category_ids").eq("tenant_id", tenantId).eq("status", "active");
      const counts = countByCategory(rows);
      ordered = ordered.map((c) => ({ ...c, count: counts[c.id] ?? 0 }));
    }
    // Per-block names (e.g. a translated page) win over the category's own
    // translation, which wins over its main-language name.
    const names = data.categoryNames;
    ordered = ordered.map((c) => {
      const { translations, ...tile } = c as CategoryTile & { translations?: Record<string, { name?: string }> | null };
      const name = names?.[c.id]?.trim() || (lang ? translations?.[lang]?.name?.trim() : "") || c.name;
      return { ...tile, name, ...(lang ? { href: `/${lang}/shop?category=${c.slug}` } : {}) };
    });
    return <EcommerceProductsView data={data} products={[]} categories={ordered} />;
  }
  return <EcommerceProductsView data={data} products={inStockFirst((products ?? []).map(lang ? cardMapper(lang) : toProductCardData))} />;
}

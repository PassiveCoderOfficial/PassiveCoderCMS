"use client";

import React, { useEffect, useState } from "react";
import type { EcommerceProductsBlockProps } from "@/types/cms";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import { PRODUCT_CARD_SELECT, toProductCardData } from "@/lib/ecommerce/product-card-data";
import { EcommerceProductsView, countByCategory, type CategoryTile } from "./ecommerce-products-view";

type Loaded = { products: ReturnType<typeof toProductCardData>[]; cats: CategoryTile[] };

/**
 * One load per query, shared for a minute: the canvas block and the Layout
 * picker's previews of it (the same products in every layout) reuse one
 * request instead of each firing their own. The query does not depend on
 * the layout, so every preview hits the canvas's entry.
 */
const loads = new Map<string, { at: number; p: Promise<Loaded> }>();

async function loadProducts(d: EcommerceProductsBlockProps["data"]): Promise<Loaded> {
  const tid = await getClientTenantId();
  const sb = createClient();
  const sel = d.categoryIds?.length ? d.categoryIds : d.categoryId ? [d.categoryId] : [];
  if (d.showAs === "categories") {
    let q = sb.from("categories").select("id, name, slug, image_url").eq("type", "product").order("order_index");
    if (tid) q = q.eq("tenant_id", tid);
    if (sel.length) q = q.in("id", sel);
    const { data } = await q;
    let list = (sel.length ? sel.map((id) => (data ?? []).find((c) => c.id === id)).filter(Boolean) : data ?? []) as CategoryTile[];
    if (d.showCount) {
      let pq = sb.from("products").select("category_ids").eq("status", "active");
      if (tid) pq = pq.eq("tenant_id", tid);
      const counts = countByCategory((await pq).data);
      list = list.map((c) => ({ ...c, count: counts[c.id] ?? 0 }));
    }
    return { cats: list, products: [] };
  }
  const orderMap = { latest: "created_at", price_asc: "price", price_desc: "price", featured: "featured" } as const;
  let q = sb.from("products").select(PRODUCT_CARD_SELECT).eq("status", "active")
    .order(orderMap[d.sortBy ?? "latest"] ?? "created_at", { ascending: d.sortBy === "price_asc" }).limit(d.displayCount > 0 ? d.displayCount : 8);
  if (tid) q = q.eq("tenant_id", tid);
  if (sel.length) q = q.or(sel.map((id) => `category_ids.cs.["${id}"]`).join(","));
  const { data } = await q;
  return { cats: [], products: (data ?? []).map(toProductCardData) };
}

/** Page-builder canvas version of the products block: same markup, data loaded in the browser. */
export function EcommerceProductsPreview({ block }: { block: EcommerceProductsBlockProps }) {
  const d = block.data;
  const [products, setProducts] = useState<ReturnType<typeof toProductCardData>[] | null>(null);
  const [cats, setCats] = useState<CategoryTile[]>([]);
  const key = JSON.stringify([d.showAs, d.categoryIds, d.categoryId, d.sortBy, d.displayCount, d.showCount]);
  useEffect(() => {
    let off = false;
    let hit = loads.get(key);
    if (!hit || Date.now() - hit.at > 60_000) {
      hit = { at: Date.now(), p: loadProducts(d) };
      loads.set(key, hit);
      // A failed load is not kept, so the next mount tries again.
      hit.p.catch(() => loads.delete(key));
    }
    hit.p.then((r) => {
      if (off) return;
      // Same order of updates as before: categories first, then products.
      if (d.showAs === "categories") setCats(r.cats);
      setProducts(r.products);
    }, () => {});
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!products) return <div className="h-40 animate-pulse bg-muted/40 rounded" />;
  return <div className="pointer-events-none"><EcommerceProductsView data={d} products={products} categories={cats} /></div>;
}

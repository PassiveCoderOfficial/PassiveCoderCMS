"use client";

import React, { useEffect, useState } from "react";
import type { EcommerceProductsBlockProps } from "@/types/cms";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import { PRODUCT_CARD_SELECT, toProductCardData } from "@/lib/ecommerce/product-card-data";
import { EcommerceProductsView, type CategoryTile } from "./ecommerce-products-view";

/** Page-builder canvas version of the products block: same markup, data loaded in the browser. */
export function EcommerceProductsPreview({ block }: { block: EcommerceProductsBlockProps }) {
  const d = block.data;
  const [products, setProducts] = useState<ReturnType<typeof toProductCardData>[] | null>(null);
  const [cats, setCats] = useState<CategoryTile[]>([]);
  const key = JSON.stringify([d.showAs, d.categoryIds, d.categoryId, d.sortBy, d.displayCount]);
  useEffect(() => {
    let off = false;
    (async () => {
      const tid = await getClientTenantId();
      const sb = createClient();
      const sel = d.categoryIds?.length ? d.categoryIds : d.categoryId ? [d.categoryId] : [];
      if (d.showAs === "categories") {
        let q = sb.from("categories").select("id, name, slug, image_url").eq("type", "product").order("order_index");
        if (tid) q = q.eq("tenant_id", tid);
        if (sel.length) q = q.in("id", sel);
        const { data } = await q;
        if (!off) setCats(sel.length ? sel.map((id) => (data ?? []).find((c) => c.id === id)).filter(Boolean) as CategoryTile[] : (data ?? []) as CategoryTile[]);
        if (!off) setProducts([]);
        return;
      }
      const orderMap = { latest: "created_at", price_asc: "price", price_desc: "price", featured: "featured" } as const;
      let q = sb.from("products").select(PRODUCT_CARD_SELECT).eq("status", "active")
        .order(orderMap[d.sortBy ?? "latest"] ?? "created_at", { ascending: d.sortBy === "price_asc" }).limit(d.displayCount > 0 ? d.displayCount : 8);
      if (tid) q = q.eq("tenant_id", tid);
      if (sel.length) q = q.or(sel.map((id) => `category_ids.cs.["${id}"]`).join(","));
      const { data } = await q;
      if (!off) setProducts((data ?? []).map(toProductCardData));
    })();
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!products) return <div className="h-40 animate-pulse bg-muted/40 rounded" />;
  return <div className="pointer-events-none"><EcommerceProductsView data={d} products={products} categories={cats} /></div>;
}

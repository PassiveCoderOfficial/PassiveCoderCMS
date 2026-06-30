import React from "react";
import { headers } from "next/headers";
import type { EcommerceProductsBlockProps } from "@/types/cms";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";

export async function EcommerceProductsBlock({ block }: { block: EcommerceProductsBlockProps }) {
  const { data } = block;
  const { title, displayCount, layout, columns, sortBy, showAddToCart } = data;

  const supabase = await createClient();
  const tenantId = (await headers()).get("x-tenant-id");
  const orderMap = { latest: "created_at", price_asc: "price", price_desc: "price", featured: "featured" } as const;
  const ascending = sortBy === "price_asc";

  let productsQuery = supabase
    .from("products")
    .select("id, name, slug, price, compare_price, images, short_description")
    .eq("status", "active")
    .order(orderMap[sortBy] ?? "created_at", { ascending })
    .limit(displayCount);
  if (tenantId) productsQuery = productsQuery.eq("tenant_id", tenantId);
  const { data: products } = await productsQuery;

  const colMap = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[columns] ?? "md:grid-cols-4";

  void layout; // layout prop reserved for future list/grid toggle

  return (
    <div className="max-w-7xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-center mb-10">{title}</h2>}
      {!products?.length ? (
        <p className="text-center text-muted-foreground py-12">No products available.</p>
      ) : (
        <div className={cn("grid grid-cols-1 gap-6", colMap)}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                images: Array.isArray(product.images) ? product.images as string[] : [],
              }}
              showAddToCart={showAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

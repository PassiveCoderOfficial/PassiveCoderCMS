import React from "react";
import { headers } from "next/headers";
import type { EcommerceProductsBlockProps } from "@/types/cms";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

  return (
    <div className="max-w-7xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-center mb-10">{title}</h2>}
      {!products?.length ? (
        <p className="text-center text-muted-foreground py-12">No products available.</p>
      ) : (
        <div className={cn("grid grid-cols-1 gap-6", colMap)}>
          {products.map((product) => {
            const images = Array.isArray(product.images) ? product.images : [];
            const firstImage = images[0] as string | undefined;
            return (
              <div key={product.id} className="group border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white">
                <Link href={`/shop/${product.slug}`}>
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    {firstImage ? (
                      <Image src={firstImage} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingCart className="h-12 w-12" />
                      </div>
                    )}
                    {product.compare_price && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        Sale
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/shop/${product.slug}`}>
                    <h3 className="font-semibold text-sm leading-snug hover:text-primary transition-colors">{product.name}</h3>
                  </Link>
                  {product.short_description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.short_description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{formatCurrency(product.price)}</span>
                      {product.compare_price && (
                        <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.compare_price)}</span>
                      )}
                    </div>
                    {showAddToCart && (
                      <button className="flex items-center gap-1 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">
                        <ShoppingCart className="h-3 w-3" /> Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

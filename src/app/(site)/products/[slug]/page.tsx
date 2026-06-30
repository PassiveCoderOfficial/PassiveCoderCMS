import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { AddToCartSection } from "./add-to-cart-section";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  const supabase = await createClient();
  let q = supabase.from("products").select("name, short_description").eq("slug", slug).eq("status", "active");
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data } = await q.maybeSingle();

  if (!data) return { title: "Product Not Found" };
  return {
    title: data.name,
    description: data.short_description ?? undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  const supabase = await createClient();
  let q = supabase.from("products").select("*").eq("slug", slug).eq("status", "active");
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data: product } = await q.maybeSingle();

  if (!product) notFound();

  const images: string[] = Array.isArray(product.images) ? product.images : [];
  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.price);
  const comparePrice = product.compare_price
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.compare_price)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          {images.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[0]}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-xl border"
              />
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(1).map((img: string, i: number) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={img}
                      alt={`${product.name} ${i + 2}`}
                      className="aspect-square object-cover rounded-lg border"
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full aspect-square bg-muted rounded-xl border flex items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.short_description && (
              <p className="text-muted-foreground mt-1 text-sm">{product.short_description}</p>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{price}</span>
            {comparePrice && (
              <span className="text-lg text-muted-foreground line-through">{comparePrice}</span>
            )}
          </div>

          {product.stock_quantity !== null && product.stock_quantity !== undefined && (
            <div>
              {product.stock_quantity === 0 ? (
                <span className="text-sm font-medium text-red-600">Out of stock</span>
              ) : product.stock_quantity <= 5 ? (
                <span className="text-sm font-medium text-amber-600">Only {product.stock_quantity} left in stock</span>
              ) : (
                <span className="text-sm text-green-700">In stock</span>
              )}
            </div>
          )}

          {/* Add to Cart — client interactive section */}
          <AddToCartSection
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              image: images[0] ?? null,
              inStock: product.stock_quantity === null || product.stock_quantity > 0,
            }}
          />

          {product.description && (
            <div>
              <h2 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Description</h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{product.description}</div>
            </div>
          )}

          {product.sku && (
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

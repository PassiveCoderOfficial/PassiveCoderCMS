"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";
import { toast } from "sonner";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_price: number | null;
    images: string[];
    short_description?: string | null;
  };
  showAddToCart?: boolean;
}

export function ProductCard({ product, showAddToCart }: ProductCardProps) {
  const { addItem, openCart } = useCart();
  const firstImage = product.images[0] as string | undefined;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: firstImage,
      quantity: 1,
    });
    toast.success(`${product.name} added to cart`, {
      action: { label: "View Cart", onClick: openCart },
    });
  }

  return (
    <div className="group border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white">
      <Link href={`/products/${product.slug}`}>
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
        <Link href={`/products/${product.slug}`}>
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
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ShoppingCart className="h-3 w-3" /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

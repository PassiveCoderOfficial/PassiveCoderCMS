"use client";

import React from "react";
import { Package } from "lucide-react";
import { useEcommerceCurrency } from "@/lib/hooks/use-ecommerce-currency";
import type { CartItem } from "@/types/cms";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
}

export function OrderSummary({ items, subtotal, shipping_cost, tax, total }: OrderSummaryProps) {
  const { format } = useEcommerceCurrency();

  return (
    <section className="border rounded-xl p-6 space-y-4">
      <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Items Ordered</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg border overflow-hidden bg-muted shrink-0">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">{item.name}</p>
              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
            </div>
            <span className="text-sm font-semibold shrink-0">{format(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{format(subtotal)}</span>
        </div>
        {shipping_cost > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{format(shipping_cost)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{format(tax)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
          <span>Total</span>
          <span>{format(total)}</span>
        </div>
      </div>
    </section>
  );
}

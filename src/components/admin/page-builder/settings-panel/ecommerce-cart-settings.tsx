"use client";

import React from "react";
import Link from "next/link";
import type { EcommerceCartBlockProps } from "@/types/cms";

/**
 * The cart block draws nothing on the page: the cart is the site-wide drawer
 * opened from the header cart icon (page-renderer.tsx: "cart is injected by
 * layout"). The title / summary / coupon / layout switches this panel used
 * to show were never read by anything, so they are gone; this says where the
 * cart is set up instead.
 */
export function EcommerceCartSettings({ block }: { block: EcommerceCartBlockProps }) {
  void block;
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground">
      <p>This block shows nothing on the page. Visitors open the cart from the header cart icon (add a Cart button in the header builder), and it can be removed from this page.</p>
      <p>
        Checkout, delivery charges, payment methods and coupons are set in{" "}
        <Link href="/dashboard/ecommerce/settings" className="underline">Dashboard &gt; Shop &gt; Settings</Link>,{" "}
        <Link href="/dashboard/ecommerce/delivery" className="underline">Delivery</Link>,{" "}
        <Link href="/dashboard/ecommerce/payments" className="underline">Payments</Link> and{" "}
        <Link href="/dashboard/ecommerce/promotions" className="underline">Promotions</Link>.
      </p>
    </div>
  );
}

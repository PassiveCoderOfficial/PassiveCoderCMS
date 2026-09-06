"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import type { HeaderCartBlockProps } from "@/types/cms";

/**
 * Independent header sub-block: the cart icon + badge, extracted from what
 * used to be a fixed part of the navigation block (its `showCart` field).
 * Registry entry gates this with moduleKey: "ecommerce" so the block picker
 * hides it entirely when the tenant has no ecommerce module — see
 * project_block_editor_bugs memory for why this is a picker-level gate here
 * rather than a runtime check: BlockDefinition.moduleKey is the existing,
 * already-wired mechanism (blocks-panel.tsx filters by it), so this needed
 * no new plumbing.
 *
 * Client component (needs live cart state) but no server data fetch, so one
 * shared file for editor canvas and published site, same as most other
 * simple blocks.
 */
export function HeaderCartBlock({ block }: { block: HeaderCartBlockProps }) {
  const { itemCount, openCart } = useCart();
  const showLabel = block.data.showLabel ?? false;

  return (
    <button
      onClick={openCart}
      className="relative flex items-center gap-1.5 p-2 rounded-lg hover:bg-current/10 transition-colors shrink-0"
      aria-label="Open cart"
    >
      <ShoppingCart className="h-5 w-5" />
      {showLabel && <span className="text-sm font-medium">Cart</span>}
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}

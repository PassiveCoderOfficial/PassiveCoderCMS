"use client";

/**
 * Independent header sub-block: just the nav links (dropdown, mega-menu,
 * mobile menu) — no logo, no CTA, no cart, all of which are now separate
 * header sub-blocks. Reuses the exact same menu-rendering core the legacy
 * navigation block uses (see nav-menu-core.tsx) so this is a real, full-
 * parity nav menu on day one, not a stripped-down version — the two blocks
 * differ only in what surrounds the menu, not in how the menu itself works.
 *
 * menuLocation resolution and dynamic-children expansion (services,
 * product_categories, etc) happen server-side in resolveNavBlocks
 * (page-renderer.tsx), same pass that already resolves the legacy nav block
 * — this component receives `items` already resolved, same contract.
 */
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeaderNavBlockProps } from "@/types/cms";
import { NavItemDesktop, MobileNavList } from "../navigation/nav-menu-core";

export function HeaderNavBlock({ block }: { block: HeaderNavBlockProps }) {
  const { data } = block;
  const { items, style, textColor } = data;
  const [mobileOpen, setMobileOpen] = useState(false);
  const fg = textColor ?? "hsl(var(--foreground))";

  return (
    <div className="relative flex items-center flex-1 min-w-0">
      <ul className={cn(
        "hidden md:flex items-center gap-0.5",
        style === "centered" ? "mx-auto" : "flex-1",
      )}>
        {items.map((item) => (
          <NavItemDesktop key={item.id} item={item} currentColor={fg} />
        ))}
      </ul>

      {/* Mobile toggle — this block owns its own mobile menu since it's the
          only place nav links live now that logo/CTA/cart are separate
          blocks; a header container arranges this alongside them. */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-current/10 transition-colors ml-auto"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{ color: fg }}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 top-[4.5rem] bg-black/40 z-40 animate-in fade-in" onClick={() => setMobileOpen(false)} />
          {/* fixed to the viewport, not absolute to this block's own column —
              this block is now one narrow column inside a header container
              (alongside header_logo/header_cta), not the full-width <nav>
              the legacy block was. absolute left-0 right-0 here would only
              span this column's own width, producing a narrow floating box
              instead of a full-width drawer — found live on a real tenant
              after the navigation->sub-block migration (2026-09-06). */}
          <div className="md:hidden fixed left-0 right-0 top-[4.5rem] z-50 border-t border-border shadow-2xl animate-in slide-in-from-top-2 duration-200" style={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}>
            <MobileNavList items={items} onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}

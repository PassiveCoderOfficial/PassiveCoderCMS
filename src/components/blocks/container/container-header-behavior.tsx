"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Sticky/transparent-overlay behavior for a container used as a site header.
 *
 * Extracted as its own small client component (2026-09-06) rather than
 * making the whole ContainerBlock a client component — most containers are
 * ordinary page content with none of these fields set, and don't need a
 * scroll listener or client JS at all. Only a container actually configured
 * as a header pays for this.
 *
 * Mirrors navigation-block.tsx's overlayHero logic exactly, since this
 * exists specifically so migrating a tenant's navigation block into a
 * container of header sub-blocks doesn't lose that visual behavior.
 */
export function ContainerHeaderBehavior({
  sticky, scrollAware, transparent, glass, children,
}: {
  sticky?: boolean;
  scrollAware?: boolean;
  transparent?: boolean;
  glass?: boolean;
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);
  const overlayHero = scrollAware ?? transparent;

  useEffect(() => {
    if (!overlayHero) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlayHero]);

  const solid = !overlayHero || scrolled;

  return (
    <div
      className={cn(
        "relative w-full z-50 transition-all duration-300",
        overlayHero ? "fixed top-0 left-0 right-0" : sticky && "sticky top-0",
        solid && "border-b border-border/60",
        solid && glass && "backdrop-blur-xl",
      )}
      style={{
        background: !solid ? "transparent" : glass ? "hsl(var(--background) / 0.88)" : "hsl(var(--background))",
        color: solid ? "hsl(var(--foreground))" : "#ffffff",
        boxShadow: solid ? "var(--shadow-sm)" : undefined,
      }}
    >
      {children}
    </div>
  );
}

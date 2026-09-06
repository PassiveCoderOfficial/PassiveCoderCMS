"use client";

import React, { useState, useEffect } from "react";
import type { NavigationBlockProps } from "@/types/cms";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";
import { BrandLogo } from "@/components/site/brand-logo";
import { NavItemDesktop, MobileNavList } from "./nav-menu-core";

// Dropdown/mega-menu, desktop item, and mobile-drawer rendering moved to
// ./nav-menu-core.tsx (2026-09-06) — shared with the new independent
// header_nav sub-block so there's one implementation of menu rendering, not
// two that quietly drift apart. This file still owns logo/CTA/cart, which
// header_nav deliberately does NOT (those are now separate header
// sub-blocks) — see project_block_editor_bugs memory.

export function NavigationBlock({ block, identityLogo }: {
  block: NavigationBlockProps;
  identityLogo?: string | null;
  identityLogoDark?: string | null;
}) {
  const { data } = block;
  const {
    logoText, logoUrl, items, sticky, transparent, style,
    backgroundColor, textColor, activeColor,
    logoHeight, showCta, ctaLabel, ctaUrl,
    colorMode, scrollAware, glass, ctaVariant, secondaryCtaLabel, secondaryCtaUrl,
    floating, showCart, logoCaption,
  } = data;
  const logo = data.logo || identityLogo || null;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { itemCount, openCart } = useCart();

  const tokenMode = colorMode !== "legacy"; // default to modern token mode
  const overlayHero = scrollAware ?? transparent; // scroll-aware implies transparent-at-top

  useEffect(() => {
    if (!overlayHero) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlayHero]);

  // Solid = not in transparent-over-hero state.
  const solid = !overlayHero || scrolled;
  const logoH = logoHeight ?? 34;

  // Colors are token-driven so each tenant's own template palette /
  // color_overrides drive the nav — never hardcode a brand hex here, it
  // would leak one client's brand onto every other tenant's site.
  // activeColor/backgroundColor block props still override the tokens.
  const BRAND_PRIMARY = "hsl(var(--primary))";
  const barBg = !solid
    ? "transparent"
    : tokenMode
      ? (glass ? "hsl(var(--background) / 0.88)" : "hsl(var(--background))")
      : (backgroundColor ?? "hsl(var(--secondary))");
  const fg = !solid
    ? "#ffffff"
    : tokenMode ? "hsl(var(--foreground))" : (textColor ?? "#ffffff");
  const accent = activeColor ?? (tokenMode ? BRAND_PRIMARY : fg);

  const ctaV = ctaVariant ?? "gradient";
  // No display class here — each call site sets its own responsive display
  // (e.g. "hidden md:inline-flex"). Including `inline-flex` made tailwind-merge
  // drop the `hidden`, so the desktop CTA rendered on mobile and overflowed
  // the header.
  const ctaClasses = "items-center px-5 py-2.5 text-[0.9rem] font-semibold rounded-full transition-all hover:-translate-y-0.5";
  const ctaShadow = "0 8px 20px -6px hsl(var(--primary) / 0.45)";
  const ctaStyleObj: React.CSSProperties =
    ctaV === "outline"
      ? { background: "transparent", color: solid ? accent : "#fff", border: `1.5px solid ${solid ? BRAND_PRIMARY : "rgba(255,255,255,0.6)"}` }
      : ctaV === "solid"
        ? { background: BRAND_PRIMARY, color: "hsl(var(--primary-foreground))", boxShadow: ctaShadow }
        : { backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%))", color: "hsl(var(--primary-foreground))", boxShadow: ctaShadow };

  // Overlay mode (scrollAware): the bar is FIXED across the top so it floats
  // over the hero instead of consuming layout height above it (which caused an
  // ugly white strip). It stays fixed and just swaps transparent → solid/glass
  // on scroll — no layout jump. Pages using this must open with a full-height
  // hero (content flows under the fixed bar), which every marketplace page does.
  // Non-overlay navs stay plain sticky in flow.
  return (
    <nav
      className={cn(
        "relative w-full z-50 transition-all duration-300",
        overlayHero ? "fixed top-0 left-0 right-0" : sticky && "sticky top-0",
        solid && !floating && "border-b border-border/60",
        solid && glass && "backdrop-blur-xl",
      )}
      style={{
        background: floating || !solid ? "transparent" : barBg,
        color: fg,
        boxShadow: solid && !floating ? "var(--shadow-sm)" : undefined,
      }}
    >
      <div className={cn("mx-auto px-4 sm:px-6", floating ? "max-w-6xl pt-3" : "max-w-7xl")}>
        <div
          className={cn(
            "flex items-center h-[4.5rem] gap-4 transition-all",
            floating && solid && "rounded-2xl px-5 border border-border/60 h-16 backdrop-blur-xl",
            style === "centered" && "justify-between",
          )}
          style={floating && solid ? { background: glass ? "hsl(var(--card) / 0.8)" : "hsl(var(--card))", boxShadow: "var(--shadow-md)" } : undefined}
        >
          {/* Logo */}
          <Link href={logoUrl ?? "/"} className="flex items-center gap-2 shrink-0">
            {logo ? (
              <Image src={logo} alt={logoText ?? "Logo"} width={logoH * 3.4} height={logoH} style={{ height: logoH }} className="w-auto object-contain" />
            ) : data.useBrandMark ? (
              <BrandLogo
                size={logoH}
                text={logoText ?? "Brand"}
                textColor={fg}
                // SVG fills need a literal color — hsl(var(--x)) doesn't
                // resolve reliably as an SVG attribute. Use the block's
                // explicit activeColor when set, else BrandLogo's default.
                {...(activeColor ? { color: activeColor } : {})}
              />
            ) : (
              <span className="text-[1.15rem] font-extrabold tracking-tight" style={{ color: fg, fontFamily: "var(--heading-font, inherit)" }}>
                {logoText ?? "Brand"}
              </span>
            )}
            {logoCaption && (
              <span className="hidden sm:inline text-[0.68rem] leading-tight opacity-60 border-l pl-2 ml-0.5" style={{ color: fg, borderColor: fg }}>
                {logoCaption}
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          <ul className={cn(
            "hidden md:flex items-center gap-0.5",
            style === "centered" ? "mx-auto" : "ml-4 flex-1",
          )}>
            {items.map((item) => (
              <NavItemDesktop key={item.id} item={item} currentColor={fg} />
            ))}
          </ul>

          {/* Right cluster */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {secondaryCtaLabel && secondaryCtaUrl && (
              <Link href={secondaryCtaUrl} className="hidden lg:inline-flex items-center px-3.5 py-2 text-[0.9rem] font-medium rounded-lg transition-colors hover:bg-current/5" style={{ color: fg, opacity: 0.85 }}>
                {secondaryCtaLabel}
              </Link>
            )}
            {showCta && ctaLabel && ctaUrl && (
              <Link href={ctaUrl} className={cn("hidden md:inline-flex", ctaClasses)} style={ctaStyleObj}>
                {ctaLabel}
              </Link>
            )}

            {showCart !== false && (
              <button
                onClick={openCart}
                className="relative p-2 rounded-lg hover:bg-current/10 transition-colors shrink-0"
                style={{ color: fg }}
                aria-label="Open cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none" style={{ background: BRAND_PRIMARY }}>
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-current/10 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ color: fg }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 top-[4.5rem] bg-black/40 z-40 animate-in fade-in" onClick={() => setMobileOpen(false)} />
          <div className="md:hidden absolute left-0 right-0 top-full z-50 border-t border-border shadow-2xl animate-in slide-in-from-top-2 duration-200" style={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}>
            <MobileNavList
              items={items}
              onNavigate={() => setMobileOpen(false)}
              extraFooter={
                (showCta && ctaLabel && ctaUrl) || (secondaryCtaLabel && secondaryCtaUrl) ? (
                  <>
                    {showCta && ctaLabel && ctaUrl && (
                      <Link href={ctaUrl} className="flex items-center justify-center px-4 py-3 rounded-full text-[0.95rem] font-semibold" style={{ backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%))", color: "hsl(var(--primary-foreground))", boxShadow: "0 8px 20px -6px hsl(var(--primary) / 0.45)" }} onClick={() => setMobileOpen(false)}>
                        {ctaLabel}
                      </Link>
                    )}
                    {secondaryCtaLabel && secondaryCtaUrl && (
                      <Link href={secondaryCtaUrl} className="flex items-center justify-center px-4 py-3 rounded-full text-[0.95rem] font-medium border border-border text-foreground" onClick={() => setMobileOpen(false)}>
                        {secondaryCtaLabel}
                      </Link>
                    )}
                  </>
                ) : undefined
              }
            />
          </div>
        </>
      )}
    </nav>
  );
}

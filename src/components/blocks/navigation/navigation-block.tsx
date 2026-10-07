"use client";
import { NavTopBar } from "./nav-top-bar";

import React, { useState, useEffect } from "react";
import type { NavigationBlockProps } from "@/types/cms";
import Link from "next/link";
import Image from "@/components/ui/smart-image";
import { Menu, X, ShoppingCart, Search, User, Truck } from "lucide-react";
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
    logoHeight, showCta, ctaLabel, ctaUrl, showBooking, bookingLabel, bookingUrl,
    colorMode, scrollAware, glass, ctaVariant, secondaryCtaLabel, secondaryCtaUrl,
    floating, showCart, logoCaption,
    showSearch, searchPlaceholder, searchButtonLabel, showAccount, trackOrderUrl, topRowBackground, menuUppercase,
    searchStyle, menuRowBackground,
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
  // "logo-center": logo sits in the middle of the top row, menu on its own
  // centered row underneath (desktop). Mobile keeps logo centered + toggle right.
  const logoCenter = style === "logo-center";

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
  // Built after `fg` exists — referencing it earlier is a TDZ crash that
  // takes down every site header (happened in v1.0.442).
  const desktopItems = items.map((item) => (
    <NavItemDesktop key={item.id} item={item} currentColor={fg} />
  ));

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
  const showTopBar = !!block.data.topBar && block.data.topBar.show !== false && !overlayHero;
  return (
    <>
    {showTopBar && <NavTopBar bar={block.data.topBar!} />}
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
      <div className={cn("mx-auto", floating ? "max-w-6xl pt-3 px-4 sm:px-6" : logoCenter && topRowBackground ? "" : "max-w-7xl px-4 sm:px-6")}>
        <div
          className={cn(
            logoCenter
              ? "grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-3 min-h-[4.5rem] transition-all"
              : "flex items-center h-[4.5rem] gap-4 transition-all",
            floating && solid && "rounded-2xl px-5 border border-border/60 h-16 backdrop-blur-xl",
            style === "centered" && "justify-between",
          )}
          style={floating && solid
            ? { background: glass ? "hsl(var(--card) / 0.8)" : "hsl(var(--card))", boxShadow: "var(--shadow-md)" }
            : logoCenter && topRowBackground
              // Full-bleed band; the padding keeps content on the same 80rem column as the menu row.
              ? { background: topRowBackground, paddingInline: "max(1rem, calc((100% - 80rem) / 2 + 1.5rem))" }
              : undefined}
        >
          {logoCenter && (showSearch ? searchStyle === "plain" ? (
            // Plain: magnifier + borderless field, no button (Enter searches).
            <form action="/shop" role="search" className="hidden md:flex items-center max-w-[22rem] w-full gap-3">
              <Search className="h-6 w-6 shrink-0" style={{ color: fg }} />
              <input name="q" placeholder={searchPlaceholder || "Search products"} aria-label="Search products"
                className="flex-1 min-w-0 bg-transparent text-[0.95rem] outline-none placeholder:opacity-80" style={{ color: fg }} />
            </form>
          ) : (
            <form action="/shop" role="search" className="hidden md:flex items-center max-w-[24rem] w-full rounded-full bg-white border border-black/10 pl-4 pr-1 py-1 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-neutral-500" />
              <input name="q" placeholder={searchPlaceholder || "Search products"} aria-label="Search products"
                className="flex-1 min-w-0 bg-transparent px-2.5 text-[0.9rem] text-neutral-800 placeholder:text-neutral-500 outline-none" />
              <button className="rounded-full px-5 py-2 text-[0.78rem] font-semibold uppercase tracking-wide" style={{ background: BRAND_PRIMARY, color: "hsl(var(--primary-foreground))" }}>
                {searchButtonLabel || "Search"}
              </button>
            </form>
          ) : <div aria-hidden />)}
          {logoCenter && showSearch && <div aria-hidden className="md:hidden" />}
          {/* Logo */}
          <Link href={logoUrl ?? "/"} className={cn("flex items-center gap-2 shrink-0", logoCenter && "justify-self-center")}>
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
              <>
              {data.logoIconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.logoIconUrl} alt="" style={{ height: logoH, width: "auto" }} className="shrink-0 object-contain" />
              )}
              <span className="text-[1.15rem] font-extrabold tracking-tight" style={{ color: fg, fontFamily: "var(--heading-font, inherit)" }}>
                {logoText ?? "Brand"}
              </span>
              </>
            )}
            {logoCaption && (
              <span className="hidden sm:inline text-[0.68rem] leading-tight opacity-60 border-l pl-2 ml-0.5" style={{ color: fg, borderColor: fg }}>
                {logoCaption}
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          {!logoCenter && (
            <ul className={cn(
              "hidden md:flex items-center gap-0.5",
              style === "centered" ? "mx-auto" : "ml-4 flex-1",
            )}>
              {desktopItems}
            </ul>
          )}

          {/* Right cluster */}
          <div className={cn("flex items-center gap-2 shrink-0", logoCenter ? "justify-self-end" : "ml-auto")}>
            {secondaryCtaLabel && secondaryCtaUrl && (
              <Link href={secondaryCtaUrl} className="hidden lg:inline-flex items-center px-3.5 py-2 text-[0.9rem] font-medium rounded-lg transition-colors hover:bg-current/5" style={{ color: fg, opacity: 0.85 }}>
                {secondaryCtaLabel}
              </Link>
            )}
            {showCta && ctaLabel && ctaUrl && !(showBooking && ctaUrl === (bookingUrl || "/book")) && (
              <Link href={ctaUrl} className={cn("hidden md:inline-flex", ctaClasses)} style={ctaStyleObj}>
                {ctaLabel}
              </Link>
            )}
            {showBooking && (
              <Link href={bookingUrl || "/book"} className={cn("hidden md:inline-flex", ctaClasses)} style={ctaStyleObj}>
                {bookingLabel || "Book now"}
              </Link>
            )}

            {showAccount && (
              <Link href="/account" aria-label="My account" className="p-2 rounded-lg hover:bg-current/10 transition-colors" style={{ color: fg }}>
                <User className="h-5 w-5" />
              </Link>
            )}
            {trackOrderUrl && (
              <Link href={trackOrderUrl} aria-label="Track your order" className="hidden sm:inline-flex p-2 rounded-lg hover:bg-current/10 transition-colors" style={{ color: fg }}>
                <Truck className="h-5 w-5" />
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
        {logoCenter && (
          <div className={cn(menuRowBackground ? "hidden md:block border-t border-black/80" : "contents")} style={menuRowBackground ? { background: menuRowBackground } : undefined}>
            <ul className={cn("hidden md:flex items-center justify-center py-1.5", !menuRowBackground && "border-t border-border/60", menuUppercase ? "gap-1 xl:gap-3 uppercase tracking-[0.02em] text-[14px] [&_a]:whitespace-nowrap [&_button]:whitespace-nowrap" : "gap-0.5", topRowBackground && "max-w-7xl mx-auto px-4 sm:px-6")}>
              {desktopItems}
            </ul>
          </div>
        )}
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
                (showCta && ctaLabel && ctaUrl) || (secondaryCtaLabel && secondaryCtaUrl) || showBooking ? (
                  <>
                    {showBooking && (
                      <Link href={bookingUrl || "/book"} className="flex items-center justify-center px-4 py-3 rounded-full text-[0.95rem] font-semibold" style={{ backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%))", color: "hsl(var(--primary-foreground))", boxShadow: "0 8px 20px -6px hsl(var(--primary) / 0.45)" }} onClick={() => setMobileOpen(false)}>
                        {bookingLabel || "Book now"}
                      </Link>
                    )}
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
    </>
  );
}

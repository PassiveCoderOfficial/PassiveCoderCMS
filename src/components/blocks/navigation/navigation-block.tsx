"use client";

import React, { useState, useRef, useEffect } from "react";
import type { NavigationBlockProps, NavItem } from "@/types/cms";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ShoppingCart } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";
import { BrandLogo } from "@/components/site/brand-logo";

/* ── Dropdown / mega-menu (token-driven surfaces) ───────────────────────── */
function GroupIcon({ name }: { name?: string }) {
  const Icon = name ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] : null;
  if (!Icon) return null;
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary shrink-0">
      <Icon className="w-4 h-4" />
    </span>
  );
}

const MEGA_COL_CLASS: Record<number, string> = {
  2: "sm:grid-cols-2 lg:grid-cols-2",
  3: "sm:grid-cols-3 lg:grid-cols-3",
  4: "sm:grid-cols-3 lg:grid-cols-4",
  5: "sm:grid-cols-3 lg:grid-cols-5",
};

function DropdownMenu({ items, onMouseEnter, onMouseLeave, forceMega, columns }: {
  items: NavItem[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** Explicit megaMenu toggle from the menu manager. Falls back to inferring
   *  it from nested children so menus built before the toggle existed keep
   *  rendering the same way. */
  forceMega?: boolean;
  columns?: number;
}) {
  const isMega = forceMega ?? items.some((i) => (i.children?.length ?? 0) > 0);

  if (isMega) {
    const standalone = items.filter((i) => (i.children?.length ?? 0) === 0);
    const groups = items.filter((i) => (i.children?.length ?? 0) > 0);
    return (
      <div
        // Anchored to the <nav> element (the nearest `relative` ancestor),
        // not the viewport — this used to be `fixed` with a hardcoded
        // `top: 4.75rem`, which assumed the nav always sits flush against the
        // top of the actual browser viewport. True on the published site, but
        // false anywhere the nav renders mid-page — the header builder canvas,
        // template previews — where the menu detached from its trigger
        // entirely and floated over unrelated UI.
        className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-[9999] px-2 w-full max-w-[1120px] animate-in fade-in slide-in-from-top-2 duration-200"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="bg-popover text-popover-foreground shadow-[var(--shadow-xl)] rounded-[1.75rem] border border-border overflow-hidden">
          {standalone.length > 0 && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 px-7 py-3.5 bg-muted/70 border-b border-border">
              {standalone.map((s) => (
                <Link key={s.id} href={s.url} className="text-sm font-semibold text-primary hover:opacity-70">
                  {s.label} →
                </Link>
              ))}
            </div>
          )}
          <div className={cn("grid grid-cols-2 gap-x-8 gap-y-7 p-7 max-h-[70vh] overflow-y-auto", MEGA_COL_CLASS[columns ?? 5] ?? MEGA_COL_CLASS[5])}>
            {groups.map((group) => (
              <div key={group.id} className="min-w-0">
                <Link href={group.url} className="flex items-center gap-2.5 mb-3 group/head">
                  <GroupIcon name={group.icon} />
                  <span className="text-sm font-semibold text-foreground group-hover/head:text-primary transition-colors truncate">{group.label}</span>
                </Link>
                <ul className="space-y-1.5 pl-[calc(2rem+0.625rem)]">
                  {(group.children ?? []).map((child) => (
                    <li key={child.id}>
                      <Link href={child.url} target={child.target}
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors truncate">
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 top-full pt-2.5 z-[9999] animate-in fade-in slide-in-from-top-1 duration-150" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <ul className="min-w-[220px] max-h-[70vh] overflow-y-auto bg-popover text-popover-foreground shadow-[var(--shadow-lg)] rounded-2xl border border-border p-1.5">
        {items.map((child) => (
          <li key={child.id}>
            <Link
              href={child.url}
              target={child.target}
              className="block px-3.5 py-2.5 text-sm rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavItemDesktop({ item, currentColor, solid }: {
  item: NavItem; currentColor: string; solid: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChildren = (item.children?.length ?? 0) > 0;
  const pathname = usePathname();
  const isActive = item.url !== "/" && item.url !== "#" && pathname.startsWith(item.url.split("#")[0] || "");

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const openNow = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true); };
  const closeSoon = () => { closeTimer.current = setTimeout(() => setOpen(false), 120); };

  const cell = "relative px-3.5 py-2 rounded-lg text-[0.9rem] font-medium transition-colors hover:bg-current/5";

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={item.url}
          target={item.target}
          className={cn(cell, "group")}
          style={{ color: currentColor, fontWeight: isActive ? 700 : 500, opacity: isActive ? 1 : 0.85 }}
        >
          {item.label}
          {/* animated active/hover underline */}
          <span
            className="pointer-events-none absolute left-3.5 right-3.5 -bottom-0.5 h-0.5 rounded-full origin-left transition-transform duration-200 bg-current"
            style={{ transform: isActive ? "scaleX(1)" : "scaleX(0)" }}
          />
        </Link>
      </li>
    );
  }

  // A mega-menu spans the whole nav, so it must anchor to the nav bar (the
  // next `relative` ancestor up) rather than this <li>. Leaving the item
  // `relative` collapsed the panel to the width of the menu label — a thin
  // sliver of white. Simple dropdowns do want to hang off their own item.
  const isMegaTrigger = item.megaMenu ?? (item.children ?? []).some((c) => (c.children?.length ?? 0) > 0);

  return (
    <li ref={ref} className={isMegaTrigger ? undefined : "relative"} onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        href={item.url}
        onClick={() => setOpen(false)}
        className={cn(cell, "flex items-center gap-1")}
        style={{ color: currentColor, opacity: 0.85 }}
      >
        {item.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </Link>
      {open && (
        <DropdownMenu
          items={item.children!}
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
          forceMega={item.megaMenu}
          columns={item.megaColumns}
        />
      )}
    </li>
  );
}

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
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
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
              <NavItemDesktop key={item.id} item={item} currentColor={fg} solid={solid} />
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
            <ul className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
              {items.map((item) => {
                const hasChildren = (item.children?.length ?? 0) > 0;
                const expanded = mobileExpanded === item.id;
                return (
                  <li key={item.id}>
                    <div className="flex items-center">
                      <Link
                        href={item.url}
                        className="flex-1 block px-3.5 py-3 rounded-lg text-[0.95rem] font-medium text-foreground hover:bg-muted transition-colors"
                        onClick={() => { if (!hasChildren) setMobileOpen(false); }}
                      >
                        {item.label}
                      </Link>
                      {hasChildren && (
                        <button
                          onClick={() => setMobileExpanded(expanded ? null : item.id)}
                          className="px-3 py-3 rounded-lg text-muted-foreground hover:bg-muted"
                        >
                          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                        </button>
                      )}
                    </div>
                    {hasChildren && expanded && (
                      <ul className="ml-4 mt-1 space-y-0.5 border-l-2 border-border pl-3">
                        {item.children!.map(child => (
                          <li key={child.id}>
                            <Link href={child.url} className="block px-2 py-2.5 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
              <li className="pt-3 space-y-2">
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
              </li>
            </ul>
          </div>
        </>
      )}
    </nav>
  );
}

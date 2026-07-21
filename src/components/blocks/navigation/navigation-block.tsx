"use client";

import React, { useState, useRef, useEffect } from "react";
import type { NavigationBlockProps, NavItem } from "@/types/cms";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";

/* ── Dropdown / mega-menu (token-driven surfaces) ───────────────────────── */
function DropdownMenu({ items, onMouseEnter, onMouseLeave }: {
  items: NavItem[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const isMega = items.some((i) => (i.children?.length ?? 0) > 0);

  if (isMega) {
    const standalone = items.filter((i) => (i.children?.length ?? 0) === 0);
    const groups = items.filter((i) => (i.children?.length ?? 0) > 0);
    return (
      <div
        className="fixed left-1/2 -translate-x-1/2 top-[4.5rem] z-[9999] px-2 w-full max-w-[1120px] animate-in fade-in slide-in-from-top-2 duration-200"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="bg-popover text-popover-foreground shadow-[var(--shadow-xl)] rounded-2xl border border-border overflow-hidden">
          {standalone.length > 0 && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 px-6 py-3 bg-muted/60 border-b border-border">
              {standalone.map((s) => (
                <Link key={s.id} href={s.url} className="text-sm font-semibold text-primary hover:opacity-70">
                  {s.label} →
                </Link>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-6 p-6 max-h-[70vh] overflow-y-auto">
            {groups.map((group) => (
              <div key={group.id} className="min-w-0">
                <Link href={group.url} className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5 pb-1.5 border-b border-border hover:text-foreground">
                  {group.label}
                </Link>
                <ul className="space-y-1.5">
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
      <ul className="min-w-[220px] max-h-[70vh] overflow-y-auto bg-popover text-popover-foreground shadow-[var(--shadow-lg)] rounded-xl border border-border p-1.5">
        {items.map((child) => (
          <li key={child.id}>
            <Link
              href={child.url}
              target={child.target}
              className="block px-3.5 py-2.5 text-sm rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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

  return (
    <li ref={ref} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        href={item.url}
        onClick={() => setOpen(false)}
        className={cn(cell, "flex items-center gap-1")}
        style={{ color: currentColor, opacity: 0.85 }}
      >
        {item.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </Link>
      {open && <DropdownMenu items={item.children!} onMouseEnter={openNow} onMouseLeave={closeSoon} />}
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
    floating, showCart,
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

  // Colors: token mode uses brand CSS vars; legacy uses stored hexes.
  const barBg = !solid
    ? "transparent"
    : tokenMode
      ? (glass ? "hsl(var(--card) / 0.72)" : "hsl(var(--card))")
      : (backgroundColor ?? "#0B1F3A");
  const fg = !solid
    ? "#ffffff"
    : tokenMode ? "hsl(var(--foreground))" : (textColor ?? "#ffffff");
  const accent = tokenMode ? "hsl(var(--primary))" : (activeColor ?? fg);

  const ctaV = ctaVariant ?? "gradient";
  const ctaClasses = "inline-flex items-center px-5 py-2.5 text-[0.9rem] font-semibold rounded-full transition-all hover:-translate-y-0.5";
  const ctaStyleObj: React.CSSProperties =
    ctaV === "outline"
      ? { background: "transparent", color: solid ? accent : "#fff", border: `1.5px solid ${solid ? "hsl(var(--primary))" : "rgba(255,255,255,0.6)"}` }
      : ctaV === "solid"
        ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", boxShadow: "var(--shadow-primary)" }
        : { backgroundImage: "var(--brand-gradient)", color: "#fff", boxShadow: "var(--shadow-primary)" };

  return (
    <nav
      className={cn(
        "w-full z-50 transition-all duration-300",
        sticky && "sticky top-0",
        solid && !floating && "border-b border-border/60",
        solid && glass && "backdrop-blur-xl",
      )}
      style={{
        background: floating ? "transparent" : barBg,
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
            ) : (
              <span className="text-[1.15rem] font-extrabold tracking-tight" style={{ color: fg, fontFamily: "var(--heading-font, inherit)" }}>
                {logoText ?? "Brand"}
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
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none" style={{ background: "hsl(var(--primary))" }}>
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
          <div className="md:hidden absolute left-0 right-0 top-full z-50 bg-card text-card-foreground border-t border-border shadow-[var(--shadow-xl)] animate-in slide-in-from-top-2 duration-200">
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
                  <Link href={ctaUrl} className="flex items-center justify-center px-4 py-3 rounded-full text-[0.95rem] font-semibold text-white" style={{ backgroundImage: "var(--brand-gradient)", boxShadow: "var(--shadow-primary)" }} onClick={() => setMobileOpen(false)}>
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

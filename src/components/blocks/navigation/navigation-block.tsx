"use client";

import React, { useState, useRef, useEffect } from "react";
import type { NavigationBlockProps, NavItem } from "@/types/cms";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";

function DropdownMenu({ items, onMouseEnter, onMouseLeave }: {
  items: NavItem[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  // Mega-menu: if any item has its own children, render region columns.
  const isMega = items.some((i) => (i.children?.length ?? 0) > 0);

  // pt-2 keeps a transparent hover-bridge so the cursor can cross from the
  // trigger into the menu without the gap closing it.
  if (isMega) {
    const standalone = items.filter((i) => (i.children?.length ?? 0) === 0);
    const groups = items.filter((i) => (i.children?.length ?? 0) > 0);
    return (
      // Fixed to the viewport (not the trigger) so a wide panel is always centered
      // and never clipped at the screen edges. top-16 matches the h-16 nav bar.
      <div
        className="fixed left-1/2 -translate-x-1/2 top-16 z-[9999] px-2 w-full max-w-[1120px]"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl border border-black/5 overflow-hidden">
          {standalone.length > 0 && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-black/5">
              {standalone.map((s) => (
                <Link key={s.id} href={s.url} className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:opacity-70">
                  {s.label} →
                </Link>
              ))}
            </div>
          )}
          {/* Fixed grid — each region is its own self-contained cell (no column-splitting) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-6 p-6 max-h-[70vh] overflow-y-auto">
            {groups.map((group) => (
              <div key={group.id} className="min-w-0">
                <Link href={group.url} className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5 pb-1.5 border-b border-black/5 hover:text-gray-600">
                  {group.label}
                </Link>
                <ul className="space-y-1.5">
                  {(group.children ?? []).map((child) => (
                    <li key={child.id}>
                      <Link href={child.url} target={child.target}
                        className="block text-sm text-gray-600 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors truncate">
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
    <div className="absolute left-0 top-full pt-2 z-[9999]" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <ul className="min-w-[210px] max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-900 shadow-xl rounded-xl border border-black/5 py-1.5">
        {items.map((child) => (
          <li key={child.id}>
            <Link
              href={child.url}
              target={child.target}
              className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavItemDesktop({ item, textColor, activeColor }: { item: NavItem; textColor: string; activeColor: string }) {
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

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={item.url}
          target={item.target}
          className="px-3 py-2 rounded-md text-sm font-medium hover:bg-black/5 transition-colors"
          style={{ color: isActive ? activeColor : textColor, fontWeight: isActive ? 700 : 500 }}
        >
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li ref={ref} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        href={item.url}
        onClick={() => setOpen(false)}
        className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-black/5 transition-colors"
        style={{ color: textColor }}
      >
        {item.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </Link>
      {open && <DropdownMenu items={item.children!} onMouseEnter={openNow} onMouseLeave={closeSoon} />}
    </li>
  );
}

export function NavigationBlock({ block, identityLogo, identityLogoDark: _identityLogoDark }: {
  block: NavigationBlockProps;
  identityLogo?: string | null;
  identityLogoDark?: string | null;
}) {
  const { data } = block;
  const {
    logoText, logoUrl, items, sticky, transparent, style,
    backgroundColor, backgroundGradientTo, textColor, activeColor,
    logoHeight, shadow, borderBottom, showCta, ctaLabel, ctaUrl, ctaStyle,
  } = data;
  const logo = data.logo || identityLogo || null;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const { itemCount, openCart } = useCart();

  const solidBg = backgroundColor ?? "#1a5c38";
  const bg = transparent ? "transparent"
    : backgroundGradientTo ? `linear-gradient(to right, ${solidBg}, ${backgroundGradientTo})`
    : solidBg;
  const fg = textColor ?? "#ffffff";
  const accent = activeColor ?? fg;
  const logoH = logoHeight ?? 40;

  return (
    <nav
      className={cn("w-full z-50", sticky && "sticky top-0", shadow && "shadow-md", borderBottom && "border-b")}
      style={{ background: bg, color: fg, borderColor: borderBottom ? `${fg}20` : undefined }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className={cn("flex items-center h-16 gap-4", style === "centered" && "justify-center")}>
          {/* Logo */}
          <Link href={logoUrl ?? "/"} className="flex items-center gap-2 shrink-0">
            {logo ? (
              <Image src={logo} alt={logoText ?? "Logo"} width={logoH * 3.2} height={logoH} style={{ height: logoH }} className="w-auto object-contain" />
            ) : (
              <span className="text-lg font-bold tracking-tight" style={{ color: fg }}>{logoText ?? "Brand"}</span>
            )}
          </Link>

          {/* Desktop nav */}
          <ul className={cn("hidden md:flex items-center gap-0.5", style === "centered" ? "mx-auto" : "ml-2 flex-1")}>
            {items.map((item) => (
              <NavItemDesktop key={item.id} item={item} textColor={fg} activeColor={accent} />
            ))}
          </ul>

          {/* CTA button */}
          {showCta && ctaLabel && ctaUrl && (
            <div className="hidden md:block shrink-0">
              <Link
                href={ctaUrl}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                style={ctaStyle === "outline"
                  ? { backgroundColor: "transparent", color: fg, border: `1.5px solid ${fg}` }
                  : { backgroundColor: "var(--color-secondary, #c9a84c)", color: "var(--color-foreground, #0f2418)" }}
              >
                {ctaLabel}
              </Link>
            </div>
          )}

          {/* Cart icon */}
          <button
            onClick={openCart}
            className="relative p-2 rounded-md hover:bg-black/10 transition-colors shrink-0"
            style={{ color: fg }}
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-md"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ color: fg }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t" style={{ backgroundColor: backgroundColor ?? "#1a5c38", borderColor: `${fg}20` }}>
          <ul className="px-4 py-3 space-y-0.5">
            {items.map((item) => {
              const hasChildren = (item.children?.length ?? 0) > 0;
              const expanded = mobileExpanded === item.id;
              return (
                <li key={item.id}>
                  <div className="flex items-center">
                    <Link
                      href={item.url}
                      className="flex-1 block px-3 py-2.5 rounded-md text-sm font-medium"
                      style={{ color: fg }}
                      onClick={() => { if (!hasChildren) setMobileOpen(false); }}
                    >
                      {item.label}
                    </Link>
                    {hasChildren && (
                      <button
                        onClick={() => setMobileExpanded(expanded ? null : item.id)}
                        className="px-2 py-2 rounded-md"
                        style={{ color: fg }}
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                      </button>
                    )}
                  </div>
                  {hasChildren && expanded && (
                    <ul className="ml-4 mt-1 space-y-0.5 border-l-2 pl-3" style={{ borderColor: `${fg}30` }}>
                      {item.children!.map(child => (
                        <li key={child.id}>
                          <Link
                            href={child.url}
                            className="block px-2 py-2 text-sm rounded"
                            style={{ color: `${fg}cc` }}
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
            {showCta && ctaLabel && ctaUrl && (
              <li className="pt-2">
                <Link
                  href={ctaUrl}
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-center hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: "var(--color-secondary, #c9a84c)",
                    color: "var(--color-foreground, #0f2418)",
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  {ctaLabel}
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}

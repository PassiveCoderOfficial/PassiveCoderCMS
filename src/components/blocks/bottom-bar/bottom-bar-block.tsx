"use client";

import React, { useEffect, useRef, useState } from "react";
import { strictStyleText } from "@/lib/security/style-text";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { X, Search } from "lucide-react";
import { SearchSuggestions } from "@/components/site/search-suggestions";
import { useCart } from "@/lib/cart/cart-context";
import { useSiteContact, waLink, telLink } from "@/components/site/site-contact-context";
import { cn } from "@/lib/utils";
import type { BottomBarBlockProps, BottomBarItem } from "@/types/cms";

export type BottomBarCategory = { id: string; name: string; slug: string; image_url?: string | null };

/**
 * App-style bar fixed to the bottom of the screen, placed from the footer
 * builder. Items are actions rather than bare links so shop features work
 * without setup: cart opens the cart drawer with a live count, categories
 * opens a sheet of the shop's categories, search opens a product search.
 *
 * `preview` renders it in flow (not fixed) for the editor canvas.
 *
 * When visible it publishes its height as --pc-bottom-bar-h, which the
 * floating contact buttons and the demo banner use to sit above it.
 */
const Icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>>;

const DEFAULT_URL: Partial<Record<BottomBarItem["action"], string>> = { home: "/", shop: "/shop", account: "/account/login" };

/** Words in the bar's sheets: the block's own text, else the built-in English. */
export function bottomBarText(d: BottomBarBlockProps["data"]) {
  return {
    searchTitle: d.searchTitle || "Search",
    categoriesTitle: d.categoriesTitle || "Shop by category",
    allProducts: d.allProductsLabel || "All products",
    searchPlaceholder: d.searchPlaceholder || "Search products",
  };
}

export function BottomBarBlock({ block, categories = [], preview = false }: { block: BottomBarBlockProps; categories?: BottomBarCategory[]; preview?: boolean }) {
  const d = block.data;
  const words = bottomBarText(d);
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const contact = useSiteContact();
  const { itemCount, openCart } = useCart();
  const [sheet, setSheet] = useState<null | "categories" | "search">(null);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Live suggestions use the same engine as the header search. Submitting goes
  // to the shop when only products are searched, else the site search page.
  const liveSearch = d.searchLive !== false;
  const onlyProducts = d.searchTypes?.length === 1 && d.searchTypes[0] === "product";
  const searchUrl = (term: string) => {
    if (!term) return "/shop";
    if (onlyProducts || !d.searchTypes?.length) return `/shop?q=${encodeURIComponent(term)}`;
    return `/search?q=${encodeURIComponent(term)}&in=${encodeURIComponent(d.searchTypes.join(","))}`;
  };
  useEffect(() => { if (sheet === "search") setTimeout(() => inputRef.current?.focus(), 50); }, [sheet]);

  const items = (d.items ?? []).filter((i) => !i.hidden);
  const h = d.height ?? 64;
  const iconSize = d.iconSize ?? 22;
  const labelSize = d.labelSize ?? 11;
  const bg = d.background || "hsl(var(--background))";
  const fg = d.color || "hsl(var(--muted-foreground))";
  const active = d.activeColor || "hsl(var(--primary))";
  const badgeBg = d.badgeBg || "hsl(var(--primary))";
  const badgeFg = d.badgeColor || "hsl(var(--primary-foreground))";
  const floating = d.style === "floating";
  const id = `pcbb-${block.id.replace(/[^a-z0-9-]/gi, "")}`;
  // Breakpoint the bar hides at (none for "all").
  const hideAt = d.display === "mobile" ? 768 : d.display === "tablet" ? 1024 : null;
  const reserve = floating ? h + 24 : h;

  const isActive = (it: BottomBarItem) => {
    if (it.action === "home") return pathname === (it.url || "/");
    if (it.action === "shop") return pathname.startsWith(it.url || "/shop");
    if (it.action === "link" && it.url?.startsWith("/")) return it.url === "/" ? pathname === "/" : pathname.startsWith(it.url);
    if (it.action === "categories") return sheet === "categories";
    if (it.action === "search") return sheet === "search";
    return false;
  };

  const hrefFor = (it: BottomBarItem): string | null => {
    switch (it.action) {
      case "whatsapp": return waLink(it.url || contact.whatsapp || contact.phone, it.text);
      case "call": return telLink(it.url || contact.phone);
      case "email": return (it.url || contact.email) ? `mailto:${it.url || contact.email}` : null;
      case "link": return it.url || "/";
      case "home": case "shop": case "account": return it.url || DEFAULT_URL[it.action]!;
      default: return null;
    }
  };

  const onAction = (it: BottomBarItem) => {
    if (preview) return;
    if (it.action === "cart") { setSheet(null); openCart(); }
    else if (it.action === "categories") setSheet((s) => (s === "categories" ? null : "categories"));
    else if (it.action === "search") setSheet((s) => (s === "search" ? null : "search"));
  };

  const renderItem = (it: BottomBarItem) => {
    const Icon = Icons[it.icon] ?? Icons.Circle;
    const on = isActive(it);
    const color = on ? active : fg;
    const inner = (
      <>
        <span className="relative inline-flex items-center justify-center rounded-full transition-colors"
          style={{ padding: d.activePill ? "4px 14px" : 0, background: on && d.activePill ? `color-mix(in srgb, ${active} 14%, transparent)` : undefined }}>
          <Icon style={{ width: iconSize, height: iconSize, color }} strokeWidth={on ? 2.4 : 2} />
          {it.action === "cart" && itemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center leading-none" style={{ background: badgeBg, color: badgeFg }}>
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </span>
        <span className={cn("pcbb-label leading-none truncate max-w-full", on ? "font-semibold" : "font-medium")} style={{ fontSize: labelSize, color }}>{it.label}</span>
      </>
    );
    const cls = "flex-1 min-w-0 h-full flex flex-col items-center justify-center gap-1 px-1 select-none";
    const href = hrefFor(it);
    if (href && !preview) {
      const external = /^(https?:|tel:|mailto:)/.test(href);
      return external
        ? <a key={it.id} href={href} className={cls} aria-label={it.label} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inner}</a>
        : <Link key={it.id} href={href} className={cls} aria-label={it.label} onClick={() => setSheet(null)}>{inner}</Link>;
    }
    return <button key={it.id} type="button" className={cls} aria-label={it.label} onClick={() => onAction(it)}>{inner}</button>;
  };

  const barStyle: React.CSSProperties = {
    height: h, background: bg,
    borderTop: d.borderTop !== false && !floating ? "1px solid hsl(var(--border))" : undefined,
    boxShadow: d.shadow !== false ? (floating ? "0 10px 30px rgba(0,0,0,.18)" : "0 -4px 18px rgba(0,0,0,.06)") : undefined,
    backdropFilter: d.blur ? "saturate(1.6) blur(14px)" : undefined,
    WebkitBackdropFilter: d.blur ? "saturate(1.6) blur(14px)" : undefined,
  };

  if (preview) {
    return (
      <div className="py-4 px-4 bg-muted/40">
        <p className="text-[11px] text-muted-foreground text-center mb-2">
          Bottom bar · fixed to the screen bottom on {d.display === "mobile" ? "phones" : d.display === "tablet" ? "phones and tablets" : "every screen"}
        </p>
        <nav className={cn("mx-auto flex items-stretch max-w-[420px]", floating ? "rounded-2xl" : "rounded-md")} style={barStyle}>
          {items.map(renderItem)}
        </nav>
      </div>
    );
  }

  const desktopFloating = (d.desktopStyle ?? d.style) === "floating";
  const css = `
#${id}{position:fixed;left:0;right:0;bottom:0;z-index:9980;padding-bottom:env(safe-area-inset-bottom)}
#${id}.pcbb-float{left:12px;right:12px;bottom:12px}
#${id}.pcbb-float nav{border-radius:20px}
#${id}-sp{height:calc(${reserve}px + env(safe-area-inset-bottom))}
${d.showLabels === false ? `#${id} .pcbb-label{display:none}` : ""}
${hideAt
    ? `@media(min-width:${hideAt}px){#${id},#${id}-sp,#${id}-sheet{display:none!important}}
@media(max-width:${hideAt - 0.02}px){:root{--pc-bottom-bar-h:${reserve}px}${d.hideFloatingButtons ? ".pc-fcb>a{display:none!important}" : ""}}`
    : `:root{--pc-bottom-bar-h:${reserve}px}${d.hideFloatingButtons ? ".pc-fcb>a{display:none!important}" : ""}
@media(min-width:1024px){
#${id},#${id}.pcbb-float{left:50%;right:auto;transform:translateX(-50%);width:100%;max-width:${d.desktopMaxWidth ?? 560}px;bottom:${desktopFloating ? 16 : 0}px}
#${id} nav{border-radius:${desktopFloating ? 20 : 0}px}
${d.desktopShowLabels === false ? `#${id} .pcbb-label{display:none}` : d.desktopShowLabels ? `#${id} .pcbb-label{display:block}` : ""}}`}
.pc-fcb{bottom:calc(20px + var(--pc-bottom-bar-h,0px))!important}
@media print{#${id},#${id}-sp{display:none}}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: strictStyleText(css) }} />
      <div id={`${id}-sp`} aria-hidden="true" />
      {sheet && (
        <div id={`${id}-sheet`} className="fixed inset-0 z-[9979]" onClick={() => setSheet(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 right-0 rounded-t-2xl bg-background text-foreground shadow-2xl p-4 max-h-[70vh] overflow-y-auto"
            style={{ bottom: `calc(${reserve}px + env(safe-area-inset-bottom))`, ...(sheet === "search" && liveSearch ? { minHeight: "60vh" } : {}) }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm">{sheet === "search" ? words.searchTitle : words.categoriesTitle}</p>
              <button type="button" onClick={() => setSheet(null)} aria-label="Close" className="p-1 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            {sheet === "search" ? (
              <form role="search" onSubmit={(e) => { e.preventDefault(); setSheet(null); router.push(searchUrl(q.trim())); }} className="relative flex gap-2">
                <input ref={inputRef} name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={words.searchPlaceholder}
                  className="flex-1 h-11 rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
                <button type="submit" className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: active, color: "#fff" }} aria-label="Search"><Search className="w-5 h-5" /></button>
                {liveSearch && <SearchSuggestions types={d.searchTypes?.length ? d.searchTypes : undefined} limit={d.searchSuggestLimit ?? 5} />}
              </form>
            ) : (
              <div className="grid grid-cols-3 gap-x-3 gap-y-4">
                {categories.map((c) => (
                  <Link key={c.id} href={`/shop?category=${c.slug}`} onClick={() => setSheet(null)} className="flex flex-col items-center text-center gap-1.5">
                    <span className="w-16 h-16 rounded-full overflow-hidden bg-muted block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {c.image_url && <img src={c.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />}
                    </span>
                    <span className="text-[11px] font-medium leading-tight">{c.name}</span>
                  </Link>
                ))}
                <Link href="/shop" onClick={() => setSheet(null)} className="flex flex-col items-center text-center gap-1.5">
                  <span className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"><LucideIcons.LayoutGrid className="w-6 h-6" style={{ color: active }} /></span>
                  <span className="text-[11px] font-medium leading-tight">{words.allProducts}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      <div id={id} className={cn(floating && "pcbb-float")}>
        <nav aria-label="Quick links" className="flex items-stretch w-full" style={barStyle}>
          {items.map(renderItem)}
        </nav>
      </div>
    </>
  );
}

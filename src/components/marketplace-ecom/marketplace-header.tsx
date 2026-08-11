"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search, ShoppingCart, Menu, X, Store, ChevronDown, Package, Headset,
} from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";

export interface HeaderCategory {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
}

/**
 * Sticky marketplace header — logo, category menu, search, cart count and
 * seller entry point.
 *
 * A React component rather than page-builder blocks because everything in it
 * is stateful: live cart count, search box, open/close menus. The same reason
 * the blood-donor site has its own header.
 */
export function MarketplaceHeader({
  logoUrl,
  siteName,
  categories,
  supportPhone,
}: {
  logoUrl: string | null;
  siteName: string;
  categories: HeaderCategory[];
  supportPhone?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  // Route changes close every menu — otherwise tapping a category on mobile
  // navigates behind a panel that stays open over the new page.
  useEffect(() => {
    setMobileOpen(false);
    setCatOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!catOpen) return;
    function onDown(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [catOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#EAECF0] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      {/* Utility strip — thin, dark, sets the marketplace tone */}
      <div className="bg-[#1A1330] text-white/80 text-xs hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> Cash on delivery all over Bangladesh
          </span>
          <span className="ml-auto flex items-center gap-4">
            <Link href="/vendor" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Sell on {siteName}
            </Link>
            {supportPhone && (
              <a
                href={`tel:${supportPhone.replace(/\s/g, "")}`}
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Headset className="w-3.5 h-3.5" /> {supportPhone}
              </a>
            )}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3 sm:gap-5">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden p-2 -ml-2 text-[#1A1330]"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link href="/" className="shrink-0" aria-label={siteName}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteName} className="h-8 w-auto" />
          ) : (
            <span className="text-xl font-extrabold text-[#1A1330]">{siteName}</span>
          )}
        </Link>

        {/* Category dropdown — desktop only; mobile gets the full panel below */}
        <div className="relative hidden lg:block" ref={catRef}>
          <button
            onClick={() => setCatOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-[#1A1330] hover:text-[#FF5A1F] transition-colors whitespace-nowrap"
          >
            Categories
            <ChevronDown className={`w-4 h-4 transition-transform ${catOpen ? "rotate-180" : ""}`} />
          </button>
          {catOpen && (
            <div className="absolute left-0 top-full mt-3 w-[440px] bg-white border border-[#EAECF0] rounded-2xl shadow-xl p-2 grid grid-cols-2 gap-1">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/shop?category=${c.id}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#FFF6F2] transition-colors group"
                >
                  {c.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span className="w-8 h-8 rounded-lg bg-[#FFF6F2] shrink-0" />
                  )}
                  <span className="text-sm text-[#1A1330] group-hover:text-[#FF5A1F] truncate">
                    {c.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={submitSearch} className="flex-1 max-w-xl hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for products, brands and sellers"
              className="w-full h-10 pl-10 pr-24 rounded-full border border-[#EAECF0] bg-[#F9FAFB] text-sm text-[#1A1330] placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F] focus:bg-white transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-4 rounded-full bg-[#FF5A1F] text-white text-xs font-semibold hover:bg-[#E64A0F] transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/shop"
            className="hidden md:inline-flex text-sm font-medium text-[#1A1330] hover:text-[#FF5A1F] px-3 py-2 transition-colors"
          >
            All products
          </Link>
          <button
            onClick={openCart}
            className="relative p-2.5 rounded-full hover:bg-[#FFF6F2] transition-colors"
            aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
          >
            <ShoppingCart className="w-5 h-5 text-[#1A1330]" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF5A1F] text-white text-[11px] font-bold flex items-center justify-center">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search — always visible on small screens, where the inline
          form above is hidden */}
      <form onSubmit={submitSearch} className="sm:hidden px-4 pb-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            className="w-full h-10 pl-10 pr-4 rounded-full border border-[#EAECF0] bg-[#F9FAFB] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25"
          />
        </div>
      </form>

      {mobileOpen && (
        <div className="lg:hidden border-t border-[#EAECF0] bg-white max-h-[70vh] overflow-y-auto">
          <nav className="px-4 py-3 space-y-1">
            <Link href="/shop" className="block px-3 py-2.5 rounded-xl hover:bg-[#FFF6F2] text-sm font-medium text-[#1A1330]">
              All products
            </Link>
            <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-[#667085]">
              Categories
            </p>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.id}`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#FFF6F2]"
              >
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                ) : (
                  <span className="w-8 h-8 rounded-lg bg-[#FFF6F2] shrink-0" />
                )}
                <span className="text-sm text-[#1A1330]">{c.name}</span>
              </Link>
            ))}
            <Link href="/vendor" className="flex items-center gap-2 px-3 py-2.5 mt-2 rounded-xl bg-[#1A1330] text-white text-sm font-medium">
              <Store className="w-4 h-4" /> Sell on {siteName}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

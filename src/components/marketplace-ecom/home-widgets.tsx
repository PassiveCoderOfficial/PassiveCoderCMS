"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, Zap } from "lucide-react";
import { FeedCard } from "./feed-card";
import type { CardProduct } from "./product-card";

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;

export interface HeroSlide {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string | null;
  /** Tailwind gradient classes — slides alternate so the carousel reads as
   *  several campaigns, not one banner repeated. */
  tone: string;
}

/** Auto-advancing banner carousel with swipe, dots and arrows. Pauses on
 *  hover so desktop shoppers can actually read a slide. */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;
  const go = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
  }, [paused, n, go]);

  if (n === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[2.2/1] sm:aspect-[3/1] bg-[#1A1330]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {slides.map((s, k) => (
          <Link
            key={k}
            href={s.href}
            className={`relative shrink-0 w-full h-full flex items-center bg-gradient-to-br ${s.tone}`}
            aria-hidden={k !== i}
            tabIndex={k === i ? 0 : -1}
          >
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.image}
                alt=""
                className="absolute right-0 top-0 h-full w-[55%] object-cover [mask-image:linear-gradient(to_right,transparent,black_40%)]"
              />
            )}
            <div className="relative z-10 px-5 sm:px-12 max-w-[62%]">
              <p className="text-white/80 text-[11px] sm:text-sm font-semibold uppercase tracking-wider">
                {s.subtitle}
              </p>
              <h2 className="mt-1 sm:mt-2 text-white text-lg sm:text-4xl font-extrabold leading-tight line-clamp-2">
                {s.title}
              </h2>
              <span className="inline-block mt-2 sm:mt-5 bg-white text-[#1A1330] text-xs sm:text-sm font-bold px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full">
                {s.cta}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {n > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white items-center justify-center shadow"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white items-center justify-center shadow"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, k) => (
              <button
                key={k}
                onClick={() => setI(k)}
                aria-label={`Slide ${k + 1}`}
                className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Time left until next midnight in Dhaka (UTC+6) — flash deals roll daily. */
function msToDhakaMidnight() {
  const now = Date.now();
  const dhaka = new Date(now + 6 * 3600_000);
  const next = Date.UTC(dhaka.getUTCFullYear(), dhaka.getUTCMonth(), dhaka.getUTCDate() + 1) - 6 * 3600_000;
  return next - now;
}

function Countdown() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    setMs(msToDhakaMidnight());
    const t = setInterval(() => setMs(msToDhakaMidnight()), 1000);
    return () => clearInterval(t);
  }, []);
  // Render placeholder until mounted so server and client HTML match.
  const s = ms === null ? 0 : Math.floor(ms / 1000);
  const parts = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((v) =>
    String(v).padStart(2, "0"),
  );
  return (
    <span className="flex items-center gap-1" aria-label="Deals end in">
      {parts.map((p, k) => (
        <span key={k} className="flex items-center gap-1">
          <span className="bg-[#1A1330] text-white text-xs font-bold tabular-nums w-6 h-6 rounded flex items-center justify-center">
            {ms === null ? "--" : p}
          </span>
          {k < 2 && <span className="text-[#1A1330] font-bold text-xs">:</span>}
        </span>
      ))}
    </span>
  );
}

/** Flash-sale strip: countdown + horizontal deal rail with a stock bar. */
export function FlashSale({ products }: { products: CardProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="flex items-center gap-1 text-lg sm:text-xl font-extrabold italic text-[#FF5A1F] uppercase">
          <Zap className="w-5 h-5 fill-[#FF5A1F]" /> Flash Deals
        </h2>
        <Countdown />
        <Link href="/shop?sort=discount" className="ml-auto text-sm font-semibold text-[#FF5A1F] flex items-center">
          See all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x pb-1 -mx-1 px-1 [scrollbar-width:none]">
        {products.map((p) => {
          const img = Array.isArray(p.images) ? p.images[0] : undefined;
          const off = p.compare_price ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100) : 0;
          const left = p.track_inventory ? p.stock_quantity : null;
          const pct = left === null ? 70 : Math.max(8, Math.min(95, 100 - left * 4));
          return (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="snap-start shrink-0 w-[118px] sm:w-[150px] group"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-[#F4F4F5]">
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                )}
                {off > 0 && (
                  <span className="absolute top-0 right-0 bg-[#FFD60A] text-[#1A1330] text-[11px] font-extrabold px-1.5 py-0.5 rounded-bl-md">
                    -{off}%
                  </span>
                )}
              </div>
              <p className="mt-2 text-center text-base font-bold text-[#FF5A1F]">{tk(p.price)}</p>
              <div className="relative mt-1 h-4 rounded-full bg-[#FFD2BF] overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FF5A1F] to-[#FF8A3D]" style={{ width: `${pct}%` }} />
                <span className="relative block text-center text-[10px] font-bold text-[#1A1330] leading-4 uppercase">
                  {left !== null && left <= 10 ? `Only ${left} left` : "Selling fast"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** "Just for you" — infinite two-column discovery feed, the backbone of every
 *  Asian marketplace home. First page is server-rendered; more load as the
 *  shopper nears the bottom. */
export function JustForYou({ initial, initialHasMore }: { initial: CardProduct[]; initialHasMore: boolean }) {
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/storefront/products?sort=popular&page=${page + 1}`);
      const json = await res.json();
      const seen = new Set(items.map((p) => p.id));
      setItems((prev) => [...prev, ...(json.products ?? []).filter((p: CardProduct) => !seen.has(p.id))]);
      setPage((v) => v + 1);
      setHasMore(Boolean(json.has_more));
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, items]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <section>
      <div className="sticky top-[64px] sm:top-[96px] z-10 bg-[#F5F5F7] py-2">
        <h2 className="text-center text-sm font-bold uppercase tracking-wider text-[#FF5A1F] border-b-2 border-[#FF5A1F] w-fit mx-auto px-4 pb-1">
          Just for you
        </h2>
      </div>
      <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((p) => (
          <FeedCard key={p.id} product={p} />
        ))}
      </div>
      <div ref={sentinel} className="py-6 flex justify-center">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-[#FF5A1F]" />
        ) : !hasMore && items.length > 0 ? (
          <Link href="/shop" className="text-sm font-semibold text-[#FF5A1F] border border-[#FF5A1F] rounded-full px-6 py-2 hover:bg-[#FF5A1F] hover:text-white transition-colors">
            Browse the full catalogue
          </Link>
        ) : null}
      </div>
    </section>
  );
}

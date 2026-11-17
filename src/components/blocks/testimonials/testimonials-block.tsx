"use client";

import React, { useEffect, useState } from "react";
import type { TestimonialsBlockProps } from "@/types/cms";
import { mapTestimonialRows, TESTIMONIAL_ROW_SELECT, type TestimonialRow } from "./testimonial-rows";
import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteImage } from "@/components/blocks/_primitives/site-image";
import { ReviewBoard } from "./review-board";

type Item = TestimonialsBlockProps["data"]["items"][number];

/** Thumbnails of the reviewer's photos; each opens full size. */
function ReviewPhotos({ photos }: { photos?: string[] }) {
  if (!photos?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 my-3">
      {photos.map((u) => (
        <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="block h-16 w-16 overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={u} alt="Photo from this review" loading="lazy" className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
}

function Stars({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5 mb-3">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={cn("h-4 w-4", i < rating ? "text-accent fill-accent" : "text-muted fill-muted")} />
      ))}
    </div>
  );
}

function Avatar({ item }: { item: Item }) {
  if (item.avatar) {
    return <SiteImage src={item.avatar} alt={item.name} sizes="40px" widths={[80, 120]} className="w-10 h-10 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
      {item.name.charAt(0)}
    </div>
  );
}

/** Google rating summary: score, stars, review count and a link to the
 *  Google profile. Shows only what the editor entered. */
function GoogleRatingCard({ data }: { data: TestimonialsBlockProps["data"] }) {
  const r = data.ratingSummary;
  const value = Number(r?.value);
  if (!r?.enabled || !value) return null;
  const v = Math.min(5, Math.max(0, value));
  const inner = (
    <>
      <svg viewBox="0 0 48 48" className="h-9 w-9 shrink-0" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      <div className="text-left">
        <p className="text-xs font-semibold text-muted-foreground m-0">{r.label || "Google Reviews"}</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold leading-none text-foreground">{v.toFixed(1)}</span>
          <span className="flex gap-0.5" aria-label={`${v.toFixed(1)} out of 5`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className={cn("h-4 w-4", v >= i + 0.75 ? "text-[#FBBC05] fill-[#FBBC05]" : v >= i + 0.25 ? "text-[#FBBC05] fill-[#FBBC05]/50" : "text-muted-foreground/40")} />
            ))}
          </span>
        </div>
        {r.count && <p className="text-xs text-muted-foreground m-0 mt-1">{r.countLabel ? r.countLabel.replace(/\{count\}/g, r.count) : <>Based on {r.count} reviews</>}</p>}
      </div>
    </>
  );
  const cls = "inline-flex items-center gap-4 rounded-2xl border bg-card text-card-foreground px-5 py-4 shadow-sm";
  return (
    <div className={cn("flex justify-center", r.position === "top" ? "mb-10" : "mt-10")}>
      {r.url
        ? <a href={r.url} target="_blank" rel="noopener noreferrer" className={cn(cls, "hover:shadow-md transition-shadow")}>{inner}</a>
        : <div className={cls}>{inner}</div>}
    </div>
  );
}

// ─── Variant: quote-cards ────────────────────────────────────────────────────
// White cards with star ratings, avatar row at bottom — clean/bright
function TestimonialsQuoteCards({ data }: { data: TestimonialsBlockProps["data"] }) {
  return (
    <div className="max-w-7xl mx-auto">
      {data.title && (
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{data.subtitle ?? "What people say"}</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "var(--heading-font, inherit)" }}>{data.title}</h2>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.items.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              "relative rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
              i === 0 ? "bg-primary/[0.06] border border-primary/15" : "bg-card border border-border",
            )}
          >
            <span aria-hidden className="absolute top-4 right-5 text-5xl leading-none text-primary/10 select-none" style={{ fontFamily: "var(--heading-font, serif)" }}>&rdquo;</span>
            <Stars rating={item.rating} />
            <blockquote className="text-sm leading-relaxed flex-1 text-foreground/80 mb-5 relative">
              &ldquo;{item.content}&rdquo;
            </blockquote>
            <ReviewPhotos photos={item.photos} />
            <div className="flex items-center gap-3">
              <Avatar item={item} />
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                {(item.role || item.company) && (
                  <p className="text-xs text-muted-foreground">{[item.role, item.company].filter(Boolean).join(" · ")}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: minimal-quote ──────────────────────────────────────────────────
// Elegant minimal large quotes, no cards — luxury spa/restaurant
function TestimonialsMinimalQuote({ data }: { data: TestimonialsBlockProps["data"] }) {
  const featured = data.items.slice(0, 3);
  return (
    <div className="max-w-6xl mx-auto">
      {data.title && (
        <h2 className="text-2xl font-light text-center mb-16 tracking-widest uppercase text-muted-foreground">
          {data.title}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-x divide-border">
        {featured.map((item) => (
          <div key={item.id} className="px-8 first:pl-0 last:pr-0 flex flex-col">
            <Quote className="h-8 w-8 text-primary/40 mb-4" />
            <blockquote className="text-base font-light leading-relaxed flex-1 text-foreground/80 italic mb-6">
              {item.content}
            </blockquote>
            <ReviewPhotos photos={item.photos} />
            <div className="flex items-center gap-3">
              <Avatar item={item} />
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                {(item.role || item.company) && (
                  <p className="text-xs text-muted-foreground">{[item.role, item.company].filter(Boolean).join(", ")}</p>
                )}
              </div>
            </div>
            {item.rating && <Stars rating={item.rating} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: formal-cards ────────────────────────────────────────────────────
// Bordered, structured cards with quote mark — law / corporate
/** Editor-typed summary card ("Rated highly by our customers" + button). No numbers are computed. */
export function TestimonialsSummaryCard({ data }: { data: TestimonialsBlockProps["data"] }) {
  const c = data.summaryCard;
  if (!c?.enabled) return null;
  return (
    <div className="bg-card rounded-3xl p-6 sm:p-8 border shadow-sm mb-5 flex flex-wrap items-center justify-between gap-4 text-left">
      <div>
        {c.stars !== false && <div className="text-xl tracking-widest" style={{ color: data.starColor || "#F5A623" }}>★★★★★</div>}
        {c.title && <div className="text-lg font-black text-primary mt-1">{c.title}</div>}
        {c.text && <div className="text-xs text-muted-foreground mt-1">{c.text}</div>}
      </div>
      {c.buttonLabel && (
        <a href={c.buttonUrl || "#"} className="bg-primary text-primary-foreground px-5 py-3 rounded-xl font-black text-sm uppercase hover:opacity-90">{c.buttonLabel}</a>
      )}
    </div>
  );
}

function TestimonialsFormalCards({ data }: { data: TestimonialsBlockProps["data"] }) {
  const center = data.headingAlign === "center";
  return (
    <div className="max-w-6xl mx-auto">
      {center ? (
        <div className="text-center mb-10">
          {data.eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-primary">
              <i className="h-[7px] w-[7px] rounded-full bg-accent" />{data.eyebrow}
            </span>
          )}
          {data.title && <h2 className="text-3xl sm:text-4xl font-black text-primary mt-4">{data.title}</h2>}
          {data.subtitle && <p className="text-muted-foreground mt-2">{data.subtitle}</p>}
        </div>
      ) : data.title && <h2 className="text-3xl font-bold mb-12">{data.title}</h2>}
      <TestimonialsSummaryCard data={data} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.items.map((item) => (
          <div key={item.id} className={cn("bg-card border border-border p-8 relative", center && "rounded-[18px]")}>
            <div className="absolute top-6 right-6 text-6xl font-serif text-primary/10 leading-none select-none">&ldquo;</div>
            <Stars rating={item.rating} />
            <blockquote className="text-sm leading-relaxed text-foreground/80 mb-6 pr-8">
              {item.content}
            </blockquote>
            <ReviewPhotos photos={item.photos} />
            <div className="border-t border-border pt-4 flex items-center gap-3">
              <Avatar item={item} />
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                {(item.role || item.company) && (
                  <p className="text-xs text-muted-foreground">{[item.role, item.company].filter(Boolean).join(", ")}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: dark-quote-cards ────────────────────────────────────────────────
// Dark background cards with gradient border — tech agency
function TestimonialsDarkQuoteCards({ data }: { data: TestimonialsBlockProps["data"] }) {
  return (
    <div className="max-w-7xl mx-auto">
      {data.title && <h2 className="text-3xl font-black text-center mb-12 tracking-tight">{data.title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {data.items.map((item) => (
          <div key={item.id} className="p-px rounded-xl bg-gradient-to-br from-primary/40 via-border to-border">
            <div className="bg-card rounded-xl p-6 h-full flex flex-col">
              <Stars rating={item.rating} />
              <blockquote className="text-sm leading-relaxed flex-1 text-muted-foreground mb-5">
                &ldquo;{item.content}&rdquo;
              </blockquote>
              <ReviewPhotos photos={item.photos} />
              <div className="flex items-center gap-3">
                <Avatar item={item} />
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  {(item.role || item.company) && (
                    <p className="text-xs text-muted-foreground">{[item.role, item.company].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: transformation-cards ────────────────────────────────────────────
// Bold testimonials for gym — emphasize the result, dark bg
function TestimonialsTransformationCards({ data }: { data: TestimonialsBlockProps["data"] }) {
  return (
    <div className="max-w-7xl mx-auto">
      {data.title && <h2 className="text-3xl font-black uppercase tracking-tight mb-10">{data.title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data.items.map((item, i) => (
          <div key={item.id} className={cn("p-6 rounded-none border border-border bg-card", i === 0 && "md:col-span-2 bg-primary/5 border-primary/30")}>
            <Stars rating={item.rating} />
            <blockquote className={cn("leading-relaxed mb-5 font-medium", i === 0 ? "text-xl" : "text-base")}>
              &ldquo;{item.content}&rdquo;
            </blockquote>
            <ReviewPhotos photos={item.photos} />
            <div className="flex items-center gap-3">
              <Avatar item={item} />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">{item.name}</p>
                {item.role && <p className="text-xs text-muted-foreground">{item.role}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: warm-cards ──────────────────────────────────────────────────────
// Warm cream/amber background cards — restaurant
function TestimonialsWarmCards({ data }: { data: TestimonialsBlockProps["data"] }) {
  return (
    <div className="max-w-6xl mx-auto">
      {data.title && <h2 className="text-3xl font-bold text-center italic mb-12">{data.title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.items.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <Stars rating={item.rating} />
            <blockquote className="text-base italic leading-relaxed text-foreground/80 mb-5">
              &ldquo;{item.content}&rdquo;
            </blockquote>
            <ReviewPhotos photos={item.photos} />
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <Avatar item={item} />
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                {(item.role || item.company) && (
                  <p className="text-xs text-muted-foreground">{[item.role, item.company].filter(Boolean).join(", ")}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant: full-width ──────────────────────────────────────────────────────
// Full-bleed brand-color band, single large italic quote, auto-rotating —
// manufacturing/corporate/B2B.
function TestimonialsFullWidth({ data }: { data: TestimonialsBlockProps["data"] }) {
  const [index, setIndex] = useState(0);
  const items = data.items;

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  const item = items[index];
  if (!item) return null;

  return (
    <div className="w-full bg-primary">
      <div className="max-w-3xl mx-auto px-4 py-4 text-center">
        <Quote className="w-10 h-10 mx-auto mb-6 text-primary-foreground/20" />
        <blockquote className="text-primary-foreground text-xl font-light leading-relaxed mb-8 italic">
          &ldquo;{item.content}&rdquo;
        </blockquote>
        <ReviewPhotos photos={item.photos} />
        <div className="flex items-center justify-center gap-3">
          <Avatar item={item} />
          <div className="text-left">
            <p className="text-primary-foreground font-semibold text-sm">{item.name}</p>
            {(item.role || item.company) && (
              <p className="text-primary-foreground/50 text-xs">{[item.role, item.company].filter(Boolean).join(", ")}</p>
            )}
          </div>
        </div>
        {items.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {items.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setIndex(i)}
                aria-label={`Show testimonial ${i + 1}`}
                className={cn("w-2 h-2 rounded-full transition-colors", i === index ? "bg-primary-foreground" : "bg-primary-foreground/30")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Legacy fallback ──────────────────────────────────────────────────────────

function TestimonialsLegacy({ data }: { data: TestimonialsBlockProps["data"] }) {
  const { title, layout, items } = data;
  return (
    <div className="max-w-7xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}
      {!items.length && (
        <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground text-sm">
          {data.emptyText || "No testimonials added yet."}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-6", layout !== "carousel" && "md:grid-cols-3")}>
        {items.map((item) => (
          <div key={item.id} className="bg-card border rounded-xl p-6 shadow-sm flex flex-col">
            <Stars rating={item.rating} />
            <blockquote className="text-sm text-foreground/80 flex-1 leading-relaxed">&ldquo;{item.content}&rdquo;</blockquote>
            <ReviewPhotos photos={item.photos} />
            <div className="mt-4 flex items-center gap-3">
              <Avatar item={item} />
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                {(item.role || item.company) && (
                  <p className="text-xs text-muted-foreground">{[item.role, item.company].filter(Boolean).join(", ")}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Stars + Quotes: centred quotes under a row of gold stars, "— Name" below,
 * two per view on desktop, one on phones, sliding with dots underneath.
 */
function TestimonialsStarsQuotes({ data }: { data: TestimonialsBlockProps["data"] }) {
  const items = data.items ?? [];
  const [page, setPage] = useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const goTo = (i: number) => { const el = ref.current; if (!el) return; el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" }); };
  const pages = Math.max(1, Math.ceil(items.length / 2));
  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 text-center">
      {data.title && <h2 className="uppercase text-[16px] font-normal m-0 mb-7">{data.title}</h2>}
      {data.subtitle && <p className="text-sm text-muted-foreground -mt-4 mb-7">{data.subtitle}</p>}
      <div ref={ref} onScroll={(e) => { const el = e.currentTarget; setPage(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); }}
        className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((t) => (
          <figure key={t.id} className="snap-start shrink-0 basis-full md:basis-1/2 m-0 px-6 sm:px-10">
            <div className="flex justify-center gap-1.5 mb-5" aria-label={`${t.rating ?? 5} stars`}>
              {Array.from({ length: t.rating ?? 5 }).map((_, k) => <Star key={k} className="w-6 h-6 fill-[#FFD700] text-[#FFD700]" />)}
            </div>
            <blockquote className="m-0 text-[16px] leading-relaxed tracking-[.02em]">{t.content}</blockquote>
            <ReviewPhotos photos={t.photos} />
            <figcaption className="mt-4 text-[14px] text-muted-foreground">— {t.name}{t.role ? `, ${t.role}` : ""}</figcaption>
          </figure>
        ))}
      </div>
      {pages > 1 && (
        <div className="flex justify-center gap-3 mt-10">
          {Array.from({ length: items.length }).map((_, i) => (
            <button key={i} type="button" aria-label={`Show review ${i + 1}`} onClick={() => goTo(i)}
              className={cn("rounded-full transition-all", i === page ? "w-3 h-3 border-2 border-foreground" : "w-1.5 h-1.5 bg-foreground mt-[3px]")} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Photo Cards: square-ish warm cards, round photo on top, headline, quote,
 * name and outline stars; three per view on desktop, sliding with dots.
 */
function TestimonialsPhotoCards({ data }: { data: TestimonialsBlockProps["data"] }) {
  const items = data.items ?? [];
  const [page, setPage] = useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const card = data.cardColor || "#DDC69E";
  const star = data.starColor || "#e00000";
  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 text-center">
      {data.subtitle && <p className="text-[11px] tracking-[4px] uppercase mb-2.5">{data.subtitle}</p>}
      {data.title && <h2 className="uppercase text-[24px] m-0 mb-12">{data.title}</h2>}
      <div ref={ref} onScroll={(e) => { const el = e.currentTarget; setPage(Math.round(el.scrollLeft / Math.max(1, el.clientWidth / 3))); }}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((t) => (
          <figure key={t.id} className="snap-start shrink-0 basis-[88%] sm:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-2.5rem)/3)] m-0 rounded-[14px] px-8 pt-2 pb-5 flex flex-col items-center" style={{ background: card }}>
            {t.avatar
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={t.avatar} alt="" className="w-[100px] h-[100px] rounded-full object-cover" loading="lazy" />
              : <div className="w-[100px] h-[100px]" />}
            {t.title && <h3 className="text-[20px] mt-9 mb-9">{t.title}</h3>}
            <blockquote className="m-0 text-[16px] leading-relaxed flex-1">{t.content}</blockquote>
            <ReviewPhotos photos={t.photos} />
            <figcaption className="mt-9 mb-1 text-[16px] font-bold" style={{ fontFamily: "var(--heading-font, inherit)" }}>{t.name}</figcaption>
            <div className="flex gap-1" aria-label={`${t.rating ?? 5} stars`}>
              {Array.from({ length: t.rating ?? 5 }).map((_, k) => <Star key={k} className="w-[22px] h-[22px]" style={{ color: star }} strokeWidth={1.6} />)}
            </div>
          </figure>
        ))}
      </div>
      {items.length > 3 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: items.length }).map((_, i) => (
            <button key={i} type="button" aria-label={`Show review ${i + 1}`}
              onClick={() => { const el = ref.current; if (el) el.scrollTo({ left: (el.scrollWidth / items.length) * i, behavior: "smooth" }); }}
              className={cn("w-2.5 h-2.5 rounded-full", i === page ? "bg-primary" : "bg-foreground/25")} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Review Cards: square photo on top, quote clamped to four lines, gold
 * stars, name with a verified tick and the product reviewed underneath.
 * Four per row on desktop, swipeable on phones.
 */
function TestimonialsReviewCards({ data }: { data: TestimonialsBlockProps["data"] }) {
  const items = data.items ?? [];
  const card = data.cardColor || "#E3DCCB";
  const star = data.starColor || "#D4A72C";
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-10">
          {data.subtitle && <p className="text-[11px] tracking-[4px] uppercase mb-2.5">{data.subtitle}</p>}
          {data.title && <h2 className="uppercase text-[24px] m-0">{data.title}</h2>}
        </div>
      )}
      {/* Up to four fit one row; more slide sideways (any number of reviews). */}
      <div className={cn("flex gap-8 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", items.length <= 4 && "lg:grid lg:grid-cols-4 lg:overflow-visible")}>
        {items.map((t) => (
          <figure key={t.id} className="snap-start shrink-0 basis-[78%] sm:basis-[calc((100%-2rem)/2)] lg:basis-[calc((100%-6rem)/4)] m-0 rounded-[14px] overflow-hidden flex flex-col" style={{ background: card }}>
            {t.avatar
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={t.avatar} alt="" className="w-full aspect-square object-cover" loading="lazy" />
              : <div className="w-full aspect-square bg-black/10" />}
            <div className="flex flex-col items-center text-center px-6 pt-7 pb-7 flex-1">
              <blockquote className="m-0 text-[18px] leading-[1.4] text-[#5b4636] line-clamp-4 flex-1 flex items-center">{t.content}</blockquote>
              <ReviewPhotos photos={t.photos} />
              <div className="flex gap-1 mt-6" aria-label={`${t.rating ?? 5} stars`}>
                {Array.from({ length: t.rating ?? 5 }).map((_, k) => <Star key={k} className="w-8 h-8" style={{ color: star, fill: star }} strokeWidth={1} />)}
              </div>
              <figcaption className="mt-4 flex items-center justify-center gap-2 max-w-full text-[19px] font-bold text-[#5b4636]">
                <span className="truncate">{t.name}</span>
                {t.verified !== false && (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-label="Verified buyer"><circle cx="12" cy="12" r="11" fill="#5b4636" /><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </figcaption>
              {t.product && (t.productUrl
                ? <a href={t.productUrl} className="mt-3 text-[16px] text-[#8a7b6e] truncate max-w-full hover:underline">{t.product}</a>
                : <p className="mt-3 mb-0 text-[16px] text-[#8a7b6e] truncate max-w-full">{t.product}</p>)}
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function TestimonialsBlock({ block: input }: { block: TestimonialsBlockProps }) {
  // Builder canvas: load the group in the browser (the live site resolves it on the server).
  const [groupItems, setGroupItems] = useState<TestimonialsBlockProps["data"]["items"] | null>(null);
  const groupId = input.data.source === "group" ? input.data.source_group_id : undefined;
  const preloaded = (input.data as { _resolved?: boolean })._resolved;
  useEffect(() => {
    if (!groupId || preloaded) return;
    import("@/lib/supabase/client").then(({ createClient }) =>
      createClient().from("testimonials").select(TESTIMONIAL_ROW_SELECT).eq("group_id", groupId).eq("published", true).order("sort_order").limit(input.data.limit ?? 12)
        .then(({ data }) => setGroupItems(mapTestimonialRows((data ?? []) as TestimonialRow[]))));
  }, [groupId, preloaded, input.data.limit]);
  const [added, setAdded] = useState<TestimonialsBlockProps["data"]["items"]>([]);
  const base = groupId && !preloaded && groupItems ? { ...input, data: { ...input.data, items: groupItems } } : input;
  const block = added.length ? { ...base, data: { ...base.data, items: [...added, ...(base.data.items ?? [])] } } : base;
  if (block.data.reviewForm?.enabled && block.data.source === "group") {
    return (
      <div className="max-w-6xl mx-auto">
        {(block.data.title || block.data.subtitle || block.data.eyebrow) && (
          <div className="text-center mb-10">
            {block.data.eyebrow && (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-primary">
                <i className="h-[7px] w-[7px] rounded-full bg-accent" />{block.data.eyebrow}
              </span>
            )}
            {block.data.title && <h2 className="text-3xl sm:text-4xl font-black text-primary mt-4">{block.data.title}</h2>}
            {block.data.subtitle && <p className="text-muted-foreground mt-2">{block.data.subtitle}</p>}
          </div>
        )}
        <ReviewBoard data={block.data} onAdded={(it) => setAdded((a) => [it, ...a])} />
        <TestimonialsBody block={{ ...block, data: { ...block.data, title: undefined, subtitle: undefined, eyebrow: undefined, summaryCard: undefined, ratingSummary: undefined } }} />
      </div>
    );
  }
  return <TestimonialsBody block={block} />;
}

/** Load-more wrapper around the chosen variant. */
function TestimonialsBody({ block }: { block: TestimonialsBlockProps }) {
  // Load more: first `initialCount` cards, then the next batch per click.
  const step = Math.max(0, Math.floor(block.data.initialCount ?? 0));
  const [shown, setShown] = useState(step);
  const total = block.data.items?.length ?? 0;
  if (step > 0 && total > shown) {
    const visible = { ...block, data: { ...block.data, initialCount: 0, items: block.data.items.slice(0, shown) } };
    return (
      <div data-pc-load-more="">
        <TestimonialsVariant block={visible} />
        <div className="flex justify-center mt-8">
          <button type="button" onClick={() => setShown((n) => n + step)}
            className="inline-flex items-center justify-center rounded-full border-2 border-primary px-7 py-3 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
            {block.data.loadMoreLabel || "Load more reviews"}
          </button>
        </div>
      </div>
    );
  }
  return <TestimonialsVariant block={block} />;
}

function TestimonialsVariant({ block }: { block: TestimonialsBlockProps }) {
  // Formal Cards place the summary card under their own heading; other designs get it on top.
  const summary = block.data.summaryCard?.enabled && block.templateVariant !== "formal-cards"
    ? <div className="max-w-6xl mx-auto"><TestimonialsSummaryCard data={block.data} /></div> : null;
  if (!block.data.ratingSummary?.enabled) return <>{summary}<TestimonialsDesign block={block} /></>;
  const top = block.data.ratingSummary.position === "top";
  return (
    <>
      {top && <GoogleRatingCard data={block.data} />}
      <TestimonialsDesign block={block} />
      {!top && <GoogleRatingCard data={block.data} />}
    </>
  );
}

function TestimonialsDesign({ block }: { block: TestimonialsBlockProps }) {
  const variant = block.templateVariant;
  if (variant === "quote-cards") return <TestimonialsQuoteCards data={block.data} />;
  if (variant === "stars-quotes") return <TestimonialsStarsQuotes data={block.data} />;
  if (variant === "photo-cards") return <TestimonialsPhotoCards data={block.data} />;
  if (variant === "review-cards") return <TestimonialsReviewCards data={block.data} />;
  if (variant === "minimal-quote") return <TestimonialsMinimalQuote data={block.data} />;
  if (variant === "formal-cards") return <TestimonialsFormalCards data={block.data} />;
  if (variant === "dark-quote-cards") return <TestimonialsDarkQuoteCards data={block.data} />;
  if (variant === "transformation-cards") return <TestimonialsTransformationCards data={block.data} />;
  if (variant === "warm-cards") return <TestimonialsWarmCards data={block.data} />;
  if (variant === "full-width") return <TestimonialsFullWidth data={block.data} />;
  return <TestimonialsLegacy data={block.data} />;
}

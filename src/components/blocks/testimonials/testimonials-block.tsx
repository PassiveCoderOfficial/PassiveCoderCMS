import React from "react";
import type { TestimonialsBlockProps } from "@/types/cms";
import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = TestimonialsBlockProps["data"]["items"][number];

function Stars({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5 mb-3">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={cn("h-4 w-4", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-200")} />
      ))}
    </div>
  );
}

function Avatar({ item }: { item: Item }) {
  if (item.avatar) {
    return <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
      {item.name.charAt(0)}
    </div>
  );
}

// ─── Variant: quote-cards ────────────────────────────────────────────────────
// White cards with star ratings, avatar row at bottom — clean/bright
function TestimonialsQuoteCards({ data }: { data: TestimonialsBlockProps["data"] }) {
  return (
    <div className="max-w-7xl mx-auto">
      {data.title && <h2 className="text-3xl font-bold text-center mb-12">{data.title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.items.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <Stars rating={item.rating} />
            <blockquote className="text-sm leading-relaxed flex-1 text-foreground/80 mb-5">
              &ldquo;{item.content}&rdquo;
            </blockquote>
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
function TestimonialsFormalCards({ data }: { data: TestimonialsBlockProps["data"] }) {
  return (
    <div className="max-w-6xl mx-auto">
      {data.title && <h2 className="text-3xl font-bold mb-12">{data.title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.items.map((item) => (
          <div key={item.id} className="bg-card border border-border p-8 relative">
            <div className="absolute top-6 right-6 text-6xl font-serif text-primary/10 leading-none select-none">&ldquo;</div>
            <Stars rating={item.rating} />
            <blockquote className="text-sm leading-relaxed text-foreground/80 mb-6 pr-8">
              {item.content}
            </blockquote>
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

// ─── Legacy fallback ──────────────────────────────────────────────────────────

function TestimonialsLegacy({ data }: { data: TestimonialsBlockProps["data"] }) {
  const { title, layout, items } = data;
  return (
    <div className="max-w-7xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}
      {!items.length && (
        <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground text-sm">
          No testimonials added yet.
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-6", layout !== "carousel" && "md:grid-cols-3")}>
        {items.map((item) => (
          <div key={item.id} className="bg-white border rounded-xl p-6 shadow-sm flex flex-col">
            <Stars rating={item.rating} />
            <blockquote className="text-sm text-gray-700 flex-1 leading-relaxed">&ldquo;{item.content}&rdquo;</blockquote>
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

export function TestimonialsBlock({ block }: { block: TestimonialsBlockProps }) {
  const variant = block.templateVariant;
  if (variant === "quote-cards") return <TestimonialsQuoteCards data={block.data} />;
  if (variant === "minimal-quote") return <TestimonialsMinimalQuote data={block.data} />;
  if (variant === "formal-cards") return <TestimonialsFormalCards data={block.data} />;
  if (variant === "dark-quote-cards") return <TestimonialsDarkQuoteCards data={block.data} />;
  if (variant === "transformation-cards") return <TestimonialsTransformationCards data={block.data} />;
  if (variant === "warm-cards") return <TestimonialsWarmCards data={block.data} />;
  return <TestimonialsLegacy data={block.data} />;
}

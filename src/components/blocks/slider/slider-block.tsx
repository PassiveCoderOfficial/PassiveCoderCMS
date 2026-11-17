"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { SliderBlockProps } from "@/types/cms";
import Image from "@/components/ui/smart-image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineLeadForm } from "@/components/blocks/_primitives/lead-form";
import { focusStyle } from "@/lib/image-focus";

/**
 * Layout variants — the slider rendered exactly one way before, so the
 * variant picker had nothing to offer for it.
 *
 *  (default)   — centred copy over a full-bleed image
 *  left-copy   — copy in a left-aligned column, with a gradient scrim so it
 *                stays readable over a busy photo
 *  split       — image one half, copy on a solid panel the other
 *  minimal     — image forward, small caption bar along the bottom
 */
export function SliderBlock({ block }: { block: SliderBlockProps }) {
  // First slide of the page's first block carries the H1; the rest are H2.
  const headingFor = (i: number): "h1" | "h2" => (i === 0 && (block.order ?? 1) === 0 ? "h1" : "h2");
  const { data } = block;
  const { slides, autoPlay, autoPlayInterval, showArrows, showDots, height, mobileHeight, dotColor } = data;
  const variant = block.templateVariant;
  const isSplit = variant === "split";
  const isMinimal = variant === "minimal";
  const isLeft = variant === "left-copy";
  const [current, setCurrent] = useState(0);
  // Pause the rotation while a visitor is filling in the hero form.
  const [paused, setPaused] = useState(false);
  const withForm = isSplit && !!data.leadForm?.enabled && (data.leadForm.fields?.length ?? 0) > 0;

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (!autoPlay || paused || slides.length < 2) return;
    const timer = setInterval(next, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, next, slides.length, paused]);

  if (!slides.length) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}>
        <p className="text-muted-foreground text-sm">Add slides to this slider</p>
      </div>
    );
  }

  if (withForm && data.leadForm) {
    const slide = slides[Math.min(current, slides.length - 1)];
    const hasCopy = !!(slide.title || slide.subtitle || slide.buttonLabel);
    // Split + inline form. The fixed slide height can't hold a form on a
    // phone, so this lays out in flow instead: phones get a photo banner with
    // the headline on it and the form straight below; from md up the photo
    // fills the left half and the headline + form sit in the right panel.
    // One copy element moves between the two places via grid areas, so there
    // is still exactly one H1.
    return (
      <div className="slider-form relative w-full bg-background" style={{ ["--slider-h" as string]: height }}>
        <style>{`.slider-form{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"banner" "form"}
.slider-form .sf-img,.slider-form .sf-copy{grid-area:banner}.slider-form .sf-form{grid-area:form}
@media(min-width:768px){.slider-form{min-height:var(--slider-h);grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:1fr auto auto 1fr;grid-template-areas:"img ." "img copy" "img form" "img ."}
.slider-form .sf-img{grid-area:img}.slider-form .sf-copy{grid-area:copy}}`}</style>
        <div className="sf-img relative overflow-hidden min-h-[280px] md:min-h-0">
          {slides.map((s, i) => (
            <div key={s.id} className={cn("absolute inset-0 transition-opacity duration-700", i === current ? "opacity-100" : "opacity-0")}>
              {s.imageUrl ? (
                <Image src={s.imageUrl} style={focusStyle(s.imageFocus)} alt={s.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority={i === 0} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700" />
              )}
              {s.overlay && <div className="absolute inset-0 bg-black/40" />}
            </div>
          ))}
          {/* Phones: headline sits on the photo, so give it a readable scrim. */}
          {hasCopy && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10 md:hidden" />}
          {showArrows && slides.length > 1 && (
            <>
              <button onClick={prev} aria-label="Previous slide" className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 hidden md:flex bg-black/50 hover:bg-black/70 text-white rounded-full items-center justify-center transition-colors"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={next} aria-label="Next slide" className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 hidden md:flex bg-black/50 hover:bg-black/70 text-white rounded-full items-center justify-center transition-colors"><ChevronRight className="h-5 w-5" /></button>
            </>
          )}
          {showDots && slides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} aria-label={`Slide ${i + 1}`}
                  className={cn("w-2 h-2 rounded-full transition-all", dotColor ? (i === current ? "w-6" : "opacity-50 hover:opacity-75") : i === current ? "bg-white w-6" : "bg-white/50 hover:bg-white/75")}
                  style={dotColor ? { background: dotColor } : undefined} />
              ))}
            </div>
          )}
        </div>
        {hasCopy && (
          <div className="sf-copy relative z-10 self-end md:self-auto px-5 pt-16 pb-9 md:px-8 lg:px-12 md:pt-10 md:pb-0">
            <div className="max-w-xl">
              {slide.title && <SlideTitle as={headingFor(0)} className="text-[1.75rem] leading-tight md:text-4xl lg:text-5xl font-bold mb-3 text-white md:text-foreground">{slide.title}</SlideTitle>}
              {slide.subtitle && <p className="text-base md:text-lg mb-4 text-white/90 md:text-muted-foreground">{slide.subtitle}</p>}
              {slide.buttonLabel && slide.buttonUrl && (
                <Link href={slide.buttonUrl} className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                  {slide.buttonLabel}
                </Link>
              )}
            </div>
          </div>
        )}
        <div className="sf-form px-4 py-6 md:px-8 lg:px-12 md:pt-6 md:pb-10"
          onFocusCapture={() => setPaused(true)}>
          <InlineLeadForm form={data.leadForm} className="max-w-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden w-full", mobileHeight && "slider-mh")} style={{ height, ["--slider-mh" as string]: mobileHeight }}>
      {/* Phones get their own height so a wide banner isn't cropped to a sliver. */}
      {mobileHeight && <style>{`@media(max-width:767px){.slider-mh{height:var(--slider-mh)!important}}`}</style>}
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === current ? "opacity-100 z-10" : "opacity-0 z-0",
          )}
        >
          {/* Split puts the copy on a solid panel over the right half, so the
              image is confined to the left rather than sitting behind it. */}
          <div className={cn("absolute inset-y-0 left-0", isSplit ? "w-full md:w-1/2" : "w-full")}>
            {slide.imageUrl ? (
              <Image src={slide.imageUrl} style={focusStyle(slide.imageFocus)} alt={slide.title} fill sizes="100vw" className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700" />
            )}
          </div>
          {/* Left-copy leans on a directional scrim instead of a flat wash, so
              the image still reads on the side the text isn't on. */}
          {slide.overlay && (
            <div className={cn(
              "absolute inset-0",
              isLeft ? "bg-gradient-to-r from-black/75 via-black/40 to-transparent" : "bg-black/40",
            )} />
          )}

          {/* Image-only banner: the whole slide is the link, no text layer. */}
          {slide.linkUrl && !slide.title && !slide.subtitle && !slide.buttonLabel ? (
            <Link href={slide.linkUrl} className="absolute inset-0 z-10" aria-label={slide.description || "View"} tabIndex={i === current ? 0 : -1} />
          ) : !slide.title && !slide.subtitle && !slide.buttonLabel ? null : isSplit ? (
            <div className="absolute inset-0 grid md:grid-cols-2">
              <div className="hidden md:block" />
              {/* On mobile the panel spans the full slide, so a solid panel would
                  hide the image entirely; keep it a light scrim there instead. */}
              <div className="flex items-center bg-black/25 md:bg-background/95 md:backdrop-blur-sm px-8 lg:px-12">
                <div className="max-w-xl">
                  <SlideTitle as={headingFor(i)} className="text-3xl lg:text-5xl font-bold mb-4 text-white md:text-foreground">{slide.title}</SlideTitle>
                  {slide.subtitle && <p className="text-lg mb-6 text-white/85 md:text-muted-foreground">{slide.subtitle}</p>}
                  {slide.buttonLabel && slide.buttonUrl && (
                    <Link
                      href={slide.buttonUrl}
                      className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      {slide.buttonLabel}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : isMinimal ? (
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-6 py-6">
              <div className="max-w-5xl mx-auto flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <SlideTitle as={headingFor(i)} className="text-xl md:text-2xl font-semibold text-white truncate">{slide.title}</SlideTitle>
                  {slide.subtitle && <p className="text-sm text-white/75 mt-0.5 truncate">{slide.subtitle}</p>}
                </div>
                {slide.buttonLabel && slide.buttonUrl && (
                  <Link
                    href={slide.buttonUrl}
                    className="shrink-0 inline-flex items-center px-4 py-2 bg-white/95 text-gray-900 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                  >
                    {slide.buttonLabel}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className={cn(
              "absolute inset-0 flex items-center",
              isLeft ? "justify-start" : "justify-center",
            )}>
              <div
                className={cn(
                  "text-white px-6",
                  isLeft ? "text-left max-w-2xl md:pl-12 lg:pl-20" : "text-center max-w-3xl",
                )}
                style={{ color: slide.textColor ?? "white" }}
              >
                <SlideTitle as={headingFor(i)} className={cn(
                  "font-bold mb-4 drop-shadow",
                  isLeft ? "text-3xl md:text-5xl" : "text-4xl md:text-6xl",
                )}>
                  {slide.title}
                </SlideTitle>
                {slide.subtitle && <p className="text-xl mb-6 opacity-90">{slide.subtitle}</p>}
                {slide.buttonLabel && slide.buttonUrl && (
                  <Link
                    href={slide.buttonUrl}
                    className={data.buttonStyle === "primary"
                      ? "inline-flex items-center px-4 py-2 uppercase text-[15px] tracking-wide transition-opacity hover:opacity-90"
                      : "inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"}
                    style={data.buttonStyle === "primary" ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } : undefined}
                  >
                    {slide.buttonLabel}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {showArrows && slides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 hidden sm:flex bg-black/50 hover:bg-black/70 text-white rounded-full items-center justify-center transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 hidden sm:flex bg-black/50 hover:bg-black/70 text-white rounded-full items-center justify-center transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {showDots && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                dotColor ? (i === current ? "w-6" : "opacity-50 hover:opacity-75") : i === current ? "bg-white w-6" : "bg-white/50 hover:bg-white/75",
              )}
              style={dotColor ? { background: dotColor } : undefined}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SlideTitle({ as: Tag, className, children }: { as: "h1" | "h2"; className?: string; children: React.ReactNode }) {
  return <Tag className={className}>{children}</Tag>;
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { SliderBlockProps } from "@/types/cms";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { data } = block;
  const { slides, autoPlay, autoPlayInterval, showArrows, showDots, height } = data;
  const variant = block.templateVariant;
  const isSplit = variant === "split";
  const isMinimal = variant === "minimal";
  const isLeft = variant === "left-copy";
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (!autoPlay || slides.length < 2) return;
    const timer = setInterval(next, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, next, slides.length]);

  if (!slides.length) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}>
        <p className="text-muted-foreground text-sm">Add slides to this slider</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden w-full" style={{ height }}>
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
              <Image src={slide.imageUrl} alt={slide.title} fill className="object-cover" />
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

          {isSplit ? (
            <div className="absolute inset-0 grid md:grid-cols-2">
              <div className="hidden md:block" />
              <div className="flex items-center bg-background/95 backdrop-blur-sm px-8 lg:px-12">
                <div className="max-w-xl">
                  <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-foreground">{slide.title}</h2>
                  {slide.subtitle && <p className="text-lg mb-6 text-muted-foreground">{slide.subtitle}</p>}
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
                  <h2 className="text-xl md:text-2xl font-semibold text-white truncate">{slide.title}</h2>
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
                <h2 className={cn(
                  "font-bold mb-4 drop-shadow",
                  isLeft ? "text-3xl md:text-5xl" : "text-4xl md:text-6xl",
                )}>
                  {slide.title}
                </h2>
                {slide.subtitle && <p className="text-xl mb-6 opacity-90">{slide.subtitle}</p>}
                {slide.buttonLabel && slide.buttonUrl && (
                  <Link
                    href={slide.buttonUrl}
                    className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
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
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors">
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
                i === current ? "bg-white w-6" : "bg-white/50 hover:bg-white/75",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

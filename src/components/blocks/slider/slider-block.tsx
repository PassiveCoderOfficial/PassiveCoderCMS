"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { SliderBlockProps } from "@/types/cms";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SliderBlock({ block }: { block: SliderBlockProps }) {
  const { data } = block;
  const { slides, autoPlay, autoPlayInterval, showArrows, showDots, height } = data;
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
          {slide.imageUrl ? (
            <Image src={slide.imageUrl} alt={slide.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700" />
          )}
          {slide.overlay && <div className="absolute inset-0 bg-black/40" />}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-3xl px-6" style={{ color: slide.textColor ?? "white" }}>
              <h2 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow">{slide.title}</h2>
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

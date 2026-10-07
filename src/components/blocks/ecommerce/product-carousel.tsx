"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Horizontal snap-scrolling row of product cards with round prev / next arrows. */
export function ProductCarousel({ children, perView }: { children: React.ReactNode; perView: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (dir: number) => {
    const el = ref.current; if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  const btn = "absolute top-[38%] -translate-y-1/2 z-10 hidden sm:flex w-9 h-9 rounded-full bg-white/90 border border-black/10 shadow items-center justify-center hover:bg-white";
  return (
    <div className="relative">
      <button type="button" aria-label="Previous products" onClick={() => go(-1)} className={`${btn} -left-1`}><ChevronLeft className="w-4 h-4" /></button>
      <div ref={ref} className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ ["--pv" as string]: perView }}>
        {React.Children.map(children, (c) => (
          <div className="snap-start shrink-0 basis-[72%] sm:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-(var(--pv)-1)*1.25rem)/var(--pv))]">{c}</div>
        ))}
      </div>
      <button type="button" aria-label="Next products" onClick={() => go(1)} className={`${btn} -right-1`}><ChevronRight className="w-4 h-4" /></button>
    </div>
  );
}

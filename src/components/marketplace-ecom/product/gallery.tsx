"use client";

import { useRef, useState } from "react";
import { ImageOff } from "lucide-react";

/** Swipeable product gallery with counter and thumbnails. */
export function ProductGallery({ images, name, badge }: { images: string[]; name: string; badge?: string | null }) {
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);
  const n = images.length;

  if (!n)
    return (
      <div className="aspect-square rounded-2xl bg-[#F4F4F5] flex items-center justify-center">
        <ImageOff className="w-10 h-10 text-[#D0D5DD]" />
      </div>
    );

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-square overflow-hidden rounded-none sm:rounded-2xl bg-[#F4F4F5]"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) setI((v) => (v + (dx < 0 ? 1 : -1) + n) % n);
          touchX.current = null;
        }}
      >
        <div className="flex h-full transition-transform duration-300" style={{ transform: `translateX(-${i * 100}%)` }}>
          {images.map((src, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={k} src={src} alt={k === 0 ? name : `${name} ${k + 1}`} className="w-full h-full object-cover shrink-0" />
          ))}
        </div>
        {badge && (
          <span className="absolute top-3 left-3 bg-[#FF5A1F] text-white text-xs font-bold px-2 py-1 rounded-md">{badge}</span>
        )}
        {n > 1 && (
          <span className="absolute bottom-3 right-3 bg-black/55 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {i + 1}/{n}
          </span>
        )}
      </div>
      {n > 1 && (
        <div className="flex gap-2 overflow-x-auto px-3 sm:px-0 [scrollbar-width:none]">
          {images.map((src, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${k === i ? "border-[#FF5A1F]" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

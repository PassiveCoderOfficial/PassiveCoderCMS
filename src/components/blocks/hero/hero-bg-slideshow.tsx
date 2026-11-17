"use client";

import React, { useEffect, useState } from "react";
import Image from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

/**
 * Background slideshow for image heroes: the photos cross-fade in turn
 * (data.bgSlides, 2+ images). Fills its positioned parent like an
 * `<Image fill>` would, so variants swap it in for their single photo.
 */
export function HeroBgSlideshow({ images, interval = 5, alt, position, fit = "cover", sizes = "100vw" }: { images: string[]; interval?: number; alt?: string; position?: string; fit?: "cover" | "contain"; sizes?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % images.length), Math.max(2, interval) * 1000);
    return () => clearInterval(t);
  }, [images.length, interval]);
  return (
    <div aria-hidden className="absolute inset-0">
      {images.map((src, n) => (
        <Image key={src + n} src={src} alt={n === 0 ? alt ?? "" : ""} fill sizes={sizes} priority={n === 0}
          className={cn(fit === "contain" ? "object-contain" : "object-cover", "transition-opacity duration-1000", n === i ? "opacity-100" : "opacity-0")}
          style={{ objectPosition: position ?? "center" }} />
      ))}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

/** Main product photo with clickable thumbnails (all photos, the selected one outlined). */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[active]} alt={name} className="w-full aspect-square object-contain" />
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button key={i} type="button" onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`}
              className={cn("aspect-square rounded border overflow-hidden transition", i === active ? "ring-2 ring-foreground" : "opacity-80 hover:opacity-100")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState } from "react";
import type { GalleryBlockProps } from "@/types/cms";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

type GalleryImage = GalleryBlockProps["data"]["images"][number];

function useLightbox(images: GalleryImage[]) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  return { lightboxIndex, setLightboxIndex, images };
}

function LightboxModal({
  images,
  lightboxIndex,
  setLightboxIndex,
}: {
  images: GalleryImage[];
  lightboxIndex: number | null;
  setLightboxIndex: (i: number | null) => void;
}) {
  if (lightboxIndex === null) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
      <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-lg" onClick={() => setLightboxIndex(null)}>
        <X className="h-6 w-6" />
      </button>
      {lightboxIndex > 0 && (
        <button
          className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-lg"
          onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      <div className="relative max-w-4xl max-h-[85vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
        <Image
          src={images[lightboxIndex].url}
          alt={images[lightboxIndex].alt ?? ""}
          fill
          unoptimized
          className="object-contain"
        />
      </div>
      {lightboxIndex < images.length - 1 && (
        <button
          className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-lg"
          onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}
      <div className="absolute bottom-4 text-white/60 text-sm">
        {lightboxIndex + 1} / {images.length}
        {images[lightboxIndex].caption && <span className="ml-3">{images[lightboxIndex].caption}</span>}
      </div>
    </div>
  );
}

function EmptyState({ title }: { title?: string }) {
  return (
    <div className="max-w-7xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>}
      <div className="grid grid-cols-3 gap-3 opacity-30">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <p className="text-center text-muted-foreground text-sm mt-4">No images added yet</p>
    </div>
  );
}

// ─── "masonry-captioned" variant ───────────────────────────────────────────────
// True CSS-columns masonry with always-visible captions. Good for real project
// photo galleries with mixed portrait/landscape shots.
function GalleryMasonryCaptioned({ block }: { block: GalleryBlockProps }) {
  const { data } = block;
  const { title, columns, gap, images, lightbox } = data;
  const { lightboxIndex, setLightboxIndex } = useLightbox(images);

  if (!images.length) return <EmptyState title={title} />;

  const gapMap = { none: "gap-0", sm: "gap-1", md: "gap-3", lg: "gap-6" }[gap] ?? "gap-3";
  const colClassMap = {
    2: "columns-1 md:columns-2",
    3: "columns-2 md:columns-3",
    4: "columns-2 md:columns-4",
    5: "columns-2 md:columns-5",
    6: "columns-2 md:columns-6",
  }[columns] ?? "columns-2 md:columns-3";

  return (
    <div className="max-w-7xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>}

      <div className={cn(colClassMap, gapMap)}>
        {images.map((image, i) => (
          <div
            key={image.id}
            className="relative mb-3 break-inside-avoid overflow-hidden rounded-lg cursor-pointer"
            onClick={() => lightbox && setLightboxIndex(i)}
          >
            <Image
              src={image.url}
              alt={image.alt ?? ""}
              width={800}
              height={600}
              unoptimized
              className="w-full h-auto object-cover"
            />
            {image.caption && (
              <div className="bg-black/60 text-white text-xs px-2 py-1.5">
                {image.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <LightboxModal images={images} lightboxIndex={lightboxIndex} setLightboxIndex={setLightboxIndex} />
      )}
    </div>
  );
}

// ─── "grid-clean" variant ──────────────────────────────────────────────────────
// Tighter, minimal, editorial grid: small gap, no rounded corners, no hover
// zoom/darken. Captions only appear in the lightbox.
function GalleryGridClean({ block }: { block: GalleryBlockProps }) {
  const { data } = block;
  const { title, columns, images, lightbox } = data;
  const { lightboxIndex, setLightboxIndex } = useLightbox(images);

  if (!images.length) return <EmptyState title={title} />;

  const colMap = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-5",
    6: "grid-cols-3 md:grid-cols-6",
  }[columns] ?? "grid-cols-3";

  return (
    <div className="max-w-7xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>}

      <div className={cn("grid gap-0.5", colMap)}>
        {images.map((image, i) => (
          <div
            key={image.id}
            className="relative aspect-square overflow-hidden cursor-pointer"
            onClick={() => lightbox && setLightboxIndex(i)}
          >
            <Image src={image.url} alt={image.alt ?? ""} fill unoptimized className="object-cover" />
          </div>
        ))}
      </div>

      {lightbox && (
        <LightboxModal images={images} lightboxIndex={lightboxIndex} setLightboxIndex={setLightboxIndex} />
      )}
    </div>
  );
}

// ─── Legacy layout (used when no templateVariant) ─────────────────────────────
function GalleryLegacy({ block }: { block: GalleryBlockProps }) {
  const { data } = block;
  const { title, columns, gap, images, lightbox } = data;
  const { lightboxIndex, setLightboxIndex } = useLightbox(images);

  const gapMap = { none: "gap-0", sm: "gap-1", md: "gap-3", lg: "gap-6" }[gap] ?? "gap-3";
  const colMap = { 2: "grid-cols-2", 3: "grid-cols-2 md:grid-cols-3", 4: "grid-cols-2 md:grid-cols-4", 5: "grid-cols-2 md:grid-cols-5", 6: "grid-cols-3 md:grid-cols-6" }[columns] ?? "grid-cols-3";

  if (!images.length) return <EmptyState title={title} />;

  return (
    <div className="max-w-7xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>}

      <div className={cn("grid", colMap, gapMap)}>
        {images.map((image, i) => (
          <div
            key={image.id}
            className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
            onClick={() => lightbox && setLightboxIndex(i)}
          >
            <Image src={image.url} alt={image.alt ?? ""} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-300" />
            {lightbox && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity" />
              </div>
            )}
            {image.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {image.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <LightboxModal images={images} lightboxIndex={lightboxIndex} setLightboxIndex={setLightboxIndex} />
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function GalleryBlock({ block }: { block: GalleryBlockProps }) {
  const variant = block.templateVariant;
  if (variant === "masonry-captioned") return <GalleryMasonryCaptioned block={block} />;
  if (variant === "grid-clean") return <GalleryGridClean block={block} />;
  return <GalleryLegacy block={block} />;
}

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

function GalleryHead({ title }: { title?: string }) {
  if (!title) return null;
  return <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>;
}

// ─── Variant: hero-mosaic ─────────────────────────────────────────────────────
// One large lead image with a supporting grid — gives a gallery a focal point
// instead of treating every shot as equal.
function GalleryHeroMosaic({ block }: { block: GalleryBlockProps }) {
  const { title, images, lightbox } = block.data;
  const { lightboxIndex, setLightboxIndex } = useLightbox(images);
  if (!images.length) return <EmptyState title={title} />;

  const [lead, ...rest] = images;
  return (
    <div className="max-w-7xl mx-auto">
      <GalleryHead title={title} />
      <div className="grid gap-2 md:grid-cols-2">
        <div
          className="relative aspect-[4/3] md:aspect-auto md:row-span-2 overflow-hidden rounded-xl cursor-pointer"
          onClick={() => lightbox && setLightboxIndex(0)}
        >
          <Image src={lead.url} alt={lead.alt ?? ""} fill unoptimized className="object-cover" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {rest.slice(0, 4).map((image, i) => (
            <div
              key={image.id}
              className="relative aspect-square overflow-hidden rounded-xl cursor-pointer"
              onClick={() => lightbox && setLightboxIndex(i + 1)}
            >
              <Image src={image.url} alt={image.alt ?? ""} fill unoptimized className="object-cover" />
            </div>
          ))}
        </div>
      </div>
      {lightbox && <LightboxModal images={images} lightboxIndex={lightboxIndex} setLightboxIndex={setLightboxIndex} />}
    </div>
  );
}

// ─── Variant: filmstrip ───────────────────────────────────────────────────────
// Horizontal scrolling strip — compact, and works well when a gallery is a
// secondary element rather than the main event.
function GalleryFilmstrip({ block }: { block: GalleryBlockProps }) {
  const { title, images, lightbox } = block.data;
  const { lightboxIndex, setLightboxIndex } = useLightbox(images);
  if (!images.length) return <EmptyState title={title} />;

  return (
    <div className="max-w-7xl mx-auto">
      <GalleryHead title={title} />
      <div className="flex gap-3 overflow-x-auto pb-3 snap-x">
        {images.map((image, i) => (
          <div
            key={image.id}
            className="relative h-56 w-72 shrink-0 snap-start overflow-hidden rounded-xl cursor-pointer"
            onClick={() => lightbox && setLightboxIndex(i)}
          >
            <Image src={image.url} alt={image.alt ?? ""} fill unoptimized className="object-cover" />
          </div>
        ))}
      </div>
      {lightbox && <LightboxModal images={images} lightboxIndex={lightboxIndex} setLightboxIndex={setLightboxIndex} />}
    </div>
  );
}

// ─── Variant: captioned-cards ─────────────────────────────────────────────────
// Each image in a card with its caption always visible — for project galleries
// where the context matters as much as the photo.
function GalleryCaptionedCards({ block }: { block: GalleryBlockProps }) {
  const { title, columns, images, lightbox } = block.data;
  const { lightboxIndex, setLightboxIndex } = useLightbox(images);
  if (!images.length) return <EmptyState title={title} />;

  const colMap = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4", 5: "sm:grid-cols-3 lg:grid-cols-5", 6: "sm:grid-cols-3 lg:grid-cols-6" }[columns] ?? "sm:grid-cols-3";

  return (
    <div className="max-w-7xl mx-auto">
      <GalleryHead title={title} />
      <div className={cn("grid grid-cols-1 gap-4", colMap)}>
        {images.map((image, i) => (
          <div key={image.id} className="overflow-hidden rounded-xl border bg-card">
            <div
              className="relative aspect-[4/3] cursor-pointer overflow-hidden"
              onClick={() => lightbox && setLightboxIndex(i)}
            >
              <Image src={image.url} alt={image.alt ?? ""} fill unoptimized className="object-cover transition-transform duration-500 hover:scale-105" />
            </div>
            {(image.caption || image.alt) && (
              <p className="px-3.5 py-3 text-sm text-muted-foreground leading-snug">{image.caption ?? image.alt}</p>
            )}
          </div>
        ))}
      </div>
      {lightbox && <LightboxModal images={images} lightboxIndex={lightboxIndex} setLightboxIndex={setLightboxIndex} />}
    </div>
  );
}

// ─── Variant: full-bleed-rows ─────────────────────────────────────────────────
// Wide cinematic bands, one per row. Slow, deliberate — architecture,
// interiors, photography portfolios.
function GalleryFullBleedRows({ block }: { block: GalleryBlockProps }) {
  const { title, images, lightbox } = block.data;
  const { lightboxIndex, setLightboxIndex } = useLightbox(images);
  if (!images.length) return <EmptyState title={title} />;

  return (
    <div className="max-w-6xl mx-auto">
      <GalleryHead title={title} />
      <div className="space-y-4">
        {images.map((image, i) => (
          <div
            key={image.id}
            className="relative aspect-[21/9] overflow-hidden rounded-xl cursor-pointer group"
            onClick={() => lightbox && setLightboxIndex(i)}
          >
            <Image src={image.url} alt={image.alt ?? ""} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            {image.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                <p className="text-white text-sm font-medium">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {lightbox && <LightboxModal images={images} lightboxIndex={lightboxIndex} setLightboxIndex={setLightboxIndex} />}
    </div>
  );
}

// ─── Variant: polaroid-scatter ────────────────────────────────────────────────
// Slightly rotated framed shots — informal and warm. Cafés, events, community
// businesses where polish would feel wrong.
function GalleryPolaroidScatter({ block }: { block: GalleryBlockProps }) {
  const { title, images, lightbox } = block.data;
  const { lightboxIndex, setLightboxIndex } = useLightbox(images);
  if (!images.length) return <EmptyState title={title} />;

  // Fixed rotation cycle rather than random, so the layout is stable across
  // renders and doesn't shuffle on every hydration.
  const tilts = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-0", "-rotate-1"];

  return (
    <div className="max-w-6xl mx-auto">
      <GalleryHead title={title} />
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, i) => (
          <div
            key={image.id}
            className={cn(
              "bg-card p-2.5 pb-8 shadow-lg cursor-pointer transition-transform hover:rotate-0 hover:scale-105",
              tilts[i % tilts.length],
            )}
            onClick={() => lightbox && setLightboxIndex(i)}
          >
            <div className="relative aspect-square overflow-hidden">
              <Image src={image.url} alt={image.alt ?? ""} fill unoptimized className="object-cover" />
            </div>
            {image.caption && (
              <p className="mt-2 text-center text-xs text-muted-foreground truncate">{image.caption}</p>
            )}
          </div>
        ))}
      </div>
      {lightbox && <LightboxModal images={images} lightboxIndex={lightboxIndex} setLightboxIndex={setLightboxIndex} />}
    </div>
  );
}

// ─── Variant: dark-grid ───────────────────────────────────────────────────────
// Tight grid on a dark panel, letting the images carry all the colour.
function GalleryDarkGrid({ block }: { block: GalleryBlockProps }) {
  const { title, columns, images, lightbox } = block.data;
  const { lightboxIndex, setLightboxIndex } = useLightbox(images);
  if (!images.length) return <EmptyState title={title} />;

  const colMap = { 2: "grid-cols-2", 3: "grid-cols-2 sm:grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4", 5: "grid-cols-2 sm:grid-cols-5", 6: "grid-cols-3 sm:grid-cols-6" }[columns] ?? "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="max-w-7xl mx-auto">
      <GalleryHead title={title} />
      <div className="rounded-2xl bg-foreground/5 p-3">
        <div className={cn("grid gap-1.5", colMap)}>
          {images.map((image, i) => (
            <div
              key={image.id}
              className="relative aspect-square overflow-hidden rounded-lg cursor-pointer"
              onClick={() => lightbox && setLightboxIndex(i)}
            >
              <Image src={image.url} alt={image.alt ?? ""} fill unoptimized className="object-cover" />
            </div>
          ))}
        </div>
      </div>
      {lightbox && <LightboxModal images={images} lightboxIndex={lightboxIndex} setLightboxIndex={setLightboxIndex} />}
    </div>
  );
}

export function GalleryBlock({ block }: { block: GalleryBlockProps }) {
  switch (block.templateVariant) {
    case "masonry-captioned": return <GalleryMasonryCaptioned block={block} />;
    case "grid-clean": return <GalleryGridClean block={block} />;
    case "hero-mosaic": return <GalleryHeroMosaic block={block} />;
    case "filmstrip": return <GalleryFilmstrip block={block} />;
    case "captioned-cards": return <GalleryCaptionedCards block={block} />;
    case "full-bleed-rows": return <GalleryFullBleedRows block={block} />;
    case "polaroid-scatter": return <GalleryPolaroidScatter block={block} />;
    case "dark-grid": return <GalleryDarkGrid block={block} />;
  }
  return <GalleryLegacy block={block} />;
}

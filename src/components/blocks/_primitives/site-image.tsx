import React from "react";

/**
 * The one image element for public-site blocks.
 *
 * Why not next/image everywhere: next.config.ts allows every remote host
 * (clients paste image URLs from anywhere), which makes Vercel's optimizer
 * an open, billed resize proxy — every extra next/image call site adds
 * optimization volume. Most images on client sites don't need it: 2,403 of
 * ~2,730 image URLs across published pages (checked 2026-09-26) are on
 * images.unsplash.com, which resizes itself from URL params for free, and
 * Pexels does the same.
 *
 * So: for hosts that resize by URL, emit a real srcset (phones stop
 * downloading the 1200-1920px originals every template ships with) plus
 * auto=format (WebP/AVIF where the browser supports it). For every other
 * host (Supabase uploads, client-pasted URLs), a plain <img> — but always
 * lazy + async-decoded, which the raw <img> tags this replaces mostly
 * weren't. Server-safe (no "use client") so server blocks render it with
 * zero client JS; client blocks can import it just the same.
 */

type ResizableHost = "unsplash" | "pexels";

function resizableHost(url: URL): ResizableHost | null {
  if (url.hostname === "images.unsplash.com") return "unsplash";
  if (url.hostname === "images.pexels.com") return "pexels";
  return null;
}

function withWidth(url: URL, host: ResizableHost, width: number): string {
  const u = new URL(url.toString());
  u.searchParams.set("w", String(width));
  if (host === "unsplash") {
    u.searchParams.set("auto", "format");
    if (!u.searchParams.has("q")) u.searchParams.set("q", "75");
    // A fixed height/crop from the original URL would distort at other widths.
    u.searchParams.delete("h");
  } else {
    u.searchParams.set("auto", "compress");
    u.searchParams.set("cs", "tinysrgb");
    u.searchParams.delete("h");
  }
  return u.toString();
}

const DEFAULT_WIDTHS = [320, 640, 960, 1280, 1920];

export interface SiteImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> {
  src?: string | null;
  alt: string;
  /** Candidate widths for srcset (resizable hosts only). */
  widths?: number[];
  /** How wide this image renders at each breakpoint. Defaults to full
   *  viewport width — pass the real layout (e.g. "(min-width: 768px) 50vw,
   *  100vw") so the browser picks the smallest adequate file. */
  sizes?: string;
  /** Above-the-fold images: load eagerly instead of lazily. */
  priority?: boolean;
}

export function SiteImage({ src, alt, widths = DEFAULT_WIDTHS, sizes = "100vw", priority = false, ...rest }: SiteImageProps) {
  if (!src) return null;

  const loading = priority ? "eager" : "lazy";
  let parsed: URL | null = null;
  try {
    parsed = new URL(src);
  } catch {
    // Relative path or malformed URL — nothing to rewrite, render as given.
  }
  const host = parsed ? resizableHost(parsed) : null;

  if (!parsed || !host) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={loading} decoding="async" {...rest} />;
  }

  const sorted = [...widths].sort((a, b) => a - b);
  const srcSet = sorted.map((w) => `${withWidth(parsed, host, w)} ${w}w`).join(", ");
  // Fallback src for browsers that ignore srcset: a middle size, not the
  // largest, so the no-srcset path isn't the most expensive one.
  const fallback = withWidth(parsed, host, sorted[Math.min(sorted.length - 1, Math.floor(sorted.length / 2) + 1)]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={fallback} srcSet={srcSet} sizes={sizes} alt={alt} loading={loading} decoding="async" {...rest} />
  );
}

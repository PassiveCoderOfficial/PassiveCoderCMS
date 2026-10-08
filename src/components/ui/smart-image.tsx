"use client";

import NextImage, { type ImageLoader, type ImageProps } from "next/image";

/**
 * Drop-in replacement for `next/image` — import this instead, same props.
 *
 * Vercel's image optimizer is a metered quota (Hobby: a fixed monthly
 * allowance; exhaust it and optimization stops for every client site at
 * once). next.config used to allow every remote host so clients could paste
 * image URLs from anywhere, which made /_next/image an open resize proxy
 * anyone could burn that quota through. Found 2026-09-27.
 *
 * Now each image picks the cheapest correct path:
 *   - Unsplash / Pexels (~88% of client images): resized by their own free
 *     CDN via URL params — still a real responsive srcset, no Vercel cost.
 *   - Our own Supabase storage + local /public files: Vercel's optimizer
 *     (the only hosts next.config now allows).
 *   - Any other host (a client's own domain, a pasted URL): served as-is,
 *     unoptimized — it still displays, it just isn't resized.
 * With every call site going through here, next.config's remotePatterns can
 * be locked to our own bucket and the optimizer refuses everything else.
 *
 * Client component on purpose: `loader` is a function, and functions can't
 * be passed from a Server Component into next/image. Callers (server or
 * client) only pass serializable props, same as before.
 */

const OWN_STORAGE_HOST = "mljchiaabgvdzdsfobxs.supabase.co";

const cdnLoader = (host: "unsplash" | "pexels"): ImageLoader => ({ src, width, quality }) => {
  const u = new URL(src);
  u.searchParams.set("w", String(width));
  u.searchParams.delete("h"); // a fixed crop from the original URL would distort other widths
  if (host === "unsplash") {
    u.searchParams.set("auto", "format");
    u.searchParams.set("q", String(quality ?? 75));
  } else {
    u.searchParams.set("auto", "compress");
    u.searchParams.set("cs", "tinysrgb");
  }
  return u.toString();
};
const unsplashLoader = cdnLoader("unsplash");
const pexelsLoader = cdnLoader("pexels");

type Route = { loader?: ImageLoader; unoptimized?: boolean };

function route(src: ImageProps["src"]): Route {
  if (typeof src !== "string") return {}; // static import — local file, optimizer is fine
  if (src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:")) return {};
  let host: string;
  try {
    host = new URL(src).hostname;
  } catch {
    return { unoptimized: true };
  }
  // Served straight from storage. The Vercel optimizer quota ran out
  // (2026-10-08: /_next/image answered 402 for every uncached image, so new
  // uploads showed as broken on every client site); storage files are
  // already sized at upload, and Supabase image transforms are not on our plan.
  if (host === OWN_STORAGE_HOST) return { unoptimized: true };
  if (host === "images.unsplash.com") return { loader: unsplashLoader };
  if (host === "images.pexels.com") return { loader: pexelsLoader };
  return { unoptimized: true };
}

export default function SmartImage(props: ImageProps) {
  const r = route(props.src);
  // An explicit prop from the caller always wins (e.g. gallery passes
  // `unoptimized` deliberately).
  return <NextImage {...r} {...props} />;
}

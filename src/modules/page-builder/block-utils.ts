import type { Block, BlockBackground } from "@/types/cms";
import { hexToRgba } from "@/lib/utils";

/**
 * A block's custom color/gradient background is a literal value the editor
 * picked (e.g. "#ffffff") — it has no idea whether the visitor's browser is
 * in light or dark mode, and never changes. The block's own text, though,
 * mostly uses theme-aware Tailwind classes with no explicit color (e.g.
 * `<h2 className="text-3xl font-bold">`), which DOES flip to a near-white
 * default in dark mode. A "system"-theme tenant (the default — most tenants
 * never pin light/dark, see (site)/layout.tsx's siteTheme lock) with any
 * custom block background color got white text on a background that stayed
 * white — found live on a real tenant, dozens of blocks across hundreds of
 * pages platform-wide use a custom color/gradient background.
 *
 * Fix: custom color/gradient backgrounds are set via a CSS custom property
 * (--pc-block-bg) plus the `pc-block-bg` class (see globals.css), which
 * `html.dark` overrides to the theme's own --background token instead of
 * the literal picked color. Light mode / no OS dark preference is
 * unaffected — the editor's chosen color still shows exactly as picked.
 */
export interface BlockBackgroundResult {
  style: React.CSSProperties;
  /** Add to the element's className alongside style — see globals.css for
   *  what these do in dark mode. Undefined for none/image backgrounds. */
  className?: string;
}

export function getBlockBackground(bg: BlockBackground): BlockBackgroundResult {
  if (!bg || bg.type === "none") return { style: {} };
  if (bg.type === "color") {
    return { style: { ["--pc-block-bg" as string]: bg.color } as React.CSSProperties, className: "pc-block-bg" };
  }
  if (bg.type === "gradient") {
    return { style: { ["--pc-block-bg" as string]: bg.gradient } as React.CSSProperties, className: "pc-block-bg-gradient" };
  }
  if (bg.type === "image") {
    // imageOverlay is a plain hex color (e.g. seed-template.ts sets it to a
    // template's brand color) — composited as a flat rgba wash baked into
    // the same backgroundImage layer as the photo, so it's guaranteed to
    // cover exactly the same box as the image (including padding).
    const overlayOpacity = bg.imageOverlayOpacity ?? 0.5;
    const overlayFrom = bg.imageOverlay ? hexToRgba(bg.imageOverlay, overlayOpacity) : undefined;
    const overlayTo = bg.imageOverlay
      ? hexToRgba(bg.imageOverlayTo ?? bg.imageOverlay, overlayOpacity)
      : undefined;
    const overlayLayer = overlayFrom ? `linear-gradient(135deg, ${overlayFrom}, ${overlayTo}), ` : "";
    return {
      style: {
        backgroundImage: `${overlayLayer}url(${bg.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      },
    };
  }
  return { style: {} };
}

/** Hero's "Section Overlay" controls (data.overlayColor/overlayColorTo/
 *  overlayOpacity) tint the section's own background image — but that image
 *  lives on block.background, rendered by the generic block wrapper outside
 *  hero-block.tsx entirely, on a box that also includes padding. A
 *  same-component absolutely-positioned overlay div only ever covers that
 *  component's own content box, leaving the padding ring untinted. Folding
 *  the overlay into block.background here (same getBlockBackground()
 *  composite the section background image already uses) guarantees full
 *  coverage since it's the exact same CSS box. Only applies when the hero
 *  actually has a background image set — text-only/color/gradient
 *  backgrounds have nothing for a "tint the photo" control to affect. */
export function withHeroOverlay(block: Block): BlockBackground {
  if (block.type !== "hero" || block.background.type !== "image") return block.background;
  const { overlayColor, overlayColorTo, overlayOpacity } = block.data;
  if (!overlayColor) return block.background;
  return {
    ...block.background,
    imageOverlay: overlayColor,
    imageOverlayTo: overlayColorTo,
    imageOverlayOpacity: overlayOpacity,
  };
}

export function getContainerClass(width: string): string {
  const map: Record<string, string> = {
    full: "w-full",
    wide: "max-w-7xl mx-auto px-6",
    normal: "max-w-5xl mx-auto px-6",
    narrow: "max-w-3xl mx-auto px-6",
  };
  return map[width] ?? "w-full";
}

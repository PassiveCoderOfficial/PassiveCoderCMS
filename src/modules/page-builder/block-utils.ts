import type { Block, BlockBackground } from "@/types/cms";
import { hexToRgba } from "@/lib/utils";

export function getBlockBackground(bg: BlockBackground): React.CSSProperties {
  if (!bg || bg.type === "none") return {};
  if (bg.type === "color") return { backgroundColor: bg.color };
  if (bg.type === "gradient") return { background: bg.gradient };
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
      backgroundImage: `${overlayLayer}url(${bg.imageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }
  return {};
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

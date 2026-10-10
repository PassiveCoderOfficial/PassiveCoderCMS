import type { Block, BlockBackground } from "@/types/cms";
import { hexToRgba } from "@/lib/utils";
import { hexToHSL } from "@/modules/themes/template-css";

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

/**
 * The block's section wrapper styling: padding/margin plus the shared Style
 * panel (text colour, border, radius, shadow, min height, per-device
 * padding). One function for both the live site wrapper (page-renderer) and
 * the editor canvas wrapper (block-renderer), so the two can't drift.
 *
 * Per-device padding needs media queries, which inline styles can't do: when
 * any tablet/mobile override is set, padding moves to CSS vars read by the
 * `pc-rpad` class in globals.css (breakpoints match hideOn: 640 / 1024px).
 */
export function getBlockWrapperStyle(block: Block): { style: React.CSSProperties; className: string } {
  const pad = block.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const margin = block.margin ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const st = block.style ?? {};
  const classes: string[] = [];
  const style: Record<string, string | number | undefined> = {
    paddingRight: pad.right,
    paddingLeft: pad.left,
    marginTop: margin.top,
    marginBottom: margin.bottom,
  };

  const t = st.paddingTablet, m = st.paddingMobile;
  const responsive = [t?.top, t?.bottom, m?.top, m?.bottom].some((v) => typeof v === "number");
  if (responsive) {
    const tTop = t?.top ?? pad.top, tBottom = t?.bottom ?? pad.bottom;
    Object.assign(style, {
      "--pc-pt": `${pad.top}px`, "--pc-pb": `${pad.bottom}px`,
      "--pc-pt-t": `${tTop}px`, "--pc-pb-t": `${tBottom}px`,
      "--pc-pt-m": `${m?.top ?? tTop}px`, "--pc-pb-m": `${m?.bottom ?? tBottom}px`,
    });
    classes.push("pc-rpad");
  } else {
    style.paddingTop = pad.top;
    style.paddingBottom = pad.bottom;
  }

  if (st.textColor) {
    style.color = st.textColor;
    // Blocks colour most section text via the --foreground token rather
    // than inheritance, so re-point it for this section too.
    if (/^#[0-9a-f]{6}$/i.test(st.textColor)) {
      const hsl = hexToHSL(st.textColor);
      style["--foreground"] = hsl;
      // Secondary text and dividers follow the section's text colour too,
      // otherwise grey-on-navy descriptions and navy rules disappear.
      const [h, s, l] = hsl.split(" ").map((v) => parseFloat(v));
      const light = l > 55;
      style["--muted-foreground"] = `${h} ${Math.min(s, 35)}% ${light ? Math.max(l - 22, 62) : Math.min(l + 30, 45)}%`;
      style["--border"] = `${h} ${Math.min(s, 30)}% ${light ? 30 : 85}%`;
    }
    // Cards inside keep their own readable text (see .pc-tc in globals.css):
    // white text on a dark section must not turn white-card titles invisible.
    classes.push("pc-tc");
  }
  if (st.borderWidth) {
    style.borderWidth = st.borderWidth;
    style.borderStyle = "solid";
    style.borderColor = st.borderColor || "hsl(var(--border))";
  }
  if (st.radius) {
    style.borderRadius = st.radius;
    style.overflow = "hidden";
  }
  if (st.shadow && st.shadow !== "none") style.boxShadow = `var(--shadow-${st.shadow})`;
  if (st.minHeight) {
    style.minHeight = `${Math.min(100, Math.max(0, st.minHeight))}vh`;
    style.display = "flex";
    style.flexDirection = "column";
    style.justifyContent = st.verticalAlign === "bottom" ? "flex-end" : st.verticalAlign === "top" ? "flex-start" : "center";
  }

  // Typography & alignment — CSS variables + marker classes, rules in globals.css.
  if (st.align) classes.push(`pc-al-${st.align}`);
  if (st.cardAlign) classes.push(`pc-ca-${st.cardAlign}`);
  if (st.headingFont) { style["--pc-hf"] = `var(--font-anek, "Anek Bangla"), "${st.headingFont}", var(--heading-font, inherit)`; classes.push("pc-hf"); }
  if (st.headingSize) { style["--pc-h2"] = `${st.headingSize}px`; classes.push("pc-h2"); }
  if (st.cardTitleSize) { style["--pc-h3"] = `${st.cardTitleSize}px`; classes.push("pc-h3"); }
  if (st.textSize) { style["--pc-tx"] = `${st.textSize}px`; classes.push("pc-tx"); }
  if (st.cardTitleCase) { style["--pc-tt"] = st.cardTitleCase; classes.push("pc-tt"); }

  return { style: style as React.CSSProperties, className: classes.join(" ") };
}

/**
 * Hide-only elements for block types whose layouts skip an empty field (the
 * section title/subtitle on services, features, pricing…): the hidden fields
 * are blanked on a render-only copy, so every layout honours it without
 * per-layout changes and the saved text comes back when shown again. Used by
 * both the live renderer and the editor canvas.
 */
export function applyHiddenElements<T extends Block>(block: T): T {
  const hidden = block.elements?.hidden;
  const data = (block as { data?: Record<string, unknown> }).data;
  if (!hidden?.length || !data) return block;
  const next = { ...data };
  let changed = false;
  for (const k of hidden) {
    if (typeof next[k] === "string" && next[k]) { next[k] = ""; changed = true; }
  }
  return changed ? ({ ...block, data: next } as T) : block;
}

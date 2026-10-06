/**
 * Converts a TemplatePalette + TemplateTypography into CSS custom properties
 * injected at :root. These override the Tailwind CSS variables so the entire
 * public site reflects the active template's visual identity without any
 * class changes on individual elements.
 *
 * Also injects a `.template-<slug>` class on <html> so template-specific
 * CSS rules in customCss can target elements precisely.
 *
 * Beyond the core color/font tokens this also emits a full design-system
 * scale — accent, semantic surfaces, a shadow ladder, a spacing rhythm, and
 * gradient/ring tokens — so every block can pull consistent, brand-aware
 * design values from one source instead of hardcoding grays and hexes.
 * These extra tokens are additive: blocks that don't use them are unaffected,
 * and tenants on older templates still render exactly as before.
 */

import type { TemplatePalette, TemplateTypography, SiteDesign } from "./template-types";
import { googleFontsHref } from "./fonts";

/** Tailwind v4 default radius scale, multiplied by the roundness choice. */
const RADIUS_BASE: Record<string, number> = { xs: 0.125, sm: 0.25, md: 0.375, lg: 0.5, xl: 0.75, "2xl": 1, "3xl": 1.5 };
const ROUNDNESS_SCALE: Record<NonNullable<SiteDesign["roundness"]>, number> = { sharp: 0, soft: 0.5, rounded: 1, extra: 1.75 };
const SHADOW_SCALE: Record<NonNullable<SiteDesign["shadow"]>, number> = { none: 0, subtle: 0.5, normal: 1, bold: 1.9 };

function hexToHSLParts(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!result) return { h: 0, s: 0, l: 50 };
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hexToHSL(hex: string): string {
  const { h, s, l } = hexToHSLParts(hex);
  return `${h} ${s}% ${l}%`;
}

/** Lighten/darken an HSL token by a lightness delta, clamped to [0,100]. */
function shiftL(hex: string, deltaL: number): string {
  const { h, s, l } = hexToHSLParts(hex);
  const nl = Math.max(0, Math.min(100, l + deltaL));
  return `${h} ${s}% ${nl}%`;
}

/** True when a color is dark enough that white text sits on it comfortably. */
function isDark(hex: string): boolean {
  return hexToHSLParts(hex).l < 50;
}

export function buildTemplateCSSVars(
  palette: TemplatePalette,
  typography: TemplateTypography,
  /**
   * CSS selector these vars are scoped under. Defaults to `:root` for the
   * published site and template preview, where there is no admin chrome to
   * conflict with.
   *
   * The page editor passes `.cms-canvas-light` instead: injecting at
   * `:root` there overrides the ADMIN dashboard's own
   * --background/--foreground for the whole shell (sidebar, toolbar, panels),
   * not just the canvas, because this rule and the dashboard's `.dark`
   * class rule have equal specificity and this one is injected later in the
   * document, so it silently wins and the dark-mode toggle stops doing
   * anything on the editor route. Scoping to the canvas wrapper keeps the
   * tenant palette confined to block content, same as the `revert` trick
   * in globals.css already assumes it will be.
   */
  scopeSelector = ":root",
  /** Site owner's design settings (site_identity.design_overrides). */
  design?: SiteDesign | null,
): string {
  const p = (hex: string) => hexToHSL(hex);
  typography = {
    ...typography,
    ...(design?.headingFont ? { headingFont: design.headingFont } : {}),
    ...(design?.bodyFont ? { bodyFont: design.bodyFont } : {}),
    ...(design?.headingWeight ? { headingWeight: design.headingWeight } : {}),
    ...(design?.letterSpacing ? { letterSpacing: design.letterSpacing } : {}),
  };
  const k = design?.shadow ? SHADOW_SCALE[design.shadow] ?? 1 : 1;
  // Shadow alpha, scaled by the site's shadow choice; "none" drops them.
  const a = (x: number) => +(x * k).toFixed(3);
  // Wrap single font names in quotes, but pass through font stacks / CSS var() refs as-is.
  // Some templates store a stack like "var(--font-poppins), Poppins". That var
  // is defined on <body> by next/font, not on :root where these tokens live,
  // so it resolves to nothing here and invalidates the whole stack (text fell
  // back to the system UI font). Drop var() refs and keep the named family,
  // which googleFontsHref then loads.
  const fontVal = (f: string) => {
    const clean = f.replace(/var\([^)]*\)\s*,?\s*/g, "").trim().replace(/,$/, "");
    if (!clean) return "inherit";
    return /,/.test(clean) ? clean : `'${clean.replace(/['"]/g, "")}'`;
  };

  const darkBg = isDark(palette.background);
  // Surface ladder: subtle elevation steps derived from the card color so
  // stacked cards/sections read with depth on both light and dark templates.
  const surface1 = shiftL(palette.card, darkBg ? 3 : -1.5);
  const surface2 = shiftL(palette.card, darkBg ? 6 : -3);
  // Accent support tones for hover/soft-fill usage.
  const primarySoft = shiftL(palette.primary, darkBg ? -18 : 40);
  const accentSoft = shiftL(palette.accent, darkBg ? -18 : 38);

  const fontsHref = googleFontsHref([typography.headingFont, typography.bodyFont]);
  const scale = design?.roundness ? ROUNDNESS_SCALE[design.roundness] ?? 1 : null;
  const radiusVars = scale == null ? "" : Object.entries(RADIUS_BASE)
    .map(([n, v]) => `  --radius-${n}: ${+(v * scale).toFixed(3)}rem;`)
    .concat(`  --radius: ${+(0.5 * scale).toFixed(3)}rem;`)
    .join("\n");
  // Body text element: on the live site that's <body>; in the editor the
  // vars are scoped to the canvas wrapper, so the wrapper carries it.
  const bodySel = scopeSelector === ":root" ? "body" : scopeSelector;

  // Cinematic sites open with a brand-colour curtain that lifts away. Pure
  // CSS so it covers the very first paint (no flash of the page first).
  const curtainCss = design?.motion === "cinematic" && scopeSelector === ":root"
    ? `@keyframes pc-curtain{0%,35%{clip-path:inset(0 0 0 0)}100%{clip-path:inset(0 0 100% 0)}}
@media (prefers-reduced-motion:no-preference){body::after{content:"";position:fixed;inset:0;z-index:9999;pointer-events:none;background:linear-gradient(160deg,hsl(var(--primary)),hsl(var(--secondary)));animation:pc-curtain 1.5s cubic-bezier(.7,0,.2,1) forwards}}
`
    : "";
  return `
${fontsHref ? `@import url("${fontsHref}");\n` : ""}${curtainCss}${scopeSelector} {
  --pc-motion: ${design?.motion ?? "none"};
  --background: ${p(palette.background)};
  --foreground: ${p(palette.foreground)};
  --card: ${p(palette.card)};
  --card-foreground: ${p(palette.foreground)};
  --popover: ${p(palette.card)};
  --popover-foreground: ${p(palette.foreground)};
  --primary: ${p(palette.primary)};
  --primary-foreground: ${p(palette.primaryFg)};
  --secondary: ${p(palette.secondary)};
  --secondary-foreground: ${p(palette.primaryFg)};
  --muted: ${p(palette.muted)};
  --muted-foreground: ${p(palette.mutedFg)};
  --pc-fg-root: ${p(palette.foreground)};
  --pc-muted-root: ${p(palette.mutedFg)};
  --pc-border-root: ${p(palette.border)};
  --accent: ${p(palette.accent)};
  --accent-foreground: ${p(palette.foreground)};
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: ${p(palette.border)};
  --input: ${p(palette.border)};
  --ring: ${p(palette.ring)};
  --radius: ${palette.borderRadius};
  --heading-font: ${fontVal(typography.headingFont)}, sans-serif;
  --body-font: ${fontVal(typography.bodyFont)}, sans-serif;
  --heading-weight: ${typography.headingWeight};
  --letter-spacing-heading: ${typography.letterSpacing};

  /* ── Extended design-system tokens (additive) ─────────────────────── */
  /* Elevated surfaces for layered cards/panels */
  --surface-1: ${surface1};
  --surface-2: ${surface2};
  /* Soft brand fills for chips, hovers, icon backers */
  --primary-soft: ${primarySoft};
  --accent-soft: ${accentSoft};
  /* Signature brand gradient (primary → accent) */
  --brand-gradient: linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%);
  --brand-gradient-soft: linear-gradient(135deg, hsl(${primarySoft}) 0%, hsl(${accentSoft}) 100%);

  /* Shadow ladder — warm, brand-neutral, tuned for elevation not just drop */
  --shadow-xs: 0 1px 2px 0 hsl(${p(palette.foreground)} / ${a(0.05)});
  --shadow-sm: 0 1px 3px 0 hsl(${p(palette.foreground)} / ${a(0.08)}), 0 1px 2px -1px hsl(${p(palette.foreground)} / ${a(0.06)});
  --shadow-md: 0 4px 12px -2px hsl(${p(palette.foreground)} / ${a(0.10)}), 0 2px 6px -2px hsl(${p(palette.foreground)} / ${a(0.06)});
  --shadow-lg: 0 12px 28px -6px hsl(${p(palette.foreground)} / ${a(0.14)}), 0 6px 12px -6px hsl(${p(palette.foreground)} / ${a(0.08)});
  --shadow-xl: 0 24px 48px -12px hsl(${p(palette.foreground)} / ${a(0.20)});
  --shadow-primary: 0 8px 24px -6px hsl(${p(palette.primary)} / ${a(0.35)});

  /* Spacing rhythm — consistent vertical section cadence */
  --section-py-sm: 3rem;
  --section-py: 5rem;
  --section-py-lg: 7rem;

  /* Motion */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 150ms;
  --dur: 240ms;
  --dur-slow: 400ms;
${radiusVars}
}
/* Site typography. Families are unlayered so they win over Tailwind's
   font-sans on <body>; a block's own inline font choice still wins. Weight
   and tracking sit in the base layer so a block's utility classes win. */
${bodySel} { font-family: var(--body-font); }
${bodySel} :is(h1,h2,h3,h4,h5,h6) { font-family: var(--heading-font); }${design?.headingStyle === "italic" ? `
${bodySel} :is(h1,h2,h3,h4,h5,h6) { font-style: italic; }` : ""}
@layer base {
  ${bodySel} :is(h1,h2,h3,h4,h5,h6) { font-weight: var(--heading-weight); letter-spacing: var(--letter-spacing-heading); }
}
`.trim();
}

export function buildTemplateBodyScript(templateSlug: string): string {
  return `
(function(){
  var h = document.documentElement;
  // Remove any previous template class
  var cls = h.className.split(' ').filter(function(c){ return !c.startsWith('template-'); });
  cls.push('template-${templateSlug}');
  h.className = cls.join(' ');
})();
`.trim();
}

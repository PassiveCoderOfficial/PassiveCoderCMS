/**
 * Converts a TemplatePalette + TemplateTypography into CSS custom properties
 * injected at :root. These override the Tailwind CSS variables so the entire
 * public site reflects the active template's visual identity without any
 * class changes on individual elements.
 *
 * Also injects a `.template-<slug>` class on <html> so template-specific
 * CSS rules in customCss can target elements precisely.
 */

import type { TemplatePalette, TemplateTypography } from "./template-registry";

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!result) return "0 0% 50%";
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
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
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function buildTemplateCSSVars(
  palette: TemplatePalette,
  typography: TemplateTypography,
): string {
  const p = (hex: string) => hexToHSL(hex);
  // Wrap single font names in quotes, but pass through font stacks / CSS var() refs as-is.
  const fontVal = (f: string) =>
    /var\(|,/.test(f) ? f : `'${f}'`;
  return `
:root {
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

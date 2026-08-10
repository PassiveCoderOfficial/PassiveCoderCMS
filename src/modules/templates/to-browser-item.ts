/**
 * Adapts a template row into the shapes the template browser and the public
 * showcase render from — both were originally built around the hardcoded
 * registry's `TemplateIdentity` objects, so this is where that shape is
 * reproduced from a DB row instead.
 */
import type { TemplateBlockVariants, TemplatePalette, TemplateTypography } from "@/modules/themes/template-types";
import { DEFAULT_PALETTE, DEFAULT_TYPOGRAPHY } from "@/modules/themes/default-palette";
import type { SiteTemplate } from "./types";

/**
 * The browser card reads `variants.*` to show "Hero: split" style chips.
 * Templates have no variant vocabulary of their own — their layout lives in
 * the actual blocks — so they're advertised as "custom" rather than claiming
 * a specific variant they don't have.
 */
export type BrowserTemplateItem = {
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  previewImage: string;
  palette: TemplatePalette;
  typography: TemplateTypography;
  variants: TemplateBlockVariants;
  source: "db";
};

export function dbTemplateToBrowserItem(t: SiteTemplate): BrowserTemplateItem {
  return {
    slug: t.slug,
    name: t.name,
    description: t.description ?? "",
    category: t.category ?? "General Business",
    tags: t.tags ?? [],
    previewImage: t.screenshot_url ?? "",
    palette: t.palette ?? DEFAULT_PALETTE,
    typography: t.typography ?? DEFAULT_TYPOGRAPHY,
    variants: {
      hero: "custom",
      services: "custom",
      testimonials: "custom",
      features: "custom",
      stats: "custom",
      cta: "custom",
      pricing: "custom",
      faq: "custom",
      navigation: "custom",
      team: "custom",
    },
    source: "db",
  };
}

/**
 * Adapts a DB template into the marketing catalog's `Template` shape, used by
 * the public /templates grid and the homepage showcase section.
 */
export function dbTemplateToCatalogItem(t: SiteTemplate): {
  id: string; slug: string; name: string; category: string; description: string;
  tags: string[]; gradient: string; thumbFrom: string; thumbTo: string;
  accentColorHex: string; heroImage: string; pages: number; hasDemo: boolean;
  featured: boolean; badge?: string; heroHeadline: string; heroSubline: string;
  primaryColor: string; secondaryColor: string; accentColor: string;
} {
  const palette = t.palette ?? DEFAULT_PALETTE;
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    category: t.category ?? "General Business",
    description: t.description ?? "",
    tags: t.tags ?? [],
    gradient: `from-[${palette.primary}] to-[${palette.secondary}]`,
    thumbFrom: palette.primary,
    thumbTo: palette.secondary,
    accentColorHex: palette.accent,
    // Falls back to the palette-gradient thumbnail when no screenshot exists.
    heroImage: t.screenshot_url ?? "",
    // Page count isn't stored on the row — the grid only uses it for a small
    // "Np" badge, and the real number lives in the pages table.
    pages: 0,
    hasDemo: true,
    featured: t.featured ?? false,
    badge: "New",
    heroHeadline: t.name,
    heroSubline: t.description ?? "",
    primaryColor: palette.primary,
    secondaryColor: palette.secondary,
    accentColor: palette.accent,
  };
}

/**
 * Adapts a DB-authored template into the shape the existing template
 * browser/showcase components expect (which was built around registry
 * `TemplateIdentity` objects).
 *
 * Keeps the read surfaces — dashboard picker, showcase, onboarding — able to
 * list both kinds from one array while the registry is phased out, instead
 * of every surface branching on template source.
 */
import type { TemplateIdentity, TemplatePalette, TemplateTypography } from "@/modules/themes/template-registry";
import type { SiteTemplate } from "./types";

/** Neutral fallbacks so a half-authored template still renders a card. */
const FALLBACK_PALETTE: TemplatePalette = {
  primary: "#4f46e5",
  primaryFg: "#ffffff",
  secondary: "#1e293b",
  accent: "#818cf8",
  background: "#ffffff",
  foreground: "#0f172a",
  muted: "#f1f5f9",
  mutedFg: "#64748b",
  card: "#ffffff",
  border: "#e2e8f0",
  ring: "#4f46e5",
  borderRadius: "0.5rem",
};

const FALLBACK_TYPOGRAPHY: TemplateTypography = {
  headingFont: "Inter",
  bodyFont: "Inter",
  headingWeight: "700",
  letterSpacing: "-0.01em",
};

/**
 * The browser card reads `variants.*` to show "Hero: split" style chips.
 * DB templates have no variant vocabulary — their layout lives in the actual
 * blocks — so we advertise them as "custom" rather than inventing a value
 * that implies a registry variant the template doesn't have.
 */
export type BrowserTemplateItem = Pick<
  TemplateIdentity,
  "slug" | "name" | "description" | "category" | "tags" | "previewImage" | "palette" | "typography" | "variants"
> & {
  /** Distinguishes engine-authored templates from the hardcoded registry. */
  source: "db" | "registry";
};

export function dbTemplateToBrowserItem(t: SiteTemplate): BrowserTemplateItem {
  return {
    slug: t.slug,
    name: t.name,
    description: t.description ?? "",
    category: t.category ?? "General Business",
    tags: t.tags ?? [],
    previewImage: t.screenshot_url ?? "",
    palette: t.palette ?? FALLBACK_PALETTE,
    typography: t.typography ?? FALLBACK_TYPOGRAPHY,
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
  const palette = t.palette ?? FALLBACK_PALETTE;
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

export function registryToBrowserItem(t: TemplateIdentity): BrowserTemplateItem {
  return {
    slug: t.slug,
    name: t.name,
    description: t.description,
    category: t.category,
    tags: t.tags,
    previewImage: t.previewImage,
    palette: t.palette,
    typography: t.typography,
    variants: t.variants,
    source: "registry",
  };
}

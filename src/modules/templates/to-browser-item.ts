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

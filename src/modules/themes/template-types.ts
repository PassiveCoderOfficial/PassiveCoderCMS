/**
 * Palette/typography/content types shared by both template systems: the
 * hardcoded TEMPLATE_REGISTRY (being phased out) and the DB-backed
 * `templates` table (the replacement, see src/modules/templates/types.ts).
 *
 * Split out of template-registry.ts so consumers that only need these shapes
 * — the colors editor, block-import, apply flow, browser-item mapping — don't
 * pull in (or depend on) the 54 hand-authored templates themselves. Once the
 * registry file is deleted, this is the sole source for these types.
 */

export type TemplateBlockVariants = {
  hero: string;
  services: string;
  testimonials: string;
  features: string;
  stats: string;
  cta: string;
  pricing: string;
  faq: string;
  navigation: string;
  team: string;
};

export type TemplateTypography = {
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
  letterSpacing: string;
};

export type TemplatePalette = {
  primary: string;
  primaryFg: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedFg: string;
  card: string;
  border: string;
  ring: string;
  borderRadius: string;
};

export type TemplateImage = {
  url: string;
  alt: string;
};

export type TemplateImages = {
  hero: TemplateImage;
  heroSecondary?: TemplateImage;
  about?: TemplateImage;
  services: TemplateImage[];
  gallery: TemplateImage[];
  team: TemplateImage[];
  cta?: TemplateImage;
};

export type TemplateServiceDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconType: "emoji" | "lucide";
  imageUrl?: string;
  price?: string;
  link?: string;
};

export type TemplateTestimonialDef = {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  rating: number;
  avatar?: string;
};

export type TemplateStatDef = {
  id: string;
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
  icon?: string;
};

export type TemplatePricingDef = {
  id: string;
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  ctaLabel: string;
  ctaUrl: string;
};

export type TemplateFAQDef = {
  id: string;
  question: string;
  answer: string;
};

export type TemplateTeamMemberDef = {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  social?: { platform: string; url: string }[];
};

export type TemplateNavItem = {
  id: string;
  label: string;
  url: string;
};

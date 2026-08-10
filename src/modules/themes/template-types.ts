/**
 * Palette/typography/content shapes used across the template system — the
 * DB-backed `templates` table (see src/modules/templates/types.ts), the
 * CSS-var pipeline, the colors editor and the template browser.
 *
 * Originally defined inside template-registry.ts alongside 54 hand-authored
 * template objects; split out during that registry's removal so consumers
 * that only need the shapes don't depend on the data.
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

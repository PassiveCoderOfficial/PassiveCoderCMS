/**
 * Template card shape used by the marketing showcase, onboarding picker and
 * admin template select.
 *
 * This file used to also export TEMPLATES: 55 hand-written marketing entries
 * describing templates that mostly did not exist. Only 6 of those slugs ever
 * resolved to something real, so 49 cards advertised a preview that 404'd and
 * an onboarding choice that silently seeded a blank starter site instead.
 * Every surface now reads the `templates` table, which is the only place a
 * template actually exists — see dbTemplateToCatalogItem.
 */

export type TemplateCategory =
  | "Cleaning"
  | "HVAC & Plumbing"
  | "Renovation & Construction"
  | "Interior Design"
  | "Restaurant & Cafe"
  | "Health & Beauty"
  | "Fitness & Sports"
  | "Legal & Finance"
  | "Real Estate"
  | "Photography"
  | "Education"
  | "Retail & Shop"
  | "Automotive"
  | "Events"
  | "Tech & Agency"
  | "General Business";

export interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  /** Tailwind gradient class pair for the thumbnail bg */
  gradient: string;
  /** Accent color for this template's theme */
  accentColor: string;
  accentColorHex: string;
  /** Mock sections shown in the preview */
  primaryColor: string;
  secondaryColor: string;
  /** Thumbnail card gradient colors */
  thumbFrom: string;
  thumbTo: string;
  /** Screenshot / hero image for the card. Empty falls back to the gradient. */
  heroImage: string;
  /** Demo page count */
  pages: number;
  /** Whether it ships with demo content */
  hasDemo: boolean;
  /** Industry badge text */
  badge?: string;
  /** Featured / popular */
  featured?: boolean;
  /** Mock hero headline for preview */
  heroHeadline: string;
  heroSubline: string;
}

export const TEMPLATE_CATEGORIES = [
  "All",
  "Cleaning",
  "HVAC & Plumbing",
  "Renovation & Construction",
  "Interior Design",
  "Health & Beauty",
  "Automotive",
  "Events",
  "Retail & Shop",
  "General Business",
  "Restaurant & Cafe",
  "Fitness & Sports",
  "Legal & Finance",
  "Real Estate",
  "Photography",
  "Education",
  "Tech & Agency",
] as const;

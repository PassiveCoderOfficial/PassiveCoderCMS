import { z } from "zod";

/**
 * AiCoder content-only schemas. AiCoder never generates a full Block — it only
 * writes the human-authored content fields (headlines, descriptions, list
 * items). Layout, styling, colors and spacing all come from the existing
 * block-registry defaults (src/modules/page-builder/block-registry.ts) plus,
 * where the model asks for one, a variant key drawn from the BLOCK_VARIANTS
 * manifest. The model never emits raw CSS, class names or style values, so its
 * blast radius stays "bad copy" or "wrong-but-valid layout choice", never
 * "malformed block that breaks rendering".
 *
 * Scoped to a curated subset of BlockType — the blocks that make up a real
 * marketing page. Unsupported types are rejected before ever reaching the model.
 */

export const SUPPORTED_BLOCK_TYPES = [
  "hero", "text", "services", "cta", "testimonials", "faq", "features",
  "stats", "icon_grid", "steps", "gallery", "team", "pricing", "contact",
  "navigation", "footer", "timeline",
] as const;
export type SupportedBlockType = typeof SUPPORTED_BLOCK_TYPES[number];

/** A stock-photo search phrase written by the model, e.g. "electrician wiring
 *  a residential distribution board". Resolved to a real image URL after
 *  generation (see images.ts) — the model never emits a URL itself, which
 *  would otherwise be a hallucinated link straight onto the customer's page. */
const imageQuerySchema = z.string().min(3).max(100);

const heroContentSchema = z.object({
  title: z.string().min(1).max(120),
  subtitle: z.string().max(160).optional(),
  description: z.string().max(400).optional(),
  primaryButtonLabel: z.string().max(40).optional(),
  secondaryButtonLabel: z.string().max(40).optional(),
  badge: z.string().max(60).optional(),
  imageQuery: imageQuerySchema.optional(),
});

const textContentSchema = z.object({
  // Plain text paragraphs — the merge step wraps each in <p> to produce the
  // rich-text HTML the real TextBlockProps.data.content field expects. AI
  // never emits HTML directly, so it can't inject a broken tag.
  paragraphs: z.array(z.string().min(1).max(600)).min(1).max(4),
});

/**
 * Icons the model may choose from.
 *
 * Blocks resolve icons by exact lucide export name (`LucideIcons[item.icon]`),
 * so a hallucinated name renders nothing at all. Constraining the model to a
 * fixed list keeps every choice a real component while still letting it pick a
 * *meaningful* one — cycling the registry's three defaults instead, as this
 * previously did, visibly repeats every fourth card on a six-service grid.
 *
 * Deliberately weighted toward trade and local-service work, which is what
 * these sites mostly are.
 */
export const ALLOWED_ICONS = [
  "Zap", "Wrench", "Hammer", "Paintbrush", "Plug", "Lightbulb", "Cable",
  "Camera", "Video", "Wifi", "Router", "HardHat", "Ruler", "Drill",
  "Droplet", "Waves", "ShowerHead", "Flame", "Thermometer", "Fan", "Snowflake",
  "Home", "Building2", "DoorOpen", "Blinds", "LayoutGrid", "Boxes", "Warehouse",
  "Truck", "Car", "Package", "Shield", "ShieldCheck", "Lock", "Key",
  "Sparkles", "Star", "Heart", "ThumbsUp", "Award", "BadgeCheck", "Trophy",
  "Clock", "CalendarCheck", "Phone", "MessageCircle", "Mail", "MapPin",
  "Users", "UserCheck", "Briefcase", "FileText", "ClipboardCheck", "Settings",
  "Leaf", "Trees", "Sun", "Scissors", "Brush", "Trash2", "Recycle",
  "Utensils", "Coffee", "ShoppingBag", "CreditCard", "Wallet", "TrendingUp",
  "Stethoscope", "Pill", "Activity", "Dumbbell", "GraduationCap", "BookOpen",
  "Monitor", "Smartphone", "Laptop", "Server", "Database", "Cloud", "Code",
] as const;

const iconSchema = z.enum(ALLOWED_ICONS);

const serviceItemContentSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(200),
  icon: iconSchema.optional(),
});
const servicesContentSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(160).optional(),
  items: z.array(serviceItemContentSchema).min(1).max(16),
});

const ctaContentSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(240).optional(),
  primaryButtonLabel: z.string().max(40).optional(),
  secondaryButtonLabel: z.string().max(40).optional(),
});

const testimonialItemContentSchema = z.object({
  name: z.string().min(1).max(60),
  role: z.string().max(60).optional(),
  content: z.string().min(1).max(300),
});
const testimonialsContentSchema = z.object({
  title: z.string().max(80).optional(),
  items: z.array(testimonialItemContentSchema).min(1).max(6),
});

const faqItemContentSchema = z.object({
  question: z.string().min(1).max(150),
  answer: z.string().min(1).max(500),
});
const faqContentSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(160).optional(),
  items: z.array(faqItemContentSchema).min(1).max(10),
});

const featureItemContentSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(200),
  icon: iconSchema.optional(),
});
const featuresContentSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(160).optional(),
  items: z.array(featureItemContentSchema).min(1).max(8),
});

/** Stats are the block most likely to invent numbers the business never gave
 *  us. `value` stays a free string (the real field is a string — "10000",
 *  "4.9", "15") but the prompt layer forbids fabricating figures, and the
 *  planner only schedules this block when the brief supplies real ones. */
const statItemContentSchema = z.object({
  value: z.string().min(1).max(12),
  label: z.string().min(1).max(40),
  suffix: z.string().max(4).optional(),
});
const statsContentSchema = z.object({
  title: z.string().max(80).optional(),
  items: z.array(statItemContentSchema).min(2).max(6),
});

const iconGridItemContentSchema = z.object({
  label: z.string().min(1).max(40),
  icon: iconSchema.optional(),
});
const iconGridContentSchema = z.object({
  title: z.string().max(80).optional(),
  items: z.array(iconGridItemContentSchema).min(3).max(12),
});

const stepItemContentSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(220),
});
const stepsContentSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(160).optional(),
  items: z.array(stepItemContentSchema).min(2).max(6),
});

/** Gallery images themselves are placeholders in v1 — AiCoder has no image
 *  source — so the model only writes the section framing and per-slot captions.
 *  The merge step creates that many empty image slots for the owner to fill. */
const galleryContentSchema = z.object({
  title: z.string().max(80).optional(),
  captions: z.array(z.string().min(1).max(80)).min(3).max(12),
  /** One search phrase per caption, in the same order. Resolved to real photos
   *  after generation; when absent or short, the caption itself is used. */
  imageQueries: z.array(imageQuerySchema).max(12).optional(),
});

const teamMemberContentSchema = z.object({
  name: z.string().min(1).max(60),
  role: z.string().min(1).max(60),
  bio: z.string().max(240).optional(),
});
const teamContentSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(160).optional(),
  members: z.array(teamMemberContentSchema).min(1).max(8),
});

const pricingPlanContentSchema = z.object({
  name: z.string().min(1).max(40),
  price: z.string().min(1).max(20),
  period: z.string().max(20).optional(),
  description: z.string().max(160).optional(),
  features: z.array(z.string().min(1).max(80)).min(1).max(8),
  ctaLabel: z.string().max(40).optional(),
  highlighted: z.boolean().optional(),
});
const pricingContentSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(160).optional(),
  plans: z.array(pricingPlanContentSchema).min(1).max(4),
});

/** Field *types* stay under our control — the model picks a label and whether
 *  the field is a long-form one, never an arbitrary input type. */
const contactFieldContentSchema = z.object({
  label: z.string().min(1).max(40),
  type: z.enum(["text", "email", "tel", "textarea", "select"]),
  required: z.boolean().optional(),
});
const contactContentSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(160).optional(),
  submitLabel: z.string().max(40).optional(),
  successMessage: z.string().max(200).optional(),
  fields: z.array(contactFieldContentSchema).min(2).max(8),
});

/** Nav/footer link URLs are written by the model but sanitised at merge time to
 *  same-site relative paths — see sanitizeInternalUrl in merge.ts. The model
 *  cannot emit an off-site or javascript: destination. */
const navLinkContentSchema = z.object({
  label: z.string().min(1).max(30),
  url: z.string().min(1).max(120),
});
const navigationContentSchema = z.object({
  logoText: z.string().min(1).max(40),
  links: z.array(navLinkContentSchema).min(2).max(8),
  ctaLabel: z.string().max(40).optional(),
});

const footerColumnContentSchema = z.object({
  heading: z.string().min(1).max(40),
  links: z.array(navLinkContentSchema).min(1).max(8),
});
const footerContentSchema = z.object({
  logoText: z.string().min(1).max(40),
  tagline: z.string().max(200).optional(),
  columns: z.array(footerColumnContentSchema).min(1).max(4),
});

const timelineItemContentSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(240),
  date: z.string().max(30).optional(),
});
const timelineContentSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(160).optional(),
  items: z.array(timelineItemContentSchema).min(2).max(8),
});

export const CONTENT_SCHEMA_BY_TYPE: Record<SupportedBlockType, z.ZodTypeAny> = {
  hero: heroContentSchema,
  text: textContentSchema,
  services: servicesContentSchema,
  cta: ctaContentSchema,
  testimonials: testimonialsContentSchema,
  faq: faqContentSchema,
  features: featuresContentSchema,
  stats: statsContentSchema,
  icon_grid: iconGridContentSchema,
  steps: stepsContentSchema,
  gallery: galleryContentSchema,
  team: teamContentSchema,
  pricing: pricingContentSchema,
  contact: contactContentSchema,
  navigation: navigationContentSchema,
  footer: footerContentSchema,
  timeline: timelineContentSchema,
};

/** One line per block, shown to the planner so it can choose section types
 *  without being handed all 17 full JSON schemas (which would dominate the
 *  prompt). Kept deliberately in business-owner language, not CMS jargon. */
export const BLOCK_PURPOSE: Record<SupportedBlockType, string> = {
  hero: "Top-of-page banner: main headline, supporting line, primary call-to-action buttons.",
  text: "Plain prose section — an about story, an explanation, a service-area note.",
  services: "Grid or list of the services offered, each with a name and short description.",
  cta: "Bold full-width strip prompting the visitor to act (call, quote, book).",
  testimonials: "Customer quotes with names. Only use when real reviews are supplied.",
  faq: "Expandable question-and-answer list.",
  features: "Selling points / reasons to choose this business, icon-led.",
  stats: "Big numbers (years, projects, customers). Only use when real figures are supplied.",
  icon_grid: "Compact labelled grid — coverage areas, accepted brands, short trust points.",
  steps: "An ordered process: how the service works, step by step.",
  gallery: "Photo grid of past work or the premises. Images are placeholders the owner fills in.",
  team: "The people behind the business, with roles. Only use when real names are supplied.",
  pricing: "Packages or price tiers. Only use when real prices are supplied.",
  contact: "Enquiry form plus contact details.",
  navigation: "Sticky top navigation bar with logo text and page links.",
  footer: "Bottom-of-page anchor: brand, tagline, grouped links, legal links.",
  timeline: "Dated history or milestones. Only use when real dates/milestones are supplied.",
};

/** Blocks that must never be invented from thin air — each asserts something
 *  factual (a review, a number, a person, a price, a date) that the business
 *  has to have actually supplied. The planner is told to skip these unless the
 *  brief contains the underlying facts. */
export const EVIDENCE_REQUIRED_BLOCKS: SupportedBlockType[] = [
  "testimonials", "stats", "team", "pricing", "timeline",
];

export type HeroContent = z.infer<typeof heroContentSchema>;
export type TextContent = z.infer<typeof textContentSchema>;
export type ServicesContent = z.infer<typeof servicesContentSchema>;
export type CtaContent = z.infer<typeof ctaContentSchema>;
export type TestimonialsContent = z.infer<typeof testimonialsContentSchema>;
export type FaqContent = z.infer<typeof faqContentSchema>;
export type FeaturesContent = z.infer<typeof featuresContentSchema>;
export type StatsContent = z.infer<typeof statsContentSchema>;
export type IconGridContent = z.infer<typeof iconGridContentSchema>;
export type StepsContent = z.infer<typeof stepsContentSchema>;
export type GalleryContent = z.infer<typeof galleryContentSchema>;
export type TeamContent = z.infer<typeof teamContentSchema>;
export type PricingContent = z.infer<typeof pricingContentSchema>;
export type ContactContent = z.infer<typeof contactContentSchema>;
export type NavigationContent = z.infer<typeof navigationContentSchema>;
export type FooterContent = z.infer<typeof footerContentSchema>;
export type TimelineContent = z.infer<typeof timelineContentSchema>;

export function isSupportedBlockType(type: string): type is SupportedBlockType {
  return (SUPPORTED_BLOCK_TYPES as readonly string[]).includes(type);
}

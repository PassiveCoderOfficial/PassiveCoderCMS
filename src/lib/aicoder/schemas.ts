import { z } from "zod";

/**
 * AiCoder v1 content-only schemas. AiCoder never generates a full Block —
 * it only writes the human-authored content fields (headlines, descriptions,
 * list items). Layout, styling, colors, spacing all come from the existing
 * block-registry defaults (src/modules/page-builder/block-registry.ts) and
 * are never touched by the model. This keeps the AI's blast radius to "bad
 * copy", never "malformed layout that breaks rendering".
 *
 * Scoped to a curated subset of block types for v1 — the common marketing-
 * page blocks. Not every BlockType in src/types/cms.ts has a schema here;
 * unsupported types are rejected before ever reaching the model.
 */

export const SUPPORTED_BLOCK_TYPES = [
  "hero", "text", "services", "cta", "testimonials", "faq", "features",
] as const;
export type SupportedBlockType = typeof SUPPORTED_BLOCK_TYPES[number];

const heroContentSchema = z.object({
  title: z.string().min(1).max(120),
  subtitle: z.string().max(160).optional(),
  description: z.string().max(400).optional(),
  primaryButtonLabel: z.string().max(40).optional(),
  secondaryButtonLabel: z.string().max(40).optional(),
});

const textContentSchema = z.object({
  // Plain text paragraphs — the merge step wraps each in <p> to produce the
  // rich-text HTML the real TextBlockProps.data.content field expects. AI
  // never emits HTML directly, so it can't inject a broken tag.
  paragraphs: z.array(z.string().min(1).max(600)).min(1).max(4),
});

const serviceItemContentSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(200),
});
const servicesContentSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(160).optional(),
  items: z.array(serviceItemContentSchema).min(1).max(8),
});

const ctaContentSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(240).optional(),
  primaryButtonLabel: z.string().max(40).optional(),
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
});
const featuresContentSchema = z.object({
  title: z.string().max(80).optional(),
  subtitle: z.string().max(160).optional(),
  items: z.array(featureItemContentSchema).min(1).max(8),
});

export const CONTENT_SCHEMA_BY_TYPE: Record<SupportedBlockType, z.ZodTypeAny> = {
  hero: heroContentSchema,
  text: textContentSchema,
  services: servicesContentSchema,
  cta: ctaContentSchema,
  testimonials: testimonialsContentSchema,
  faq: faqContentSchema,
  features: featuresContentSchema,
};

export type HeroContent = z.infer<typeof heroContentSchema>;
export type TextContent = z.infer<typeof textContentSchema>;
export type ServicesContent = z.infer<typeof servicesContentSchema>;
export type CtaContent = z.infer<typeof ctaContentSchema>;
export type TestimonialsContent = z.infer<typeof testimonialsContentSchema>;
export type FaqContent = z.infer<typeof faqContentSchema>;
export type FeaturesContent = z.infer<typeof featuresContentSchema>;

export function isSupportedBlockType(type: string): type is SupportedBlockType {
  return (SUPPORTED_BLOCK_TYPES as readonly string[]).includes(type);
}

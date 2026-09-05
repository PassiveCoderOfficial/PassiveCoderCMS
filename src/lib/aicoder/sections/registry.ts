import { z } from "zod";
import { ALLOWED_ICONS } from "../schemas";

/**
 * What the global AiCoder button can generate, per dashboard section.
 *
 * The launcher is one button everywhere, but "generate" means something
 * different on /services than on /testimonials — this registry is the single
 * place that mapping lives, so adding a new section is one entry here rather
 * than a new dialog, a new route and a new prompt scattered across files.
 *
 * Deliberately NOT keyed on the full pathname: several sections have detail
 * routes (/dashboard/services/[id]) that should offer the same actions as
 * their list page, so matching is longest-prefix.
 */

const iconSchema = z.enum(ALLOWED_ICONS);

/** services + features share an identical items table (title/description/icon),
 *  so they share a schema too. */
const itemsSchema = z.object({
  items: z.array(z.object({
    title: z.string().min(1).max(60),
    description: z.string().min(1).max(200),
    icon: iconSchema.nullish(),
  })).min(1).max(12),
});

const testimonialsSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1).max(60),
    role: z.string().max(60).nullish(),
    company: z.string().max(60).nullish(),
    content: z.string().min(1).max(300),
  })).min(1).max(8),
});

const seoSchema = z.object({
  metaTitle: z.string().min(1).max(70),
  metaDescription: z.string().min(1).max(180),
});

export type SectionKey = "services" | "features" | "testimonials" | "seo";

export interface SectionDef {
  key: SectionKey;
  /** Longest-prefix matched against the dashboard pathname. */
  pathPrefix: string;
  label: string;
  /** Shown on the button in the launcher panel. */
  actionLabel: string;
  /** One line telling the user what this will do before they run it. */
  description: string;
  schema: z.ZodTypeAny;
  /** Extra instruction appended to the shared system prompt. */
  promptHint: string;
}

export const SECTION_DEFS: SectionDef[] = [
  {
    key: "services",
    pathPrefix: "/dashboard/services",
    label: "Services",
    actionLabel: "Write my services",
    description: "Drafts service entries from your business profile — you review each one before it's saved.",
    schema: itemsSchema,
    promptHint:
      "Write the list of services this business offers. Each needs a short, concrete name and one " +
      "sentence describing what the customer actually gets. No marketing filler.",
  },
  {
    key: "features",
    pathPrefix: "/dashboard/features",
    label: "Features",
    actionLabel: "Write my selling points",
    description: "Drafts the reasons a customer should choose this business.",
    schema: itemsSchema,
    promptHint:
      "Write the reasons a customer should choose this business over a competitor. Each needs a short " +
      "heading and one supporting sentence. Never claim anything the business hasn't substantiated.",
  },
  {
    key: "testimonials",
    pathPrefix: "/dashboard/testimonials",
    label: "Testimonials",
    actionLabel: "Draft testimonial placeholders",
    description:
      "Drafts realistic-shaped placeholder reviews to lay out the section. These are NOT real reviews — replace them with genuine ones before publishing.",
    schema: testimonialsSchema,
    promptHint:
      "Write PLACEHOLDER testimonials so the owner can see the section's layout and replace them with " +
      "real ones. Use obviously generic names. Keep each to one or two sentences about the service.",
  },
  {
    key: "seo",
    pathPrefix: "/dashboard/settings/seo",
    label: "SEO",
    actionLabel: "Draft meta title & description",
    description: "Writes a search-engine title and description from your business profile.",
    schema: seoSchema,
    promptHint:
      "Write an SEO meta title (under 60 characters) and meta description (140-160 characters). Both " +
      "should read naturally and include the primary service and location where known.",
  },
];

/** Longest-prefix match so detail routes inherit their list page's actions. */
export function sectionForPath(pathname: string): SectionDef | null {
  let best: SectionDef | null = null;
  for (const def of SECTION_DEFS) {
    if (pathname.startsWith(def.pathPrefix)) {
      if (!best || def.pathPrefix.length > best.pathPrefix.length) best = def;
    }
  }
  return best;
}

export function sectionByKey(key: string): SectionDef | null {
  return SECTION_DEFS.find(d => d.key === key) ?? null;
}

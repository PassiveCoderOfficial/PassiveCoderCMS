import { z } from "zod";
import { BLOCK_VARIANTS } from "@/modules/page-builder/block-variants";
import {
  SUPPORTED_BLOCK_TYPES, BLOCK_PURPOSE, EVIDENCE_REQUIRED_BLOCKS,
  type SupportedBlockType,
} from "./schemas";
import { businessFactsSchema, type BusinessFacts, renderConstraints } from "./brief";
import { callModel, AiCoderError } from "./generate";

/**
 * The planning layer — the step that turns "one prompt" into "a whole page".
 *
 * Two calls, both cheap relative to the block generations they gate:
 *   parseBrief()  raw brief  -> BusinessFacts   (once per run)
 *   planPage()    facts      -> PageSection[]   (once per page)
 *
 * The planner never writes copy. It decides which sections exist, in what
 * order, in which layout variant, and what each section is *about* — then the
 * existing per-block generator writes each one. Keeping these separate means a
 * bad section brief costs one regeneration, not the whole page.
 */

const sectionSchema = z.object({
  blockType: z.enum(SUPPORTED_BLOCK_TYPES),
  /** Instruction for this one section, written by the planner for the writer. */
  brief: z.string().min(1).max(600),
  /** Must match a key in BLOCK_VARIANTS for this type; validated post-parse. */
  variantKey: z.string().max(60).nullish(),
});

const pagePlanSchema = z.object({
  pageTitle: z.string().min(1).max(70),
  metaDescription: z.string().min(1).max(180),
  sections: z.array(sectionSchema).min(3).max(16),
});

// The schema accepts null on variantKey (the model sends it), but planPage()
// normalizes it to undefined before returning, so the exported type reflects
// the shape consumers actually receive rather than the raw parse output.
export type PageSection = Omit<z.infer<typeof sectionSchema>, "variantKey"> & {
  variantKey?: string;
};
// Same normalization as PageSection above — planPage() returns sections with
// variantKey already reduced to `string | undefined`.
export type PagePlan = Omit<z.infer<typeof pagePlanSchema>, "sections"> & {
  sections: PageSection[];
};

const sitePlanSchema = z.object({
  pages: z.array(z.object({
    title: z.string().min(1).max(60),
    slug: z.string().min(1).max(60),
    brief: z.string().min(1).max(800),
    isHome: z.boolean().default(false),
  })).min(1).max(8),
});

export type SitePlan = z.infer<typeof sitePlanSchema>;

/** Extracts structured facts from a free-form brief. One call per run. */
export async function parseBrief(rawBrief: string): Promise<BusinessFacts> {
  const system = [
    "You extract structured facts from a website brief written by a business owner or their developer.",
    "Output MUST be valid JSON matching the schema exactly. No markdown, no commentary.",
    "Extract only what the brief actually states. Never infer, embellish or fill gaps with plausible guesses —",
    "an omitted field is correct when the brief is silent; an invented one is a defect.",
    "Pay particular attention to prohibitions. When the brief says a claim must not be made",
    "(for example 'do not say licensed, certified, 24/7 or 10+ years'), list each one in forbiddenClaims.",
    "When it says a name or brand must never appear, list it in neverMention.",
    "Set hasRealTestimonials, hasRealTeam and hasRealPricing to true ONLY when the brief supplies",
    "actual named reviews, actual named people, or actual prices — not when it merely asks for such a section.",
    "Put concrete supplied figures (years in business, projects completed) in provenNumbers, verbatim.",
  ].join(" ");

  const user = [
    "Extract the facts from this brief:",
    "",
    rawBrief.trim().slice(0, 24_000),
  ].join("\n");

  return callModel(businessFactsSchema, system, user, 2000);
}

/**
 * Plans one page: which sections, which layouts, in what order.
 *
 * The variant catalogue is passed in full because variant choice is how design
 * direction ("dark navy, premium, modern contractor") actually reaches the
 * output — the model matches the brief's visual language to layout descriptions
 * we wrote. Every returned key is re-validated against the manifest afterwards;
 * an unknown one is dropped rather than trusted.
 */
export async function planPage(
  facts: BusinessFacts,
  pageBrief: string,
  pageKind: "home" | "interior" = "home",
): Promise<PagePlan> {
  const allowedBlocks = availableBlockTypes(facts);

  const system = [
    "You are AiCoder's page planner for a block-based website builder.",
    "You decide the SECTIONS of one page — never the words inside them. Another step writes the copy.",
    "Output MUST be valid JSON matching the schema exactly. No markdown, no commentary.",
    "",
    "Rules:",
    "- Use only the block types listed as available. Never invent a type.",
    "- Order sections the way a high-converting service-business page runs:",
    "  navigation first, hero second, footer last.",
    "- Every section's `brief` must say what THAT section should communicate, specifically.",
    "  A brief like 'write a services section' is useless; name the actual services it should cover.",
    "- Choose a `variantKey` from the variants offered for that block type. Match the brief's",
    "  visual direction — a premium dark brand should use the dark variants, a light airy brand",
    "  should not. Omit variantKey only when no listed variant fits.",
    "- Control the page rhythm deliberately: alternate dark and light sections rather than",
    "  running many dark ones together or making the whole page one tone. Variants marked",
    "  [dark] render on a dark ground.",
    "- Do not overcrowd. A strong page is 8-12 sections, not every block type you were offered.",
    "- pageTitle and metaDescription are for SEO: title under 60 characters, description 140-160,",
    "  both naturally including the primary service and location when known.",
    "",
    renderConstraints(facts),
  ].join("\n");

  const user = [
    `Page kind: ${pageKind === "home" ? "Homepage" : "Interior page"}`,
    "",
    "Available block types:",
    ...allowedBlocks.map(t => `- ${t}: ${BLOCK_PURPOSE[t]}`),
    "",
    "Layout variants available per block type:",
    renderVariantCatalogue(allowedBlocks),
    "",
    "Brief for this page:",
    pageBrief.trim().slice(0, 12_000),
  ].join("\n");

  const plan = await callModel(pagePlanSchema, system, user, 3000);

  // Drop variant keys the model invented, and block types that slipped past the
  // availability list — the enum already guarantees a real BlockType, but not
  // that we permitted it for this business's evidence level.
  const allowed = new Set(allowedBlocks);
  // Normalize variantKey to `string | undefined` here — the schema accepts
  // null (the model sends it for "no preference"), but every consumer
  // downstream treats an absent variant as undefined, so this is the one
  // place the null is turned into the shape the rest of the pipeline uses.
  const sections: PageSection[] = plan.sections
    .filter(s => allowed.has(s.blockType))
    .map(s => {
      const key = s.variantKey ?? undefined;
      return {
        blockType: s.blockType,
        brief: s.brief,
        variantKey: isKnownVariant(s.blockType, key) ? key : undefined,
      };
    });

  if (sections.length < 3) {
    throw new AiCoderError("The planner returned too few usable sections for a page.", "invalid_output");
  }

  return { pageTitle: plan.pageTitle, metaDescription: plan.metaDescription, sections };
}

/** Plans a whole site: which pages exist and what each covers. */
export async function planSite(facts: BusinessFacts, rawBrief: string): Promise<SitePlan> {
  const system = [
    "You are AiCoder's site planner. You decide which PAGES a small business website needs.",
    "Output MUST be valid JSON matching the schema exactly. No markdown, no commentary.",
    "Rules:",
    "- Exactly one page must have isHome true, and its slug must be 'home'.",
    "- Slugs are lowercase, hyphenated, no leading slash.",
    "- 4-6 pages suits most service businesses. Do not create a page per service.",
    "- Each page's brief must describe what that page covers, in enough detail that a",
    "  page planner who cannot see the original document could work from it alone.",
    "",
    renderConstraints(facts),
  ].join("\n");

  const user = [
    "Plan the pages for this website:",
    "",
    rawBrief.trim().slice(0, 16_000),
  ].join("\n");

  const plan = await callModel(sitePlanSchema, system, user, 2500);

  if (!plan.pages.some(p => p.isHome)) plan.pages[0].isHome = true;
  return plan;
}

/**
 * Blocks this business has the evidence to justify.
 *
 * Testimonials, stats, team, pricing and timeline all assert something factual.
 * Offering them to a planner that has no such facts is how a brand-new sole
 * trader ends up with "4,200+ Homes Sold" on their homepage — the registry
 * defaults are full of exactly that placeholder copy. Withholding the block
 * type entirely is more reliable than asking the model not to make things up.
 */
function availableBlockTypes(facts: BusinessFacts): SupportedBlockType[] {
  const evidence: Record<string, boolean> = {
    testimonials: facts.hasRealTestimonials,
    team: facts.hasRealTeam,
    pricing: facts.hasRealPricing,
    stats: facts.provenNumbers.length > 0,
    timeline: facts.provenNumbers.length > 0,
  };

  return SUPPORTED_BLOCK_TYPES.filter(t =>
    !EVIDENCE_REQUIRED_BLOCKS.includes(t) || evidence[t],
  );
}

function renderVariantCatalogue(types: SupportedBlockType[]): string {
  const lines: string[] = [];
  for (const type of types) {
    const variants = BLOCK_VARIANTS[type];
    if (!variants?.length) continue;
    const rendered = variants
      .map(v => `${v.key}${v.dark ? " [dark]" : ""} (${v.description})`)
      .join("; ");
    lines.push(`- ${type}: ${rendered}`);
  }
  return lines.join("\n");
}

function isKnownVariant(type: SupportedBlockType, key?: string): boolean {
  if (!key) return false;
  return !!BLOCK_VARIANTS[type]?.some(v => v.key === key);
}

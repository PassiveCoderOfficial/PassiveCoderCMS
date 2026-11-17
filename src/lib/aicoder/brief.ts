import { z } from "zod";

/**
 * The extracted-facts layer.
 *
 * A full-page or full-site brief is long — services lists, tone notes, colour
 * direction, explicit do-nots. Re-sending that whole document into every one of
 * the 10-15 block generations in a run would multiply cost and let the model
 * re-interpret the brief slightly differently each time. So the brief is parsed
 * ONCE into this compact structured object, and only the relevant slice is
 * injected per block.
 *
 * The two constraint fields are the load-bearing ones. Briefs routinely say
 * things like "do not claim licensed, certified, 24/7 or 10+ years" and "never
 * mention the company name on the business card" — if that only lived in the
 * raw prose, one section out of fourteen would eventually invent credentials
 * the business does not hold. For a regulated trade (electrical, medical,
 * legal) that is a real liability, not a copy nitpick. Extracting them into
 * their own fields means they can be re-asserted in the system prompt of every
 * single downstream call.
 */

// Every optional field here is .nullish(), not .optional(). The model fills
// this schema, and it returns an explicit `null` for anything the brief
// didn't mention rather than omitting the key — .optional() accepts a missing
// key but REJECTS null, which failed the whole parse and took the entire run
// with it. Hit live on the first real full-site run: "expected string,
// received null at tone / at designDirection" on a brief that simply said
// nothing about tone or colours, i.e. the common case, not an edge case.
export const businessFactsSchema = z.object({
  businessName: z.string().min(1).max(80),
  primaryService: z.string().max(120).nullish(),
  services: z.array(z.string().min(1).max(80)).max(30).default([]),
  location: z.string().max(120).nullish(),
  audience: z.string().max(200).nullish(),
  goal: z.string().max(200).nullish(),
  tone: z.string().max(200).nullish(),
  /** Free-text contact details lifted verbatim from the brief. Never invented —
   *  a wrong phone number is worse than no phone number. */
  contact: z.object({
    phone: z.string().max(40).nullish(),
    email: z.string().max(80).nullish(),
    whatsapp: z.string().max(40).nullish(),
    address: z.string().max(200).nullish(),
  }).nullish(),
  /** Claims the site must NOT make (e.g. "licensed", "24/7", "10+ years"). */
  forbiddenClaims: z.array(z.string().min(1).max(120)).max(20).default([]),
  /** Names/brands that must never appear anywhere on the site. */
  neverMention: z.array(z.string().min(1).max(80)).max(20).default([]),
  /** Colour/typography direction in plain words, for the theme step. */
  designDirection: z.string().max(400).nullish(),
  /** Real figures the brief supplied (years, projects, customers). Empty means
   *  the planner must not schedule a stats block. */
  provenNumbers: z.array(z.string().min(1).max(60)).max(10).default([]),
  /** True when the brief supplies real named reviews. Gates testimonials. */
  hasRealTestimonials: z.boolean().default(false),
  /** True when the brief supplies real team members. Gates the team block. */
  hasRealTeam: z.boolean().default(false),
  /** True when the brief supplies real prices. Gates the pricing block. */
  hasRealPricing: z.boolean().default(false),
});

export type BusinessFacts = z.infer<typeof businessFactsSchema>;

/**
 * Renders the constraint half of the facts as prompt text. Appended to the
 * SYSTEM prompt (not the user prompt) of every generation call in a run, so it
 * carries the same weight as the output-format rules and is harder for a long
 * user instruction to talk the model out of.
 */
export function renderConstraints(facts: BusinessFacts): string {
  const lines: string[] = [];

  lines.push(`The business is "${facts.businessName}". Use this name and no other.`);

  if (facts.neverMention.length) {
    lines.push(
      `NEVER mention, display or reference any of the following, under any circumstances: ${facts.neverMention.join("; ")}.`,
    );
  }

  if (facts.forbiddenClaims.length) {
    lines.push(
      `NEVER claim or imply any of the following, because the business has not substantiated them: ${facts.forbiddenClaims.join("; ")}. ` +
      `Do not paraphrase around these restrictions either — if you cannot say something truthfully, omit it entirely.`,
    );
  }

  lines.push(
    "Never invent specific numbers, dates, certifications, awards, customer counts, years in business, " +
    "guarantees, or named customers. If a concrete fact was not supplied, write copy that does not need it.",
  );

  return lines.join(" ");
}

/**
 * Renders the descriptive half of the facts — who the business is and what it
 * does — as the shared context every block generation is written against.
 */
export function renderContext(facts: BusinessFacts): string {
  const parts: string[] = [`Business: ${facts.businessName}`];

  if (facts.primaryService) parts.push(`Primary service: ${facts.primaryService}`);
  if (facts.services.length) parts.push(`Services offered: ${facts.services.join(", ")}`);
  if (facts.location) parts.push(`Location / service area: ${facts.location}`);
  if (facts.audience) parts.push(`Target customers: ${facts.audience}`);
  if (facts.goal) parts.push(`Website goal: ${facts.goal}`);
  if (facts.tone) parts.push(`Tone of voice: ${facts.tone}`);

  if (facts.contact) {
    const c = facts.contact;
    const bits = [
      c.phone && `phone ${c.phone}`,
      c.whatsapp && `WhatsApp ${c.whatsapp}`,
      c.email && `email ${c.email}`,
      c.address && `address ${c.address}`,
    ].filter(Boolean);
    if (bits.length) parts.push(`Contact details (use verbatim, never alter): ${bits.join(", ")}`);
  }

  if (facts.provenNumbers.length) {
    parts.push(`Verified figures that MAY be used: ${facts.provenNumbers.join("; ")}`);
  }

  return parts.join("\n");
}

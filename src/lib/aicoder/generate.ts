import { z } from "zod";
import { CONTENT_SCHEMA_BY_TYPE, BLOCK_PURPOSE, type SupportedBlockType } from "./schemas";
import { BLOCK_VARIANTS } from "@/modules/page-builder/block-variants";
import { renderConstraints, renderContext, type BusinessFacts } from "./brief";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "z-ai/glm-4.6";

/** Extra token budget for GLM-4.6's reasoning pass, which is billed against
 *  max_tokens before the answer starts. Callers size their maxTokens for the
 *  JSON they expect; this covers the thinking that precedes it. */
const REASONING_HEADROOM = 3000;

export class AiCoderError extends Error {
  constructor(message: string, public code: "no_api_key" | "upstream_error" | "invalid_output") {
    super(message);
  }
}

/**
 * The single place AiCoder talks to a model.
 *
 * Every AiCoder call — fact extraction, site planning, page planning, block
 * copywriting — goes through here with a Zod schema it must satisfy. Nothing
 * downstream ever sees unvalidated model output, and there is exactly one
 * place to change model, add retries or swap provider.
 */
export async function callModel<T extends z.ZodTypeAny>(
  schema: T,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1200,
  attempt = 1,
): Promise<z.infer<T>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AiCoderError(
      "AiCoder is not configured — OPENROUTER_API_KEY is missing. Set it in the environment to enable AI content generation.",
      "no_api_key",
    );
  }

  const jsonSchema = z.toJSONSchema(schema);

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter uses these for its own analytics/rankings — harmless to omit
        // but recommended by their docs.
        "HTTP-Referer": process.env.NEXT_PUBLIC_ROOT_DOMAIN ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` : "https://passivecoder.com",
        "X-Title": "Passive Coder AiCoder",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${userPrompt}\n\nRespond with JSON matching this schema:\n${JSON.stringify(jsonSchema)}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        // GLM-4.6 is a reasoning model: its chain of thought is billed against
        // this same budget before any answer tokens are emitted. Sized for
        // reasoning + output, not output alone — too tight and the model
        // spends the whole allowance thinking and returns empty content with
        // finish_reason "length".
        max_tokens: maxTokens + REASONING_HEADROOM,
      }),
    });
  } catch (err) {
    throw new AiCoderError(`Failed to reach OpenRouter: ${err instanceof Error ? err.message : String(err)}`, "upstream_error");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AiCoderError(`OpenRouter request failed (${res.status}): ${body.slice(0, 300)}`, "upstream_error");
  }

  const payload = await res.json().catch(() => null) as {
    choices?: { message?: { content?: string; reasoning?: string }; finish_reason?: string }[];
    error?: { message?: string };
  } | null;

  // OpenRouter can return HTTP 200 with an error object in the body (upstream
  // provider failures arrive this way), so a 200 alone is not success.
  if (payload?.error?.message) {
    throw new AiCoderError(`OpenRouter error: ${payload.error.message}`, "upstream_error");
  }

  const choice = payload?.choices?.[0];
  const raw = choice?.message?.content;

  if (!raw) {
    // Logged server-side because the user-facing message deliberately stays
    // short; without this the next occurrence is as opaque as the first was.
    console.error("[aicoder] empty completion", {
      finish_reason: choice?.finish_reason,
      had_reasoning: !!choice?.message?.reasoning,
      reasoning_len: choice?.message?.reasoning?.length ?? 0,
      max_tokens: maxTokens + REASONING_HEADROOM,
    });

    // Distinguish the two ways this happens, because the fixes are different:
    // a truncated reasoning run needs more budget, anything else is a genuine
    // upstream fault. The old message said only "no content", which told
    // whoever hit it nothing actionable.
    // One retry with a much larger budget. A reasoning model that thought
    // itself out of room on an average prompt usually succeeds on a second
    // pass, and the caller has already paid a generation for this attempt —
    // failing without retrying spends it for nothing.
    if (choice?.finish_reason === "length" && attempt === 1) {
      return callModel(schema, systemPrompt, userPrompt, maxTokens * 2, 2);
    }
    if (choice?.finish_reason === "length") {
      throw new AiCoderError(
        "The model ran out of room before it finished writing. Try a shorter, more specific instruction.",
        "upstream_error",
      );
    }
    throw new AiCoderError(
      `OpenRouter returned no content${choice?.finish_reason ? ` (finish_reason: ${choice.finish_reason})` : ""}.`,
      "upstream_error",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    throw new AiCoderError("AI output was not valid JSON", "invalid_output");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new AiCoderError(
      `AI output didn't match the expected shape: ${z.prettifyError ? z.prettifyError(result.error) : result.error.message}`,
      "invalid_output",
    );
  }

  return result.data;
}

/**
 * Generates CONTENT ONLY for one block — headlines, descriptions, list items.
 * Returns the parsed+validated content object, never a full Block (see merge.ts
 * for how it becomes one).
 *
 * `facts` is optional so the original single-section flow (where the user types
 * a free-text business description) keeps working unchanged. When present — the
 * full-page flow — its constraints go into the SYSTEM prompt, so the "never
 * claim licensed / never mention this brand" rules carry the same weight as the
 * output-format rules in every one of a page's dozen-plus generations.
 */
export async function generateBlockContent(
  blockType: SupportedBlockType,
  businessContext: string,
  userInstruction: string,
  facts?: BusinessFacts,
): Promise<unknown> {
  const schema = CONTENT_SCHEMA_BY_TYPE[blockType];

  const systemPrompt = [
    "You are AiCoder, a website copywriting assistant for small-business site owners.",
    "You write ONLY the content fields for one page section (block) at a time — never layout, colors, or code.",
    "Output MUST be valid JSON matching the provided schema exactly. No markdown, no commentary, no extra fields.",
    "Keep copy concise, concrete, and specific to the business described. Avoid generic filler like 'we are the best'.",
    "The site owner may write in imperfect English — infer their intent and produce clean, professional English output regardless.",
    "When the schema offers an `icon` field, pick the one that best matches that specific item, and do not repeat an icon within the section — a grid where every third card shares an icon looks unfinished.",
    facts ? renderConstraints(facts) : "",
  ].filter(Boolean).join(" ");

  const context = facts ? renderContext(facts) : businessContext.trim();

  const userPrompt = [
    `Business context:\n${context || "(not provided — use generic small-business language)"}`,
    "",
    `Section type: ${blockType} — ${BLOCK_PURPOSE[blockType]}`,
    `What this section must communicate: ${userInstruction.trim() || "Write good default content for this section."}`,
  ].join("\n");

  return callModel(schema, systemPrompt, userPrompt, 1500);
}

/**
 * Suggests site-wide theme values from the brief's design direction.
 *
 * Kept separate from page generation on purpose: ThemeSettings is site-wide, so
 * applying it silently while someone generates one page would restyle every
 * other page on the site. The caller surfaces this as an explicit opt-in.
 */
export async function suggestTheme(facts: BusinessFacts) {
  const themeSchema = z.object({
    primaryColor: hexColor(),
    secondaryColor: hexColor(),
    accentColor: hexColor(),
    backgroundColor: hexColor(),
    textColor: hexColor(),
    headingFont: z.enum(ALLOWED_FONTS),
    bodyFont: z.enum(ALLOWED_FONTS),
    borderRadius: z.enum(["0px", "4px", "8px", "12px", "16px"]),
    rationale: z.string().max(300),
  });

  const system = [
    "You choose a website colour palette and type pairing from a brief's stated design direction.",
    "Output MUST be valid JSON matching the schema exactly. No markdown, no commentary.",
    "Colours must be 6-digit hex. Ensure body text on the background meets WCAG AA contrast (at least 4.5:1) —",
    "a palette that fails this is a defect, not a style choice.",
    "Fonts must come from the allowed list. Pick a heading/body pairing that suits the brand, not the same font twice",
    "unless the direction genuinely calls for a single-family look.",
  ].join(" ");

  const user = [
    `Business: ${facts.businessName}`,
    facts.primaryService ? `Primary service: ${facts.primaryService}` : "",
    facts.tone ? `Tone: ${facts.tone}` : "",
    "",
    "Stated design direction:",
    facts.designDirection || "(none given — choose something clean and professional for this trade)",
    "",
    `Allowed fonts: ${ALLOWED_FONTS.join(", ")}`,
  ].filter(Boolean).join("\n");

  return callModel(themeSchema, system, user, 700);
}

/** Fonts the site renderer actually loads — a model-invented family would
 *  silently fall back to a system default. */
const ALLOWED_FONTS = [
  "Inter", "Poppins", "Montserrat", "Roboto", "Open Sans", "Lato",
  "Raleway", "Playfair Display", "Merriweather", "Fraunces", "DM Sans",
  "Work Sans", "Nunito", "Source Sans 3", "Oswald",
] as const;

function hexColor() {
  return z.string().regex(/^#[0-9a-fA-F]{6}$/, "must be a 6-digit hex colour");
}

/** Some models wrap JSON in a ```json fence despite response_format. */
function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

/** Variant keys valid for a block type — used by callers that let a human
 *  override the planner's layout choice. */
export function variantKeysFor(type: SupportedBlockType): string[] {
  return (BLOCK_VARIANTS[type] ?? []).map(v => v.key);
}

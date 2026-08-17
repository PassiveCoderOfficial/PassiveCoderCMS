import { z } from "zod";
import { CONTENT_SCHEMA_BY_TYPE, type SupportedBlockType } from "./schemas";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "z-ai/glm-4.6";

export class AiCoderError extends Error {
  constructor(message: string, public code: "no_api_key" | "upstream_error" | "invalid_output") {
    super(message);
  }
}

/**
 * Calls GLM-4.6 via OpenRouter to generate CONTENT ONLY for one block —
 * headlines, descriptions, list items. Returns the parsed+validated content
 * object, never a full Block (see merge.ts for how it becomes one). Throws
 * AiCoderError on any failure — callers must not silently fall back to
 * unvalidated output.
 */
export async function generateBlockContent(
  blockType: SupportedBlockType,
  businessContext: string,
  userInstruction: string,
): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AiCoderError(
      "AiCoder is not configured — OPENROUTER_API_KEY is missing. Set it in the environment to enable AI content generation.",
      "no_api_key",
    );
  }

  const schema = CONTENT_SCHEMA_BY_TYPE[blockType];
  const jsonSchema = z.toJSONSchema(schema);

  const systemPrompt = [
    "You are AiCoder, a website copywriting assistant for small-business site owners.",
    "You write ONLY the content fields for one page section (block) at a time — never layout, colors, or code.",
    "Output MUST be valid JSON matching the provided schema exactly. No markdown, no commentary, no extra fields.",
    "Keep copy concise, concrete, and specific to the business described. Avoid generic filler like 'we are the best'.",
    "The site owner may write in imperfect English — infer their intent and produce clean, professional English output regardless.",
  ].join(" ");

  const userPrompt = [
    `Business context: ${businessContext.trim() || "(not provided — use generic small-business language)"}`,
    `Block type: ${blockType}`,
    `Instruction: ${userInstruction.trim() || "Write good default content for this section."}`,
    "",
    `Respond with JSON matching this schema:`,
    JSON.stringify(jsonSchema),
  ].join("\n");

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
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });
  } catch (err) {
    throw new AiCoderError(`Failed to reach OpenRouter: ${err instanceof Error ? err.message : String(err)}`, "upstream_error");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AiCoderError(`OpenRouter request failed (${res.status}): ${body.slice(0, 300)}`, "upstream_error");
  }

  const payload = await res.json().catch(() => null) as { choices?: { message?: { content?: string } }[] } | null;
  const raw = payload?.choices?.[0]?.message?.content;
  if (!raw) throw new AiCoderError("OpenRouter returned no content", "upstream_error");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
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

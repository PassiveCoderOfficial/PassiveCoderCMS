import Anthropic from "@anthropic-ai/sdk";
import { isSaaS } from "@/lib/flags";

/*
 * Which AI service answers AiCoder and the site chat.
 *
 * Hosted platform: always OpenRouter with the platform key (unchanged).
 *
 * Self-hosted (standalone) installs, in this order unless AI_PROVIDER names one:
 *   passivecoder  PASSIVECODER_AI_KEY  Passive Coder AI credits (the default:
 *                 one key, no setup, every AI feature). Calls the Passive
 *                 Coder AI API (PASSIVECODER_AI_URL overrides the address).
 *   openrouter    OPENROUTER_API_KEY   own key ("Advanced"): basic features
 *   openai        OPENAI_API_KEY       own key ("Advanced"): basic features
 *   anthropic     ANTHROPIC_API_KEY    own key ("Advanced"): basic features
 *
 * Own keys run the text features (write, rewrite, translate, page copy, site
 * chat). Whole-site building runs only with Passive Coder AI or on the hosted
 * platform: see aiFeatureAvailable().
 */

export type AiProviderId = "openrouter" | "openai" | "anthropic" | "passivecoder";

export interface AiProvider {
  id: AiProviderId;
  key: string;
  /** OpenAI-format chat completions URL (unused for anthropic). */
  url: string;
  model: string;
  label: string;
}

/** OpenRouter model id used by the hosted platform. */
export const OPENROUTER_MODEL = "anthropic/claude-haiku-5.5";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function build(id: AiProviderId): AiProvider | null {
  switch (id) {
    case "openrouter": {
      const key = process.env.OPENROUTER_API_KEY;
      return key ? { id, key, url: OPENROUTER_URL, model: process.env.OPENROUTER_MODEL || OPENROUTER_MODEL, label: "OpenRouter" } : null;
    }
    case "openai": {
      const key = process.env.OPENAI_API_KEY;
      return key ? { id, key, url: "https://api.openai.com/v1/chat/completions", model: process.env.OPENAI_MODEL || "gpt-4o-mini", label: "OpenAI" } : null;
    }
    case "anthropic": {
      const key = process.env.ANTHROPIC_API_KEY;
      return key ? { id, key, url: "", model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5", label: "Anthropic" } : null;
    }
    case "passivecoder": {
      const key = process.env.PASSIVECODER_AI_KEY;
      const base = (process.env.PASSIVECODER_AI_URL || "https://passivecoder.com/api/ai/v1").replace(/\/+$/, "");
      return key ? { id, key, url: `${base}/chat/completions`, model: "default", label: "Passive Coder AI" } : null;
    }
  }
}

/** The configured AI service, or null when none is set up. */
export function aiProvider(): AiProvider | null {
  if (isSaaS) {
    const key = process.env.OPENROUTER_API_KEY;
    return key ? { id: "openrouter", key, url: OPENROUTER_URL, model: OPENROUTER_MODEL, label: "OpenRouter" } : null;
  }
  const pick = (process.env.AI_PROVIDER || "").trim().toLowerCase() as AiProviderId;
  if (pick) return build(pick);
  for (const id of ["passivecoder", "openrouter", "openai", "anthropic"] as const) {
    const p = build(id);
    if (p) return p;
  }
  return null;
}

/** True when a self-hosted install runs AI on its own key (not Passive Coder AI). */
export function usesOwnAiKey(p: AiProvider | null = aiProvider()): boolean {
  return !isSaaS && !!p && p.id !== "passivecoder";
}

export type AiFeature = "text" | "site_build";

/** Whole-site building needs Passive Coder AI (or the hosted platform). */
export function aiFeatureAvailable(feature: AiFeature, p: AiProvider | null = aiProvider()): boolean {
  if (!p) return false;
  if (feature === "site_build") return !usesOwnAiKey(p);
  return true;
}

/** Extra headers for an OpenAI-format request. */
export function providerHeaders(p: AiProvider, title: string, meta: AiCallMeta = {}): Record<string, string> {
  const h: Record<string, string> = { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" };
  // Passive Coder AI charges credits per use (lib/ai/credit-costs.ts), once per ref.
  if (p.id === "passivecoder") {
    if (meta.use) h["X-PC-AI-Use"] = meta.use;
    if (meta.ref) h["X-PC-AI-Ref"] = meta.ref;
  }
  if (p.id === "openrouter") {
    // OpenRouter uses these for its own analytics/rankings.
    h["HTTP-Referer"] = process.env.NEXT_PUBLIC_ROOT_DOMAIN ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` : "https://passivecoder.com";
    h["X-Title"] = title;
  }
  return h;
}

/** What a call is for, so Passive Coder AI can charge the right credits. */
export type AiCallMeta = { use?: string; ref?: string };

export type CompletionResult = { content: string | null; finish: string | null; reasoning?: string; error?: string };

/**
 * One non-streaming completion: a system prompt and a user prompt in, the
 * text out. `finish` uses OpenAI's words ("stop", "length").
 */
export async function completeChat(
  p: AiProvider,
  opts: { system: string; user: string; maxTokens: number; temperature?: number; json?: boolean; title: string; meta?: AiCallMeta },
): Promise<CompletionResult> {
  if (p.id === "anthropic") {
    const client = new Anthropic({ apiKey: p.key });
    const res = await client.messages.create({
      model: p.model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const finish = res.stop_reason === "max_tokens" ? "length" : res.stop_reason === "end_turn" ? "stop" : res.stop_reason;
    return { content: text || null, finish };
  }

  const res = await fetch(p.url, {
    method: "POST",
    headers: providerHeaders(p, opts.title, opts.meta),
    body: JSON.stringify({
      model: p.model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      max_tokens: opts.maxTokens,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${p.label} request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const payload = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: string; reasoning?: string }; finish_reason?: string }[];
    error?: { message?: string };
  } | null;
  // OpenRouter can answer 200 with an error object (upstream provider failure).
  if (payload?.error?.message) return { content: null, finish: null, error: payload.error.message };
  const choice = payload?.choices?.[0];
  return { content: choice?.message?.content ?? null, finish: choice?.finish_reason ?? null, reasoning: choice?.message?.reasoning };
}

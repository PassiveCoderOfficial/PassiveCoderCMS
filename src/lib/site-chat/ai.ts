import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { upsertContact } from "@/lib/crm/upsertContact";
import { enrollInSequences } from "@/lib/crm/sequences";
import { notifyTenantEvent } from "@/lib/push/notify";
import { chatCostUsd } from "./usage";
import { isBlockedSender } from "@/lib/spam/guard";
import type { IntakeRun } from "./intake";
import type { VisitCard } from "./intake-copy";
import Anthropic from "@anthropic-ai/sdk";
import { aiProvider, providerHeaders, OPENROUTER_MODEL, type AiProvider, type AiCallMeta } from "@/lib/ai/provider";

/**
 * The AI side of the site chat: one streamed answer (OpenRouter, Claude
 * Haiku, site knowledge as a cached system prompt) with three tools,
 * create_lead, request_human and set_visitor_name. Text deltas go to `onDelta` as they arrive.
 */

/** Hosted model (OpenRouter id). Self-hosted installs: lib/ai/provider.ts. */
export const SITE_CHAT_MODEL = OPENROUTER_MODEL;

type Admin = Awaited<ReturnType<typeof createAdminClient>>;
type Msg = { role: string; content: unknown; tool_calls?: unknown; tool_call_id?: string };
type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Send the visitor's details to the business team when they want a quote, booking, site visit or call back. Only call after the visitor gave their name and phone number.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Visitor's name" },
          phone: { type: "string", description: "Phone number exactly as given, including country code if given" },
          email: { type: "string", description: "Email, if given" },
          service: { type: "string", description: "Service or product they are interested in" },
          message: { type: "string", description: "Short summary of what they need" },
        },
        required: ["name", "phone", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_human",
      description: "Flag the conversation for a team member when the visitor asks to talk to a human.",
      parameters: { type: "object", properties: { reason: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "set_visitor_name",
      description: "Save the visitor's name as soon as they tell you it, so the team sees who they are talking to.",
      parameters: { type: "object", properties: { name: { type: "string", description: "Visitor's name as given" } }, required: ["name"] },
    },
  },
];

/** Appended to the site prompt: learn the visitor's name early. */
export const VISITOR_NAME_PROMPT = "If you do not know the visitor's name yet, after 2 or 3 exchanges politely ask for it (once, briefly, alongside your answer). When they tell you their name, call set_visitor_name. Use their name naturally afterwards.";

/** Appended to every chat: turn interested visitors into CRM leads. */
export const LEAD_CAPTURE_PROMPT = "Lead capture: after 3 or 4 exchanges, if the visitor shows real interest (prices, availability, a service) and has not shared contact details, offer once, briefly, to have the team follow up: ask for their name and phone number (email optional). When you have name and phone, call create_lead with a short summary of what they need. Do not ask again if they decline, and never ask in every message.";

export type AiTurnResult = {
  text: string;
  usage: { prompt: number; completion: number; cached: number; cost: number };
  leadId: string | null;
  humanRequested: boolean;
  /** Job intake only: the visitor's card for this message. */
  visit: VisitCard | null;
};

type StreamUsage = { prompt_tokens?: number; completion_tokens?: number; cost?: number; prompt_tokens_details?: { cached_tokens?: number } };
type StreamResult = { text: string; calls: ToolCall[]; usage: StreamUsage; finish: string | null };

/**
 * One streamed answer from the configured AI service (lib/ai/provider.ts):
 * forwards text, assembles tool calls, keeps usage. OpenRouter (hosted),
 * Passive Coder AI, OpenAI: OpenAI-format SSE. Anthropic: the official SDK.
 */
async function streamOnce(system: string, context: string, history: Msg[], tools: unknown[], onDelta: (t: string) => void, meta: AiCallMeta = {}): Promise<StreamResult> {
  const provider = aiProvider();
  if (!provider) throw new Error("no key");
  if (provider.id === "anthropic") return streamAnthropic(provider, system, context, history, tools, onDelta);
  // OpenRouter (and the Passive Coder AI API, which forwards to it) take
  // cache_control parts and usage.include; plain OpenAI takes neither.
  const openRouterStyle = provider.id === "openrouter" || provider.id === "passivecoder";
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30_000);
  try {
    const res = await fetch(provider.url, {
      method: "POST",
      signal: ctl.signal,
      headers: providerHeaders(provider, "Passive Coder Site Chat", meta),
      body: JSON.stringify({
        model: provider.model,
        // Bangla, Arabic, Hindi etc. take 3-4x the tokens of English for the
        // same reply; 400 cut those answers off mid-sentence.
        max_tokens: 1000,
        temperature: 0.3,
        stream: true,
        ...(openRouterStyle ? { usage: { include: true } } : { stream_options: { include_usage: true } }),
        tools,
        // The site knowledge is the big, stable part: cache it. Per-message
        // context (matching excerpts from Train AI files) goes after the cache point.
        messages: [{ role: "system", content: openRouterStyle ? [
          { type: "text", text: system, cache_control: { type: "ephemeral" } },
          ...(context ? [{ type: "text", text: context }] : []),
        ] : [system, context].filter(Boolean).join("\n\n") }, ...history],
      }),
    });
    if (!res.ok || !res.body) throw new Error(`upstream ${res.status}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    const calls: ToolCall[] = [];
    let finish: string | null = null;
    let usage: { prompt_tokens?: number; completion_tokens?: number; cost?: number; prompt_tokens_details?: { cached_tokens?: number } } = {};
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        let j: { error?: { message?: string; code?: number | string }; choices?: { finish_reason?: string | null; delta?: { content?: string; tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[] } }[]; usage?: typeof usage };
        try { j = JSON.parse(data); } catch { continue; }
        // OpenRouter reports provider failures inside a 200 stream; these used
        // to be dropped and surfaced only as an unexplained empty answer.
        if (j.error) throw new Error(`upstream stream error ${j.error.code ?? ""}: ${j.error.message ?? "unknown"}`);
        if (j.choices?.[0]?.finish_reason) finish = j.choices[0].finish_reason;
        if (j.usage) usage = j.usage;
        const d = j.choices?.[0]?.delta;
        if (d?.content) { text += d.content; onDelta(d.content); }
        for (const tc of d?.tool_calls ?? []) {
          const c = (calls[tc.index] ??= { id: tc.id ?? `call_${tc.index}`, type: "function", function: { name: "", arguments: "" } });
          if (tc.id) c.id = tc.id;
          if (tc.function?.name) c.function.name += tc.function.name;
          if (tc.function?.arguments) c.function.arguments += tc.function.arguments;
        }
      }
    }
    return { text, calls: calls.filter(Boolean), usage, finish };
  } finally {
    clearTimeout(timer);
  }
}

/** Same as streamOnce, on a self-hosted install's own Anthropic key (official SDK). */
async function streamAnthropic(provider: AiProvider, system: string, context: string, history: Msg[], tools: unknown[], onDelta: (t: string) => void): Promise<StreamResult> {
  const client = new Anthropic({ apiKey: provider.key, timeout: 30_000 });

  // The chat keeps its history in OpenAI's shape; Anthropic wants tool calls
  // as tool_use blocks and tool answers as tool_result blocks in a user turn.
  const messages: Anthropic.MessageParam[] = [];
  const add = (role: "user" | "assistant", block: Anthropic.ContentBlockParam) => {
    const last = messages[messages.length - 1];
    if (last && last.role === role && Array.isArray(last.content)) last.content.push(block);
    else messages.push({ role, content: [block] });
  };
  for (const m of history) {
    const text = typeof m.content === "string" ? m.content : m.content == null ? "" : JSON.stringify(m.content);
    if (m.role === "tool") {
      add("user", { type: "tool_result", tool_use_id: m.tool_call_id ?? "", content: text });
    } else if (m.role === "assistant") {
      if (text) add("assistant", { type: "text", text });
      for (const c of (m.tool_calls as ToolCall[] | undefined) ?? []) {
        let input: unknown = {};
        try { input = JSON.parse(c.function.arguments || "{}"); } catch { /* keep {} */ }
        add("assistant", { type: "tool_use", id: c.id, name: c.function.name, input });
      }
    } else if (text) {
      add("user", { type: "text", text });
    }
  }

  const anthropicTools: Anthropic.Tool[] = (tools as { function: { name: string; description?: string; parameters: unknown } }[]).map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters as Anthropic.Tool["input_schema"],
  }));

  const stream = client.messages.stream({
    model: provider.model,
    max_tokens: 1000,
    // The site knowledge is the big, stable part: cache it.
    system: [
      { type: "text", text: system, cache_control: { type: "ephemeral" } },
      ...(context ? [{ type: "text" as const, text: context }] : []),
    ],
    tools: anthropicTools,
    messages,
  });
  let text = "";
  stream.on("text", (delta) => { text += delta; onDelta(delta); });
  const final = await stream.finalMessage();

  const calls: ToolCall[] = [];
  for (const b of final.content) {
    if (b.type === "tool_use") calls.push({ id: b.id, type: "function", function: { name: b.name, arguments: JSON.stringify(b.input ?? {}) } });
  }
  const u = final.usage;
  const cached = u.cache_read_input_tokens ?? 0;
  const finish = final.stop_reason === "tool_use" ? "tool_calls" : final.stop_reason === "max_tokens" ? "length" : final.stop_reason === "end_turn" ? "stop" : final.stop_reason;
  return {
    text,
    calls,
    usage: {
      prompt_tokens: u.input_tokens + cached + (u.cache_creation_input_tokens ?? 0),
      completion_tokens: u.output_tokens,
      prompt_tokens_details: { cached_tokens: cached },
    },
    finish,
  };
}

export async function runAiTurn(opts: {
  admin: Admin; tenantId: string; siteName: string | null; conversationId: string; sessionId: string;
  system: string; context?: string; history: Msg[]; transcriptText: () => string; onDelta: (t: string) => void;
  /** Only for sites that opted into job intake; every other site gets the plain tools. */
  intake?: IntakeRun | null;
}): Promise<AiTurnResult> {
  const { tenantId, conversationId, intake } = opts;
  // The site's extra tools. create_lead takes the job fields there, so its plain version drops out.
  const tools = intake ? [...TOOLS.filter((t) => t.function.name !== "create_lead"), ...intake.tools] : TOOLS;
  const history = [...opts.history];
  const tot = { prompt: 0, completion: 0, cached: 0, cost: 0 };
  let leadId: string | null = null;
  let humanRequested = false;
  let text = "";
  let finish: string | null = null;
  // Intake can take an extra round: times, then the save, then the answer.
  for (let round = 0; round < (intake ? 4 : 3); round++) {
    const r = await streamOnce(opts.system, opts.context ?? "", history, tools, (t) => { text += t; opts.onDelta(t); }, { use: "website_chat", ref: conversationId });
    const cached = r.usage.prompt_tokens_details?.cached_tokens ?? 0;
    tot.prompt += r.usage.prompt_tokens ?? 0;
    tot.completion += r.usage.completion_tokens ?? 0;
    tot.cached += cached;
    finish = r.finish;
    tot.cost += chatCostUsd({ cost: r.usage.cost, prompt_tokens: r.usage.prompt_tokens, completion_tokens: r.usage.completion_tokens, cached });
    if (!r.calls.length) break;
    history.push({ role: "assistant", content: r.text || "", tool_calls: r.calls });
    for (const call of r.calls) {
      let result = "unknown tool";
      let args: Record<string, string> = {};
      try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* bad args */ }
      if (call.function.name === "set_visitor_name") {
        const name = String(args.name ?? "").trim().slice(0, 120);
        if (name) await opts.admin.from("site_chat_conversations").update({ visitor_name: name }).eq("id", conversationId);
        result = name ? "ok: name saved" : "error: name missing";
      } else if (call.function.name === "request_human") {
        humanRequested = true;
        result = "ok: the team has been notified and will reply in this chat";
      } else if (intake && call.function.name === "find_visit_times") {
        result = await intake.findTimes(args).catch(() => "unavailable: use create_lead instead.");
      } else if (intake && call.function.name === "request_site_visit") {
        result = await intake.requestVisit(args).catch(() => "error: could not save, ask the visitor to use WhatsApp");
      } else if (intake && call.function.name === "create_lead") {
        result = await intake.saveLead(args).catch(() => "error: could not save, ask the visitor to use WhatsApp");
      } else if (call.function.name === "create_lead") {
        if (!args.name || !args.phone) result = "error: name and phone are required";
        else if (await isBlockedSender(tenantId, { email: args.email, phone: args.phone, session: opts.sessionId }, "chat", { name: args.name, message: args.message ?? "" })) {
          await opts.admin.from("site_chat_conversations").update({ blocked_at: new Date().toISOString() }).eq("id", conversationId);
          result = "ok: lead saved, the team will contact the visitor";
        } else {
          const id = await upsertContact({
            tenantId, name: args.name, phone: args.phone, email: args.email || null, source: "ai_chat",
            consentEmail: !!args.email, tags: ["ai-chat"],
            event: {
              type: "note",
              title: `AI chat lead${args.service ? `: ${args.service}` : ""}`,
              body: `${args.message ?? ""}\n\n--- Chat transcript ---\n${opts.transcriptText()}`.slice(0, 8000),
              meta: { source: "ai_chat", session_id: opts.sessionId, conversation_id: conversationId, service: args.service ?? null },
            },
          }).catch(() => null);
          if (id) {
            leadId = id;
            await opts.admin.from("site_chat_conversations").update({ lead_contact_id: id, visitor_name: args.name.slice(0, 120) }).eq("id", conversationId);
            // Runs inside the response stream (after() is not available there):
            // awaited, both never throw.
            await enrollInSequences(tenantId, id, "enquiry", {
              name: args.name, phone: args.phone, site_name: opts.siteName, service: args.service || "enquiry",
            }).catch(() => undefined);
            await notifyTenantEvent({
              tenantId, type: "lead", id, title: `New AI chat lead: ${args.name}`,
              body: String(args.message ?? args.service ?? "").slice(0, 140) || "Open the dashboard to read it.", webUrl: "/dashboard/crm",
            }).catch(() => undefined);
            result = "ok: lead saved, the team will contact the visitor";
          } else result = "error: could not save, ask the visitor to use WhatsApp";
        }
      }
      history.push({ role: "tool", tool_call_id: call.id, content: result });
    }
    if (text) { text += "\n\n"; opts.onDelta("\n\n"); }
  }
  // Logged by the caller; the finish reason says why there was nothing to show.
  // A saved request is never reported as a failure just because the model went quiet after it.
  if (!text.trim() && intake?.fallback()) text = intake.fallback()!;
  if (!text.trim()) throw new Error(`empty (finish_reason=${finish ?? "none"})`);
  return { text: text.trim(), usage: tot, leadId: leadId ?? intake?.leadId() ?? null, humanRequested, visit: intake?.card() ?? null };
}

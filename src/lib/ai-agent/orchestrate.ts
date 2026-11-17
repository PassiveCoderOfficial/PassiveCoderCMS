import { z } from "zod";
import { callModel, AiCoderError } from "@/lib/aicoder/generate";
import { type AgentTool, type AgentToolContextKind, type AgentToolContext } from "./tools";
import { allToolsForContext as toolsForContext, argsHint } from "./all-tools";

export type AgentHistoryMessage = { role: "user" | "assistant" | "system"; content: string };

const ACTION_SCHEMA = z.object({
  reply: z.string(),
  action: z
    .object({
      tool: z.string(),
      args: z.record(z.string(), z.unknown()).default({}),
    })
    .optional(),
});

export type AgentTurnResult =
  | { kind: "reply"; reply: string }
  | { kind: "read"; reply: string; tool: AgentTool; args: Record<string, unknown> }
  | { kind: "propose"; reply: string; tool: AgentTool; args: Record<string, unknown> };

function toolsBlock(tools: AgentTool[]): string {
  if (tools.length === 0) return "(no tools available in this context)";
  return tools
    .map(t => `- ${t.name}${t.readOnly ? " (read-only)" : " (write — requires user confirmation)"}:${argsHint(t)} — ${t.description}`)
    .join("\n");
}

function systemPrompt(contextKind: AgentToolContextKind, pageId: string | undefined, tools: AgentTool[]): string {
  return [
    "You are the AI Agent embedded in a multi-tenant website admin dashboard (Passive Coder CMS).",
    "You help the signed-in site owner/staff manage their own site: answering questions, reading their data, and proposing changes.",
    "You can NOT call tools directly. Instead, respond with ONE JSON object: { \"reply\": string, \"action\"?: { \"tool\": string, \"args\": object } }.",
    "Set `action` only when the user's message calls for reading data or making a change via one of the tools below. Otherwise omit it and just answer in `reply`.",
    "If you set `action`, `reply` should be a short natural-language acknowledgement (e.g. \"Let me check that.\" or \"Here's what I'll do:\") — it will be replaced or followed up once the tool result is known.",
    "Never invent a tool name or argument not listed below. Never claim you already made a change — only confirmed write tools actually change anything.",
    "For a change that touches several places (an address, phone, price or name on several pages, the header and the footer), use find_replace_text once: it updates everything together. Use search_site_text first if you are unsure of the exact current wording.",
    "To reword existing text (a headline, a button, a sentence), do NOT read whole pages: call search_site_text with a few words you expect in it (e.g. 'Reliable Handyman' or the page's main heading words), then find_replace_text with the exact current wording.",
    "For images: search_stock_photos, then set_block_image with the chosen URL (get_page_blocks gives section ids). Say what you changed in plain words.",
    "Website chat training: when the owner states a lasting fact, offer, policy or behaviour for the visitor chat on their website (e.g. 'if anyone asks for a discount, say 10% if they book today', 'never quote prices, ask for a site visit'), propose add_chat_training with the instruction rewritten clearly. The owner sees a confirm card, so in `reply` briefly ask whether to save it for the website chat. If it is unclear whether they mean the website chat or something else, ask in `reply` without an action. Ordinary questions and one-off requests are not training.",
    "Projects: list_projects, get_project, list_my_tasks and whats_overdue read the work this person may see. create_project, create_task, update_task_status and add_project_comment change it; get ids from a read tool first. Never state a budget or price a tool did not return. If a project tool says projects aren't available, say so plainly.",
    "To plan a described job, propose create_project_plan with their description; in `reply` say it costs 10 AI Credits on a client site and that the project can be edited afterwards.",
    `Current context: ${contextKind}${pageId ? ` (editing page ${pageId})` : ""}.`,
    "Available tools:",
    toolsBlock(tools),
  ].join("\n");
}

function historyToPrompt(history: AgentHistoryMessage[]): string {
  if (history.length === 0) return "(no prior messages)";
  return history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
}

/**
 * One agent turn (Fallback A — no real provider tool-calling):
 * 1. Ask the model for one JSON object { reply, action? }.
 * 2. If action names a read-only tool, execute it now and ask the model again
 *    with the tool result folded in, so the final reply incorporates the data.
 * 3. If action names a write tool, validate args and hand back a proposal —
 *    the caller (chat route) is responsible for creating the pending action row.
 */
export async function runAgentTurn(opts: {
  contextKind: AgentToolContextKind;
  pageId?: string;
  history: AgentHistoryMessage[];
  message: string;
}): Promise<AgentTurnResult> {
  const { contextKind, pageId, history, message } = opts;
  const tools = toolsForContext(contextKind);

  const system = systemPrompt(contextKind, pageId, tools);
  const userPrompt = [
    "Conversation so far:",
    historyToPrompt(history),
    "",
    `New user message: ${message}`,
  ].join("\n");

  const first = await callModel(ACTION_SCHEMA, system, userPrompt, 800);

  if (!first.action) {
    return { kind: "reply", reply: first.reply };
  }

  const tool = tools.find(t => t.name === first.action!.tool);
  if (!tool) {
    // Model named a tool that isn't offered in this context — treat as a
    // plain reply rather than surfacing an internal error to the user.
    return { kind: "reply", reply: first.reply };
  }

  const parsedArgs = tool.argsSchema.safeParse(first.action.args ?? {});
  if (!parsedArgs.success) {
    return {
      kind: "reply",
      reply: `${first.reply}\n\n(I tried to use "${tool.name}" but the details didn't check out — could you rephrase with more specifics?)`,
    };
  }

  const args = parsedArgs.data as Record<string, unknown>;

  if (!tool.readOnly) {
    return { kind: "propose", reply: first.reply, tool, args };
  }

  return { kind: "read", reply: first.reply, tool, args };
}

/** Executes a read-only tool and asks the model to produce a final reply that
 *  incorporates the result. Split from runAgentTurn so the chat route can run
 *  the tenant-scoped query with its own Supabase client. */
/** One read already performed in this turn, kept so later steps see it. */
export type PriorRead = { tool: string; args: Record<string, unknown>; result: string };

const MAX_READS_PER_TURN = 3;

/**
 * Tool results go back into the prompt on every step of a read chain. A full
 * page's block JSON is tens of kilobytes, and re-sending it made each model
 * call slower until the turn hit the 300 s function limit
 * (INTERNAL_FUNCTION_INVOCATION_FAILED). Navigation and hero blocks come
 * first, so the head of the result is what edits usually need.
 */
const MAX_RESULT_CHARS = 9000;
function trimResult(json: string): string {
  if (json.length <= MAX_RESULT_CHARS) return json;
  return `${json.slice(0, MAX_RESULT_CHARS)} …[truncated ${json.length - MAX_RESULT_CHARS} chars]`;
}

export async function finishReadOnlyTurn(opts: {
  contextKind: AgentToolContextKind;
  pageId?: string;
  history: AgentHistoryMessage[];
  message: string;
  tool: AgentTool;
  args: Record<string, unknown>;
  ctx: AgentToolContext;
  /** Reads already done earlier in this same turn (oldest first). */
  prior?: PriorRead[];
}): Promise<AgentTurnResult & { reads: PriorRead[] }> {
  const { contextKind, pageId, history, message, tool, args, ctx } = opts;
  const prior = opts.prior ?? [];
  const tools = toolsForContext(contextKind);

  let toolResult: unknown;
  let toolError: string | null = null;
  try {
    toolResult = await tool.run(args, ctx);
  } catch (err) {
    toolError = err instanceof Error ? err.message : "Tool failed";
  }
  const reads: PriorRead[] = [
    ...prior,
    {
      tool: tool.name,
      args,
      result: toolError ? `ERROR: ${toolError}` : trimResult(JSON.stringify(toolResult)),
    },
  ];
  const canReadAgain = reads.length < MAX_READS_PER_TURN;

  const system = systemPrompt(contextKind, pageId, tools);
  const userPrompt = [
    "Conversation so far:",
    historyToPrompt(history),
    "",
    `New user message: ${message}`,
    "",
    "Tools you have already called in this turn (oldest first):",
    ...reads.map((r, i) => `${i + 1}. ${r.tool} ${JSON.stringify(r.args)} -> ${r.result}`),
    "",
    canReadAgain
      ? "Now respond with the JSON object { reply, action? }. If the user asked for a change and you have what you need, put that write in `action`. If you still need one more piece of information to make the change (for example the blocks of a page you just found), you may call one more read-only tool instead. Otherwise just answer in `reply`."
      : "Now respond with the final JSON object { reply, action? }. If the user asked for a change, put that write in `action` now; do not call another read-only tool.",
  ].join("\n");

  const next = await callModel(ACTION_SCHEMA, system, userPrompt, 900);

  // A read is usually the first half of an edit ("change the headline" needs
  // the page, then its blocks). Surface a proposed write as a pending action,
  // and allow a bounded chain of reads, instead of ending the turn with
  // "let me look at that" and doing nothing.
  if (next.action) {
    const nt = tools.find(t => t.name === next.action!.tool);
    if (nt) {
      const parsed = nt.argsSchema.safeParse(next.action.args ?? {});
      if (parsed.success) {
        const a = parsed.data as Record<string, unknown>;
        if (!nt.readOnly) return { kind: "propose", reply: next.reply, tool: nt, args: a, reads };
        if (canReadAgain) return { kind: "read", reply: next.reply, tool: nt, args: a, reads };
      }
    }
  }
  return { kind: "reply", reply: next.reply, reads };
}

export { AiCoderError };

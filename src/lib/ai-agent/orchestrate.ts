import { z } from "zod";
import { callModel, AiCoderError } from "@/lib/aicoder/generate";
import { toolsForContext, type AgentTool, type AgentToolContextKind, type AgentToolContext } from "./tools";

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
    .map(t => `- ${t.name}${t.readOnly ? " (read-only)" : " (write — requires user confirmation)"}: ${t.description}`)
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
export async function finishReadOnlyTurn(opts: {
  contextKind: AgentToolContextKind;
  pageId?: string;
  history: AgentHistoryMessage[];
  message: string;
  tool: AgentTool;
  args: Record<string, unknown>;
  ctx: AgentToolContext;
}): Promise<string> {
  const { contextKind, pageId, history, message, tool, args, ctx } = opts;
  const tools = toolsForContext(contextKind);

  let toolResult: unknown;
  let toolError: string | null = null;
  try {
    toolResult = await tool.run(args, ctx);
  } catch (err) {
    toolError = err instanceof Error ? err.message : "Tool failed";
  }

  const system = systemPrompt(contextKind, pageId, tools);
  const userPrompt = [
    "Conversation so far:",
    historyToPrompt(history),
    "",
    `New user message: ${message}`,
    "",
    `You called tool "${tool.name}" with args ${JSON.stringify(args)}.`,
    toolError
      ? `The tool failed with: ${toolError}`
      : `Tool result (JSON): ${JSON.stringify(toolResult)}`,
    "",
    "Now respond with the final JSON object { reply, action? } — incorporate the tool result into `reply` in plain language. Do not call another tool unless the user's message clearly asked for a second action.",
  ].join("\n");

  const second = await callModel(ACTION_SCHEMA, system, userPrompt, 900);
  return second.reply;
}

export { AiCoderError };

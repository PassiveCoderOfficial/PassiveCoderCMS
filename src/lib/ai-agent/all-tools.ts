import { z } from "zod";
import { MCP_TOOLS } from "@/lib/mcp/tools";
import { CREDIT_COSTS } from "@/lib/ai/credit-costs";
import { AGENT_TOOLS, describePendingAction as describeOwn, type AgentTool, type AgentToolContextKind } from "./tools";

/**
 * One tool set for every AI surface (2026-10-14): the in-dashboard agent,
 * the AiCoder page and outside AIs over MCP. The agent used to have 10 tools
 * and couldn't edit page text, the header or the footer; MCP had 27. Now the
 * agent gets the agent's own tools plus every MCP tool, with write tools
 * still going through the confirm card.
 */
const OWN = new Set(AGENT_TOOLS.map((t) => t.name));

const FROM_MCP: AgentTool[] = MCP_TOOLS.filter((t) => !OWN.has(t.name)).map((t) => ({
  name: t.name,
  description: t.description,
  argsSchema: t.schema,
  readOnly: !t.write,
  contexts: ["general", "editor"] as AgentToolContextKind[],
  run: (args: unknown, ctx) => t.run(args as never, ctx),
}));

export const ALL_AGENT_TOOLS: AgentTool[] = [...AGENT_TOOLS, ...FROM_MCP];

export function allToolsForContext(context: AgentToolContextKind): AgentTool[] {
  return ALL_AGENT_TOOLS.filter((t) => t.contexts.includes(context));
}

export function findAnyTool(name: string): AgentTool | undefined {
  return ALL_AGENT_TOOLS.find((t) => t.name === name);
}

/** Arguments a tool takes, as compact JSON for the model's tool list. */
export function argsHint(t: AgentTool): string {
  try {
    const s = z.toJSONSchema(t.argsSchema, { io: "input" }) as { properties?: Record<string, { type?: unknown }>; required?: string[] };
    const props = Object.entries(s.properties ?? {}).map(([k, v]) => `${k}${s.required?.includes(k) ? "" : "?"}:${Array.isArray(v.type) ? v.type.join("|") : v.type ?? "any"}`);
    return props.length ? ` args {${props.join(", ")}}` : "";
  } catch { return ""; }
}

export function describeAnyPendingAction(tool: string, args: Record<string, unknown>): string {
  switch (tool) {
    case "find_replace_text": return `Replace "${String(args.find)}" with "${String(args.replace)}" everywhere on the site`;
    case "set_block_image": return `Put ${args.imageUrl ? "the chosen image" : `a photo of "${String(args.query)}"`} into a section of this page`;
    case "update_business_profile": return `Update business profile (${Object.keys(args).join(", ")})`;
    case "save_page_blocks": return "Save new content for this page";
    case "publish_page": return "Publish this page";
    case "add_chat_training": return `Teach the website chat AI (${args.kind === "qa" ? "answer" : "rule"}): ${String(args.kind === "qa" ? `${args.title ?? ""} -> ${args.content}` : args.content).slice(0, 300)}`;
    case "delete_chat_training": return "Remove this from what the website chat AI was taught";
    case "create_page": return `Create a new page "${String(args.title ?? "")}"`;
    case "create_project": return `Create ${args.type === "job" ? "a job" : "a project"} "${String(args.name ?? "")}"${args.template ? " from a template" : ""}${args.is_private ? " (private)" : ""}`;
    case "create_task": return `Add the task "${String(args.title ?? "")}" to this project`;
    case "update_task_status": return `Move this task to ${String(args.status ?? "").replace("_", " ")}`;
    case "add_project_comment": return `Add a comment the project's team can read: "${String(args.body ?? "").slice(0, 300)}"`;
    case "create_project_plan": return `Draft a project plan with AI and create the project (${CREDIT_COSTS.project_plan} AI Credits, free on the team workspace): "${String(args.description ?? "").slice(0, 300)}"`;
    default: return describeOwn(tool, args);
  }
}

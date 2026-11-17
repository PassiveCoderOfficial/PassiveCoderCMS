import type { McpTool } from "@/lib/mcp/tools";

/**
 * Who may see and call which MCP tool. Kept free of server-only imports so
 * tests can check it directly (tests/mcp).
 */

/** Tools a caller sees in tools/list: write tools need a write token, super-admin tools a super admin. */
export function visibleIn(tools: McpTool[], scope: "read" | "write", superAdmin: boolean): McpTool[] {
  return tools.filter((t) => (scope === "write" || !t.write) && (superAdmin || !t.superAdmin));
}

/** The tool a caller may call by name. Super-admin tools do not exist for anyone else. */
export function callableIn(tools: McpTool[], name: string, superAdmin: boolean): McpTool | undefined {
  const t = tools.find((x) => x.name === name);
  return t && (!t.superAdmin || superAdmin) ? t : undefined;
}

import { NextResponse } from "next/server";
import { getSiteLinks, linksBrief, withUrls, type SiteLinks } from "@/lib/mcp/site-links";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyMcpBearer, type McpCaller } from "@/lib/mcp/auth";
import { MCP_TOOLS, findMcpTool, toolJsonSchema } from "@/lib/mcp/tools";

/**
 * Passive Coder MCP server (Model Context Protocol, Streamable HTTP
 * transport, stateless JSON responses). People connect their own AI agent —
 * Claude, ChatGPT/Codex, Gemini, Cursor — with OAuth or a personal access
 * token from Dashboard > AI Connect, then work on their site in plain words.
 *
 * Each request is authenticated on its own (no server-side sessions), so it
 * runs fine on serverless. Every tool call is written to mcp_audit.
 */

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-protocol-version, mcp-session-id",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
};

type RpcReq = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

function unauthorized(req: Request) {
  const origin = new URL(req.url).origin;
  return new NextResponse(JSON.stringify({ error: "unauthorized", error_description: "Connect with OAuth or a personal access token from Dashboard > AI Connect." }), {
    status: 401,
    headers: {
      ...CORS,
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
    },
  });
}

const ok = (id: RpcReq["id"], result: unknown) => ({ jsonrpc: "2.0" as const, id: id ?? null, result });
const err = (id: RpcReq["id"], code: number, message: string) => ({ jsonrpc: "2.0" as const, id: id ?? null, error: { code, message } });

async function handle(msg: RpcReq, caller: McpCaller, siteName: string, links: SiteLinks | null, connName: string | null) {
  switch (msg.method) {
    case "initialize": {
      const asked = String(msg.params?.protocolVersion ?? "");
      return ok(msg.id, {
        protocolVersion: SUPPORTED.includes(asked) ? asked : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        // Title = this connection's name (the site name unless renamed in AI Connect),
        // so an AI app with several sites connected shows which is which.
        serverInfo: { name: "passive-coder", title: connName ? `${connName} (Passive Coder)` : "Passive Coder", version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1" },
        instructions:
          `You are connected to the Passive Coder dashboard for the website "${siteName}" with ${caller.scope === "write" ? "read and write" : "read-only"} access. ` +
          "Pages are built from blocks: call list_block_types and get_block_template before editing, read with get_page_blocks, save with save_page_blocks (published pages save as a draft), then publish_page when the user wants it live. " +
          "Prefer drafts and confirm with the user before publishing or changing orders/bookings. " +
          (links ? linksBrief(links) + " Call get_site_info for these details at any time." : ""),
      });
    }
    case "ping":
      return ok(msg.id, {});
    case "tools/list":
      return ok(msg.id, {
        tools: [
          {
            name: "get_site_info",
            title: "Site info and addresses",
            description: "The connected site's name, live URL, default subdomain URL (always works, even before a custom domain is connected), custom domain and its status, and the dashboard URL. No args.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
            annotations: { title: "Site info and addresses", readOnlyHint: true, destructiveHint: false, openWorldHint: false },
          },
          ...MCP_TOOLS.filter((t) => caller.scope === "write" || !t.write).map((t) => ({
            name: t.name,
            title: t.title,
            description: t.description,
            inputSchema: toolJsonSchema(t),
            annotations: { title: t.title, readOnlyHint: !t.write, destructiveHint: false, openWorldHint: false },
          })),
        ],
      });
    case "tools/call": {
      const name = String(msg.params?.name ?? "");
      if (name === "get_site_info") {
        return ok(msg.id, { content: [{ type: "text", text: JSON.stringify(links ?? { error: "Site not found" }, null, 2) }] });
      }
      const tool = findMcpTool(name);
      if (!tool) return err(msg.id, -32602, `Unknown tool: ${name}`);
      const admin = await createAdminClient();
      const audit = (okFlag: boolean, args: unknown, error?: string) =>
        admin.from("mcp_audit").insert({ token_id: caller.tokenId, user_id: caller.userId, tenant_id: caller.tenantId, tool: name, args: args ?? null, ok: okFlag, error: error ?? null }).then(() => {}, () => {});
      if (tool.write && caller.scope !== "write") {
        await audit(false, msg.params?.arguments, "read-only token");
        return ok(msg.id, { isError: true, content: [{ type: "text", text: "This connection is read-only. Reconnect with write access to make changes." }] });
      }
      const parsed = tool.schema.safeParse(msg.params?.arguments ?? {});
      if (!parsed.success) {
        return ok(msg.id, { isError: true, content: [{ type: "text", text: `Invalid arguments: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}` }] });
      }
      try {
        const result = await tool.run(parsed.data as never, { tenantId: caller.tenantId, userId: caller.userId, supabase: admin });
        await audit(true, parsed.data);
        const enriched = links ? withUrls(result, links, name) : result;
        return ok(msg.id, { content: [{ type: "text", text: JSON.stringify(enriched, null, 2) }] });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Tool failed";
        await audit(false, parsed.data, message);
        return ok(msg.id, { isError: true, content: [{ type: "text", text: message }] });
      }
    }
    default:
      return err(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  const caller = await verifyMcpBearer(req);
  if (!caller) return unauthorized(req);

  let body: RpcReq | RpcReq[];
  try { body = await req.json(); } catch { return NextResponse.json(err(null, -32700, "Parse error"), { status: 400, headers: CORS }); }

  const admin = await createAdminClient();
  const links = await getSiteLinks(admin, caller.tenantId);
  const siteName = links?.name ?? "your site";
  const { data: tokRow } = await admin.from("mcp_tokens").select("name").eq("id", caller.tokenId).maybeSingle();
  const connName = (tokRow?.name as string | null) ?? siteName;

  const msgs = Array.isArray(body) ? body : [body];
  const out = [];
  for (const m of msgs) {
    if (!m || typeof m.method !== "string") { out.push(err(null, -32600, "Invalid request")); continue; }
    if (m.id === undefined || m.method.startsWith("notifications/")) continue; // notifications: no reply
    out.push(await handle(m, caller, siteName, links, connName));
  }
  if (out.length === 0) return new NextResponse(null, { status: 202, headers: CORS });
  return NextResponse.json(Array.isArray(body) ? out : out[0], { headers: CORS });
}

// No server-initiated stream: this server only answers requests.
export async function GET(req: Request) {
  const caller = await verifyMcpBearer(req);
  if (!caller) return unauthorized(req);
  return new NextResponse(null, { status: 405, headers: { ...CORS, Allow: "POST" } });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

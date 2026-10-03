import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "content-type" };

/**
 * RFC 7591 dynamic client registration: how claude.ai, ChatGPT, Claude
 * Desktop/Code and other MCP clients register themselves before the sign-in
 * flow. Public clients only (PKCE, no client secret).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { redirect_uris?: unknown; client_name?: unknown };
  const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u): u is string => typeof u === "string") : [];
  const valid = uris.length > 0 && uris.length <= 10 && uris.every((u) => {
    try {
      const url = new URL(u);
      if (["javascript:", "data:", "file:", "vbscript:"].includes(url.protocol)) return false;
      if (url.protocol === "http:") return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      return true; // https and app schemes (cursor://, vscode://)
    } catch {
      return false;
    }
  });
  if (!valid) return NextResponse.json({ error: "invalid_redirect_uri" }, { status: 400, headers: CORS });

  const clientId = "mcp_" + randomBytes(16).toString("hex");
  const clientName = typeof body.client_name === "string" ? body.client_name.slice(0, 100) : "AI app";
  const admin = await createAdminClient();
  const { error } = await admin.from("mcp_oauth_clients").insert({ client_id: clientId, client_name: clientName, redirect_uris: uris });
  if (error) return NextResponse.json({ error: "server_error" }, { status: 500, headers: CORS });

  return NextResponse.json({
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: clientName,
    redirect_uris: uris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  }, { status: 201, headers: CORS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

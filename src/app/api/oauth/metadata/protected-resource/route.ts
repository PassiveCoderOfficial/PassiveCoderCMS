import { NextResponse } from "next/server";

// RFC 9728 protected resource metadata for the MCP endpoint (served at
// /.well-known/oauth-protected-resource[/api/mcp] via a next.config rewrite).
export function GET(req: Request) {
  const o = new URL(req.url).origin;
  return NextResponse.json({
    resource: `${o}/api/mcp`,
    authorization_servers: [o],
    scopes_supported: ["read", "write"],
    bearer_methods_supported: ["header"],
    resource_name: "Passive Coder",
  }, { headers: { "Access-Control-Allow-Origin": "*" } });
}

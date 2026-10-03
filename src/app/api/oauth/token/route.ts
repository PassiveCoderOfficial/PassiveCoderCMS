import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { ACCESS_TTL_S, REFRESH_TTL_S, issueToken, sha256, siteAccess, type McpScope } from "@/lib/mcp/auth";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "content-type, authorization" };
const bad = (error: string, description?: string, status = 400) =>
  NextResponse.json({ error, ...(description ? { error_description: description } : {}) }, { status, headers: { ...CORS, "Cache-Control": "no-store" } });

async function params(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await req.json().catch(() => ({}))) as Record<string, string>;
  return Object.fromEntries(new URLSearchParams(await req.text()));
}

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

async function pair(admin: Admin, userId: string, tenantId: string, scope: McpScope, clientId: string) {
  const access = await issueToken(admin, { kind: "access", userId, tenantId, scope, clientId, ttlSeconds: ACCESS_TTL_S });
  const refresh = await issueToken(admin, { kind: "refresh", userId, tenantId, scope, clientId, ttlSeconds: REFRESH_TTL_S });
  return NextResponse.json({
    access_token: access.token,
    token_type: "Bearer",
    expires_in: ACCESS_TTL_S,
    refresh_token: refresh.token,
    scope,
  }, { headers: { ...CORS, "Cache-Control": "no-store" } });
}

/** OAuth 2.1 token endpoint: authorization_code (PKCE S256) and refresh_token (rotating). */
export async function POST(req: Request) {
  const p = await params(req);
  const admin = await createAdminClient();

  if (p.grant_type === "authorization_code") {
    if (!p.code || !p.code_verifier || !p.client_id) return bad("invalid_request", "code, code_verifier and client_id are required");
    const { data: code } = await admin.from("mcp_oauth_codes").select("*").eq("code_hash", sha256(p.code)).maybeSingle();
    if (!code || code.used_at || new Date(code.expires_at).getTime() < Date.now()) return bad("invalid_grant", "Code is invalid or expired");
    if (code.client_id !== p.client_id) return bad("invalid_grant", "Code was issued to another client");
    if (p.redirect_uri && p.redirect_uri !== code.redirect_uri) return bad("invalid_grant", "redirect_uri mismatch");
    const challenge = createHash("sha256").update(p.code_verifier).digest("base64url");
    if (challenge !== code.code_challenge) return bad("invalid_grant", "PKCE verification failed");
    // Single use: claim it atomically.
    const { data: claimed } = await admin.from("mcp_oauth_codes").update({ used_at: new Date().toISOString() })
      .eq("code_hash", code.code_hash).is("used_at", null).select("code_hash");
    if (!claimed?.length) return bad("invalid_grant", "Code already used");
    return pair(admin, code.user_id, code.tenant_id, code.scope as McpScope, code.client_id);
  }

  if (p.grant_type === "refresh_token") {
    if (!p.refresh_token) return bad("invalid_request", "refresh_token is required");
    const { data: tok } = await admin.from("mcp_tokens").select("*").eq("token_hash", sha256(p.refresh_token)).eq("kind", "refresh").maybeSingle();
    if (!tok || tok.revoked_at || (tok.expires_at && new Date(tok.expires_at).getTime() < Date.now())) return bad("invalid_grant", "Refresh token is invalid or expired");
    if (p.client_id && tok.client_id && p.client_id !== tok.client_id) return bad("invalid_grant", "Token was issued to another client");
    if (!(await siteAccess(admin, tok.user_id, tok.tenant_id))) return bad("invalid_grant", "You no longer have access to this site");
    await admin.from("mcp_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", tok.id);
    return pair(admin, tok.user_id, tok.tenant_id, tok.scope as McpScope, tok.client_id);
  }

  return bad("unsupported_grant_type");
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

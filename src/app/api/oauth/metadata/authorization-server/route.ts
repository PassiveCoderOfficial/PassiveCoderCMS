import { NextResponse } from "next/server";

// RFC 8414 authorization server metadata (served at
// /.well-known/oauth-authorization-server via a next.config rewrite).
export function GET(req: Request) {
  const o = new URL(req.url).origin;
  return NextResponse.json({
    issuer: o,
    authorization_endpoint: `${o}/oauth/authorize`,
    token_endpoint: `${o}/api/oauth/token`,
    registration_endpoint: `${o}/api/oauth/register`,
    userinfo_endpoint: `${o}/api/oauth/userinfo`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["read", "write", "openid", "profile", "email"],
    claims_supported: ["sub", "name", "preferred_username", "nickname", "email"],
  }, { headers: { "Access-Control-Allow-Origin": "*" } });
}

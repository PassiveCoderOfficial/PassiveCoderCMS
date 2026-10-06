import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyMcpBearer } from "@/lib/mcp/auth";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization, Content-Type" };

/**
 * OpenID-style userinfo for a connection. AI apps that list several
 * connected accounts use this to label them, so the account is named after
 * the site (or the name given in AI Connect) rather than just the person.
 */
async function handle(req: Request) {
  const caller = await verifyMcpBearer(req);
  if (!caller) return NextResponse.json({ error: "invalid_token" }, { status: 401, headers: { ...CORS, "WWW-Authenticate": 'Bearer error="invalid_token"' } });
  const admin = await createAdminClient();
  const [{ data: t }, { data: tok }, { data: p }] = await Promise.all([
    admin.from("tenants").select("name, slug").eq("id", caller.tenantId).maybeSingle(),
    admin.from("mcp_tokens").select("name").eq("id", caller.tokenId).maybeSingle(),
    admin.from("profiles").select("email, full_name").eq("id", caller.userId).maybeSingle(),
  ]);
  const label = (tok?.name as string | null) || (t?.name as string | null) || "Passive Coder site";
  return NextResponse.json({
    sub: `${caller.userId}:${caller.tenantId}`,
    name: label,
    preferred_username: (t?.slug as string | null) ?? label,
    nickname: label,
    ...(p?.email ? { email: p.email, email_verified: true } : {}),
    site: { name: t?.name ?? null, slug: t?.slug ?? null },
    person: p?.full_name ?? null,
  }, { headers: { ...CORS, "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }); }

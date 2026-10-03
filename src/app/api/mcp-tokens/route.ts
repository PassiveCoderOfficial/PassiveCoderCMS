import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { issueToken, siteAccess } from "@/lib/mcp/auth";

/**
 * Dashboard > AI Connect. Each person manages only their own connections to
 * the site they have open: personal access tokens (for CLI agents) and OAuth
 * connections (apps that signed in). Owners/admins also see the site's recent
 * MCP activity from everyone.
 */
async function ctx() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const tenantId = await apiTenantId();
  if (!tenantId) return null;
  const admin = await createAdminClient();
  const access = await siteAccess(admin, user.id, tenantId);
  if (!access) return null;
  return { user, tenantId, admin, access };
}

export async function GET() {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [{ data: tokens }, { data: activity }] = await Promise.all([
    c.admin.from("mcp_tokens")
      .select("id, kind, name, prefix, scope, client_id, created_at, last_used_at, expires_at, mcp_oauth_clients(client_name)")
      .eq("tenant_id", c.tenantId).eq("user_id", c.user.id).in("kind", ["pat", "refresh"])
      .is("revoked_at", null).order("created_at", { ascending: false }),
    c.admin.from("mcp_audit").select("tool, ok, error, created_at, user_id")
      .eq("tenant_id", c.tenantId).order("created_at", { ascending: false }).limit(30),
  ]);
  const live = (tokens ?? []).filter((t) => !t.expires_at || new Date(t.expires_at).getTime() > Date.now());
  return NextResponse.json({
    access: c.access,
    tokens: live.map((t) => ({
      id: t.id,
      type: t.kind === "pat" ? "token" : "app",
      name: t.kind === "pat" ? t.name : ((Array.isArray(t.mcp_oauth_clients) ? t.mcp_oauth_clients[0] : t.mcp_oauth_clients) as { client_name?: string } | null)?.client_name ?? "AI app",
      prefix: t.kind === "pat" ? t.prefix : null,
      scope: t.scope,
      created_at: t.created_at,
      last_used_at: t.last_used_at,
    })),
    activity: (activity ?? []).map((a) => ({ ...a, mine: a.user_id === c.user.id, user_id: undefined })),
  });
}

const createSchema = z.object({ name: z.string().trim().min(1).max(60), scope: z.enum(["read", "write"]) });

export async function POST(req: Request) {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Give the token a name" }, { status: 400 });
  const scope = parsed.data.scope === "write" && c.access === "write" ? "write" : "read";
  const t = await issueToken(c.admin, { kind: "pat", userId: c.user.id, tenantId: c.tenantId, scope, name: parsed.data.name, ttlSeconds: 60 * 60 * 24 * 365 });
  return NextResponse.json({ token: t.token, scope });
}

export async function DELETE(req: Request) {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { data: tok } = await c.admin.from("mcp_tokens").select("id, kind, client_id")
    .eq("id", id).eq("tenant_id", c.tenantId).eq("user_id", c.user.id).maybeSingle();
  if (!tok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const now = new Date().toISOString();
  // Disconnecting an app revokes every token it holds for this person + site.
  if (tok.kind === "refresh" && tok.client_id) {
    await c.admin.from("mcp_tokens").update({ revoked_at: now })
      .eq("client_id", tok.client_id).eq("tenant_id", c.tenantId).eq("user_id", c.user.id).is("revoked_at", null);
  } else {
    await c.admin.from("mcp_tokens").update({ revoked_at: now }).eq("id", tok.id);
  }
  return NextResponse.json({ ok: true });
}

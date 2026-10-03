import { createHash, randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Tokens for the MCP server (see app/api/mcp/route.ts). Only SHA-256 hashes
 * are stored. Each token is bound to one user + one site + a scope; the
 * user's live access to that site is re-checked on every call, so removing
 * someone from a site (or lowering their role) takes effect immediately even
 * if their AI app still holds a token.
 */

export type McpScope = "read" | "write";
export type McpTokenKind = "access" | "refresh" | "pat";

export const ACCESS_TTL_S = 60 * 60;            // 1 hour
export const REFRESH_TTL_S = 60 * 60 * 24 * 30; // 30 days

export function sha256(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}

export function newSecret(prefix: string): string {
  return prefix + randomBytes(24).toString("base64url");
}

export async function issueToken(
  admin: SupabaseClient,
  opts: { kind: McpTokenKind; userId: string; tenantId: string; scope: McpScope; clientId?: string | null; name?: string | null; ttlSeconds?: number | null },
): Promise<{ token: string; id: string; expiresAt: string | null }> {
  const prefix = opts.kind === "pat" ? "pcm_" : opts.kind === "access" ? "pca_" : "pcr_";
  const token = newSecret(prefix);
  const expiresAt = opts.ttlSeconds ? new Date(Date.now() + opts.ttlSeconds * 1000).toISOString() : null;
  const { data, error } = await admin.from("mcp_tokens").insert({
    token_hash: sha256(token),
    kind: opts.kind,
    user_id: opts.userId,
    tenant_id: opts.tenantId,
    scope: opts.scope,
    client_id: opts.clientId ?? null,
    name: opts.name ?? null,
    prefix: token.slice(0, 10),
    expires_at: expiresAt,
  }).select("id").single();
  if (error) throw new Error(error.message);
  return { token, id: data.id as string, expiresAt };
}

/**
 * What a user may do on a site, right now: write (owner/admin/editor, super
 * admin, or the staff member assigned to the site), read (other members),
 * or nothing.
 */
export async function siteAccess(admin: SupabaseClient, userId: string, tenantId: string): Promise<McpScope | null> {
  const [{ data: sa }, { data: member }, { data: staff }] = await Promise.all([
    admin.from("super_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    admin.from("tenant_members").select("role").eq("user_id", userId).eq("tenant_id", tenantId).maybeSingle(),
    admin.from("pc_staff").select("id").eq("user_id", userId).eq("status", "active").maybeSingle(),
  ]);
  if (sa) return "write";
  if (member) return ["owner", "admin", "editor"].includes(member.role as string) ? "write" : "read";
  if (staff) {
    const { data: t } = await admin.from("tenants").select("id")
      .eq("id", tenantId)
      .or(`assigned_staff_id.eq.${staff.id},referred_by_staff_id.eq.${staff.id}`)
      .maybeSingle();
    if (t) return "write";
  }
  return null;
}

/** Sites a user can connect an agent to, with their max access on each. */
export async function connectableSites(admin: SupabaseClient, userId: string): Promise<{ id: string; name: string; slug: string; access: McpScope }[]> {
  const { data: sa } = await admin.from("super_admins").select("user_id").eq("user_id", userId).maybeSingle();
  const out = new Map<string, { id: string; name: string; slug: string; access: McpScope }>();
  const { data: members } = await admin.from("tenant_members").select("role, tenants(id, name, slug)").eq("user_id", userId);
  for (const m of members ?? []) {
    const t = (Array.isArray(m.tenants) ? m.tenants[0] : m.tenants) as { id: string; name: string; slug: string } | null;
    if (t) out.set(t.id, { ...t, access: ["owner", "admin", "editor"].includes(m.role as string) ? "write" : "read" });
  }
  const { data: staff } = await admin.from("pc_staff").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (staff) {
    const { data: ts } = await admin.from("tenants").select("id, name, slug").or(`assigned_staff_id.eq.${staff.id},referred_by_staff_id.eq.${staff.id}`);
    for (const t of ts ?? []) out.set(t.id, { ...(t as { id: string; name: string; slug: string }), access: "write" });
  }
  if (sa) {
    const { data: ts } = await admin.from("tenants").select("id, name, slug").order("name").limit(500);
    for (const t of ts ?? []) out.set(t.id, { ...(t as { id: string; name: string; slug: string }), access: "write" });
  }
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type McpCaller = { tokenId: string; userId: string; tenantId: string; scope: McpScope };

/**
 * Resolve a Bearer token (access token or personal access token) to a caller.
 * The effective scope is the lower of the token's scope and the user's live
 * access to the site.
 */
export async function verifyMcpBearer(req: Request): Promise<McpCaller | null> {
  const auth = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(pc[am]_[A-Za-z0-9_-]+)$/.exec(auth.trim());
  if (!m) return null;
  const admin = await createAdminClient();
  const { data: tok } = await admin.from("mcp_tokens")
    .select("id, kind, user_id, tenant_id, scope, expires_at, revoked_at")
    .eq("token_hash", sha256(m[1]))
    .maybeSingle();
  if (!tok || tok.revoked_at || tok.kind === "refresh") return null;
  if (tok.expires_at && new Date(tok.expires_at).getTime() < Date.now()) return null;

  const live = await siteAccess(admin, tok.user_id, tok.tenant_id);
  if (!live) return null;
  const scope: McpScope = tok.scope === "write" && live === "write" ? "write" : "read";

  admin.from("mcp_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", tok.id).then(() => {}, () => {});
  return { tokenId: tok.id, userId: tok.user_id, tenantId: tok.tenant_id, scope };
}

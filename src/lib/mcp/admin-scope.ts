/**
 * Open edition: no platform admins, so there are no cross-site admin calls
 * and no platform admin audit log. The hosted platform's version writes
 * admin_audit_log rows here.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export const SITE_ARG = "site";

/** A site tool's JSON schema with the `site` argument added (platform admins only). */
export function withSiteArg(schema: Record<string, unknown>, boundSite: string): Record<string, unknown> {
  const props = (schema.properties as Record<string, unknown> | undefined) ?? {};
  if (SITE_ARG in props) return schema;
  return {
    ...schema,
    type: "object",
    properties: {
      ...props,
      [SITE_ARG]: { type: "string", description: `The site to act on. Leave out to use the connected site (${boundSite}).` },
    },
  };
}

export type AdminAuditEntry = {
  actorUserId: string;
  action: string;
  tenantId?: string | null;
  targetUserId?: string | null;
  tokenId?: string | null;
  args?: unknown;
  via?: "mcp" | "app" | "web";
};

export async function startAdminAudit(_db: SupabaseClient, _e: AdminAuditEntry): Promise<string> {
  return "";
}

export async function finishAdminAudit(_db: SupabaseClient, _id: string, _ok: boolean, _error?: string | null): Promise<void> {}

import { createAdminClient } from "@/lib/supabase/server";
import { startAdminAudit } from "@/lib/mcp/admin-scope";

/**
 * Admin audit row for a super-admin write made from the mobile admin app
 * (2026-10-23, M4). The app is the only caller that sends a Bearer token to
 * the super-admin routes; the web panel uses the session cookie and keeps
 * its existing behaviour. Written BEFORE the change, like the MCP admin
 * tools: returns an error message when the row cannot be written, and the
 * route then refuses the change.
 */
export async function auditAppWrite(
  req: Request,
  userId: string,
  action: string,
  extra: { tenantId?: string | null; targetUserId?: string | null; args?: unknown } = {},
): Promise<string | null> {
  if (!req.headers.get("authorization")?.startsWith("Bearer ")) return null;
  try {
    await startAdminAudit(await createAdminClient(), { actorUserId: userId, action: `app.${action}`, via: "app", ...extra });
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "audit log unavailable";
  }
}

/**
 * Admin audit row for a Super Admin panel write that edits or removes
 * someone else's data (Experts admin, Phase 9). Same rule as above: written
 * BEFORE the change; an error message means the route must refuse.
 */
export async function auditPanelWrite(
  userId: string,
  action: string,
  extra: { tenantId?: string | null; targetUserId?: string | null; args?: unknown } = {},
): Promise<string | null> {
  try {
    await startAdminAudit(await createAdminClient(), { actorUserId: userId, action, via: "web", ...extra });
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "audit log unavailable";
  }
}

/**
 * Billing and money writes (subscriptions, payments, invoices, costs): logged
 * in the action list from every caller, the web panel included, so a Staff
 * Manager's billing work is on record the same as a super admin's. The app
 * keeps its app.* action names.
 */
export async function auditWrite(
  req: Request,
  userId: string,
  action: string,
  extra: { tenantId?: string | null; targetUserId?: string | null; args?: unknown } = {},
): Promise<string | null> {
  return req.headers.get("authorization")?.startsWith("Bearer ")
    ? auditAppWrite(req, userId, action, extra)
    : auditPanelWrite(userId, action, extra);
}

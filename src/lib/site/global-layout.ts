import type { SupabaseClient } from "@supabase/supabase-js";

type GlobalLayoutPatch = { global_header?: unknown; global_footer?: unknown; global_prefooter?: unknown };

function layoutPayload(layout: GlobalLayoutPatch): Record<string, unknown> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (layout.global_header !== undefined) payload.global_header = layout.global_header;
  if (layout.global_footer !== undefined) payload.global_footer = layout.global_footer;
  if (layout.global_prefooter !== undefined) payload.global_prefooter = layout.global_prefooter;
  return payload;
}

/**
 * Save the site-wide header / footer / pre-footer blocks
 * (site_identity.global_*). One code path for the header builder
 * (/api/identity, _type "global_layout") and the MCP tools.
 * Only the fields passed are changed. Returns false when the site has no
 * site_identity row (nothing was saved).
 */
export async function saveGlobalLayout(
  client: SupabaseClient,
  tenantId: string,
  layout: GlobalLayoutPatch,
): Promise<boolean> {
  const { data } = await client.from("site_identity").update(layoutPayload(layout)).eq("tenant_id", tenantId).select("tenant_id");
  return !!data?.length;
}

/**
 * Write site_identity columns, creating the row when the site has none
 * (2026-11-09: 19 live sites had no row, so header/footer/logo writes over
 * MCP saved nothing). Same upsert on tenant_id the Colors & Design screen and
 * /api/design use. A new row carries only the columns passed (plus the
 * table's defaults), the way the Site Identity screen inserts one: every
 * reader of an unset column keeps its current fallback (site name from
 * site_settings, then the tenant), so creating the row changes nothing on
 * the live site by itself. Returns the error message, or null on success.
 */
export async function upsertSiteIdentity(
  client: SupabaseClient,
  tenantId: string,
  patch: Record<string, unknown>,
): Promise<string | null> {
  const { error } = await client
    .from("site_identity")
    .upsert({ ...patch, tenant_id: tenantId, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
  return error ? error.message || "site_identity could not be saved" : null;
}

/**
 * saveGlobalLayout for callers that must never save nothing (MCP): creates
 * the site_identity row when it is missing. Returns the error message, or
 * null on success.
 */
export async function saveGlobalLayoutUpsert(
  client: SupabaseClient,
  tenantId: string,
  layout: GlobalLayoutPatch,
): Promise<string | null> {
  return upsertSiteIdentity(client, tenantId, layoutPayload(layout));
}

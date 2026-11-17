import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET } from "@/lib/media/upload";

/**
 * Media library operations (usage, delete, alt text) shared by the web
 * dashboard server actions (dashboard/media/actions.ts) and the mobile app
 * (/api/media). Uploads live in lib/media/upload.ts (storeMediaFile).
 * Callers resolve and authorise the tenant first.
 */

const BUCKET = MEDIA_BUCKET;

/** Where a file is still used (pages, products, branding) — shown before delete. */
export async function mediaUsageForTenant(id: string, tenantId: string | null): Promise<{ kind: string; title: string }[]> {
  const supabase = await createAdminClient();
  const { data: row } = await supabase.from("media").select("url").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  if (!row) return [];
  const { data } = await supabase.rpc("media_usage", { p_tenant: tenantId, p_url: row.url });
  return ((data ?? []) as { kind: string; title: string }[]).map((u) => ({ kind: u.kind, title: u.title }));
}

export async function deleteMediaForTenant(id: string, tenantId: string | null): Promise<{ error: string } | { success: true }> {
  const supabase = await createAdminClient();
  // The storage path comes from the site's own record, never the client.
  const { data: row } = await supabase.from("media").select("id, storage_path").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  if (!row) return { error: "Not found" };

  if (row.storage_path) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([row.storage_path]);
    if (storageError) return { error: storageError.message };
  }

  const { error: dbError } = await supabase.from("media").delete().eq("id", id).eq("tenant_id", tenantId);
  if (dbError) return { error: dbError.message };
  return { success: true };
}

export async function updateMediaAltForTenant(id: string, alt: string, tenantId: string | null): Promise<{ error: string } | { success: true }> {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("media").update({ alt }).eq("id", id).eq("tenant_id", tenantId);
  if (error) return { error: error.message };
  return { success: true };
}

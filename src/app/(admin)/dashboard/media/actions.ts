"use server";

import { storeMediaFile } from "@/lib/media/upload";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { revalidatePath } from "next/cache";
import { deleteMediaForTenant, mediaUsageForTenant, updateMediaAltForTenant } from "@/lib/media/library";

/** Upload one file to the current site's media library (guards and photo
 *  optimisation live in storeMediaFile, shared with POST /api/media/upload). */
export async function uploadMediaFile(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };
  const tenantId = await getCurrentTenantId();
  const supabase = await createAdminClient();
  const r = await storeMediaFile(supabase, tenantId, file);
  if ("error" in r) return { error: r.error };
  revalidatePath("/dashboard/media");
  return { url: r.url, size: r.size, originalSize: r.originalSize };
}

/** Where a file is still used (pages, products, branding) — shown before delete. */
export async function getMediaUsage(id: string): Promise<{ kind: string; title: string }[]> {
  return mediaUsageForTenant(id, await getCurrentTenantId());
}

export async function deleteMediaFile(id: string, _storagePath?: string) {
  void _storagePath; // ignored: the path comes from the site's own record, never the browser
  const result = await deleteMediaForTenant(id, await getCurrentTenantId());
  if ("error" in result) return { error: result.error };
  revalidatePath("/dashboard/media");
  return { success: true as const, error: undefined };
}

export async function updateMediaAlt(id: string, alt: string) {
  const result = await updateMediaAltForTenant(id, alt, await getCurrentTenantId());
  if ("error" in result) return { error: result.error };
  revalidatePath("/dashboard/media");
  return { success: true as const, error: undefined };
}

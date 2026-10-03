"use server";

import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { revalidatePath } from "next/cache";

const BUCKET = "media";
const MAX_BYTES = 25 * 1024 * 1024;
// No SVG: it can carry script and is served from a public URL.
const ALLOWED = /^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|webm|quicktime)|application\/pdf)$/;
const OPTIMIZE = /^image\/(jpeg|png|webp)$/;
const MAX_EDGE = 2400;

/**
 * Upload with the standard guards: allowed types only, 25 MB cap, and photos
 * optimised on the way in (long edge capped at 2400px, re-encoded as WebP
 * when that's smaller). Phone photos of 4-8 MB typically land at 200-500 KB,
 * which is most of a page's load time on mobile data.
 */
export async function uploadMediaFile(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };
  if (!ALLOWED.test(file.type)) return { error: "This file type isn't supported. Use JPG, PNG, WebP, GIF, AVIF, MP4, WebM or PDF." };
  if (file.size > MAX_BYTES) return { error: "File is larger than 25 MB." };

  const tenantId = await getCurrentTenantId();
  const supabase = await createAdminClient();

  let body: Blob | Buffer = file;
  let contentType = file.type;
  let size = file.size;
  let width: number | null = null;
  let height: number | null = null;
  let safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  if (OPTIMIZE.test(file.type)) {
    try {
      const input = Buffer.from(await file.arrayBuffer());
      const img = sharp(input, { failOn: "none" }).rotate();
      const meta = await img.metadata();
      const resized = (meta.width ?? 0) > MAX_EDGE || (meta.height ?? 0) > MAX_EDGE
        ? img.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
        : img;
      const webp = await resized.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
      if (webp.data.length < input.length) {
        body = webp.data;
        contentType = "image/webp";
        size = webp.data.length;
        safeName = safeName.replace(/\.(jpe?g|png|webp)$/i, "") + ".webp";
        width = webp.info.width; height = webp.info.height;
      } else {
        width = meta.width ?? null; height = meta.height ?? null;
      }
    } catch {
      // Unreadable image: store the original rather than fail the upload.
    }
  }

  const path = `uploads/${Date.now()}_${safeName}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, body, { contentType, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  const { error: dbError } = await supabase.from("media").insert({
    name: safeName,
    original_name: file.name,
    url,
    mime_type: contentType,
    size,
    width,
    height,
    storage_path: path,
    tenant_id: tenantId,
  });
  if (dbError) return { error: dbError.message };

  revalidatePath("/dashboard/media");
  return { url, size, originalSize: file.size };
}

/** Where a file is still used (pages, products, branding) — shown before delete. */
export async function getMediaUsage(id: string): Promise<{ kind: string; title: string }[]> {
  const supabase = await createAdminClient();
  const tenantId = await getCurrentTenantId();
  const { data: row } = await supabase.from("media").select("url").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  if (!row) return [];
  const { data } = await supabase.rpc("media_usage", { p_tenant: tenantId, p_url: row.url });
  return ((data ?? []) as { kind: string; title: string }[]).map((u) => ({ kind: u.kind, title: u.title }));
}

export async function deleteMediaFile(id: string, _storagePath?: string) {
  void _storagePath; // ignored: the path comes from the site's own record, never the browser
  const supabase = await createAdminClient();
  const tenantId = await getCurrentTenantId();

  const { data: row } = await supabase.from("media").select("id, storage_path").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  if (!row) return { error: "Not found" };

  if (row.storage_path) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([row.storage_path]);
    if (storageError) return { error: storageError.message };
  }

  const { error: dbError } = await supabase.from("media").delete().eq("id", id).eq("tenant_id", tenantId);
  if (dbError) return { error: dbError.message };

  revalidatePath("/dashboard/media");
  return { success: true };
}

export async function updateMediaAlt(id: string, alt: string) {
  const supabase = await createAdminClient();
  const tenantId = await getCurrentTenantId();
  const { error } = await supabase.from("media").update({ alt }).eq("id", id).eq("tenant_id", tenantId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/media");
  return { success: true };
}

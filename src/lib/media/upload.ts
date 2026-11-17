import "server-only";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";

export const MEDIA_BUCKET = "media";
export const MEDIA_MAX_BYTES = 25 * 1024 * 1024;
// No SVG: it can carry script and is served from a public URL.
export const MEDIA_ALLOWED = /^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|webm|quicktime)|application\/pdf)$/;
const OPTIMIZE = /^image\/(jpeg|png|webp)$/;
const MAX_EDGE = 2400;

export type StoredMedia = { id?: string; url: string; size: number; originalSize: number; width: number | null; height: number | null; mime_type: string; name: string };

/**
 * Upload with the standard guards: allowed types only, 25 MB cap, and photos
 * optimised on the way in (long edge capped at 2400px, re-encoded as WebP
 * when that's smaller). Phone photos of 4-8 MB typically land at 200-500 KB,
 * which is most of a page's load time on mobile data.
 *
 * Shared by the dashboard media library (server action) and the mobile app
 * (POST /api/media/upload). `admin` is a service-role client; the caller has
 * already checked the user may write to `tenantId`.
 */
export async function storeMediaFile(admin: SupabaseClient, tenantId: string, file: File, opts: { folder?: string } = {}): Promise<StoredMedia | { error: string }> {
  if (!MEDIA_ALLOWED.test(file.type)) return { error: "This file type isn't supported. Use JPG, PNG, WebP, GIF, AVIF, MP4, WebM or PDF." };
  if (file.size > MEDIA_MAX_BYTES) return { error: "File is larger than 25 MB." };

  let body: Blob | Buffer = file;
  let contentType = file.type;
  let size = file.size;
  let width: number | null = null;
  let height: number | null = null;
  let safeName = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");

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
  const { error: uploadError } = await admin.storage.from(MEDIA_BUCKET).upload(path, body, { contentType, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  const { data: row, error: dbError } = await admin.from("media").insert({
    name: safeName,
    original_name: file.name,
    url,
    mime_type: contentType,
    size,
    width,
    height,
    storage_path: path,
    tenant_id: tenantId,
    ...(opts.folder ? { folder: opts.folder } : {}),
  }).select("id").maybeSingle();
  if (dbError) return { error: dbError.message };

  return { id: (row?.id as string | undefined) ?? undefined, url, size, originalSize: file.size, width, height, mime_type: contentType, name: safeName };
}

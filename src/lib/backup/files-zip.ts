import JSZip from "jszip";
import type { ImageFile } from "./image-export";
import { safeFetch } from "@/lib/safe-fetch";

/*
 * media.url and product image URLs are written by site users, so a backup
 * must not fetch whatever they hold (an internal address, cloud metadata).
 * Files in this install's own storage (the full storage URL, or the /media/
 * path that next.config rewrites to it) are fetched directly; any other
 * address goes through safeFetch, which only reaches public hosts.
 */
const STORAGE_ORIGIN = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin; } catch { return null; }
})();
const STORAGE_PUBLIC = "/storage/v1/object/public/";
const EXTERNAL_MAX_BYTES = 50 * 1024 * 1024;

/** This install's storage URL for a media address, or null when it is not ours. */
export function ownStorageUrl(raw: string, storageOrigin: string | null = STORAGE_ORIGIN): string | null {
  if (!storageOrigin || typeof raw !== "string") return null;
  if (/^\/media\/[^\\]*$/.test(raw) && !raw.startsWith("//")) raw = `${storageOrigin}${STORAGE_PUBLIC}media/${raw.slice("/media/".length)}`;
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.origin !== storageOrigin || u.username || u.password) return null;
  // Normalised by the URL parser, so "../" can't climb out of public storage.
  return u.pathname.startsWith(STORAGE_PUBLIC) ? u.toString() : null;
}

async function download(raw: string): Promise<ArrayBuffer | Buffer | null> {
  const own = ownStorageUrl(raw);
  if (own) {
    // Storage never redirects; refusing them keeps this on our own host.
    const res = await fetch(own, { redirect: "error" });
    if (!res.ok) { console.error(`[backup files-zip] fetch failed ${res.status} for ${raw}`); return null; }
    return res.arrayBuffer();
  }
  const { res, buf } = await safeFetch(raw, { maxBytes: EXTERNAL_MAX_BYTES, timeoutMs: 30000 });
  if (!res.ok) { console.error(`[backup files-zip] fetch failed ${res.status} for ${raw}`); return null; }
  return buf;
}

/** Downloads every media file's URL and bundles them into a single zip
 *  buffer, preserving the same folder layout as the manifest. Files that
 *  fail to fetch are skipped (logged) rather than failing the whole backup —
 *  a partial media backup beats none. */
export async function buildFilesZip(images: ImageFile[]): Promise<{ buffer: Buffer; fileCount: number }> {
  const zip = new JSZip();
  let fileCount = 0;

  for (const img of images) {
    try {
      const data = await download(img.url);
      if (!data) continue;
      zip.file(img.path, data);
      fileCount++;
    } catch (err) {
      console.error(`[backup files-zip] error fetching ${img.url}`, err);
    }
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
  return { buffer, fileCount };
}

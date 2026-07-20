import JSZip from "jszip";
import type { ImageFile } from "./image-export";

/** Downloads every media file's URL and bundles them into a single zip
 *  buffer, preserving the same folder layout as the manifest. Files that
 *  fail to fetch are skipped (logged) rather than failing the whole backup —
 *  a partial media backup beats none. */
export async function buildFilesZip(images: ImageFile[]): Promise<{ buffer: Buffer; fileCount: number }> {
  const zip = new JSZip();
  let fileCount = 0;

  for (const img of images) {
    try {
      const res = await fetch(img.url);
      if (!res.ok) { console.error(`[backup files-zip] fetch failed ${res.status} for ${img.url}`); continue; }
      const arrayBuf = await res.arrayBuffer();
      zip.file(img.path, arrayBuf);
      fileCount++;
    } catch (err) {
      console.error(`[backup files-zip] error fetching ${img.url}`, err);
    }
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
  return { buffer, fileCount };
}

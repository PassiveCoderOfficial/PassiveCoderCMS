"use client";

/**
 * Shrink large photos in the browser before upload. Vercel rejects request
 * bodies over 4.5 MB, so an untouched 6-8 MB phone photo could never be
 * uploaded; the server optimises again afterwards (actions.ts). Only JPEG /
 * PNG / WebP over ~1.5 MB are touched; everything else passes through.
 */
const MAX_EDGE = 2400;
const THRESHOLD = 1.5 * 1024 * 1024;

export async function compressImageForUpload(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size <= THRESHOLD) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/webp", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.(jpe?g|png|webp)$/i, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

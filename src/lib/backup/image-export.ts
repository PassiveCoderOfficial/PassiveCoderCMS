import { SupabaseClient } from "@supabase/supabase-js";

interface MediaRow {
  id: string;
  url: string;
  file_name: string;
  storage_path?: string;
  folder?: string;
}

export interface ImageFile {
  path: string; // e.g. images/pages/about/banner.jpg
  url: string;
  name: string;
}

export async function collectImagePaths(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<ImageFile[]> {
  const files: ImageFile[] = [];

  // Pull all media
  const { data: media } = await supabase
    .from("media")
    .select("id,url,file_name,storage_path,folder")
    .eq("tenant_id", tenantId);

  for (const m of (media ?? []) as MediaRow[]) {
    if (!m.url) continue;
    const folder = m.folder ?? "uploads";
    const name = m.file_name ?? m.url.split("/").pop() ?? m.id;
    files.push({ path: `images/${folder}/${name}`, url: m.url, name });
  }

  // Product images
  const { data: products } = await supabase
    .from("products")
    .select("id,name,images")
    .eq("tenant_id", tenantId);

  for (const p of (products ?? []) as Array<{ id: string; name: string; images?: string[] }>) {
    if (!p.images?.length) continue;
    const folderName = p.name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40);
    p.images.forEach((url, i) => {
      const ext = url.split(".").pop()?.split("?")[0] ?? "jpg";
      files.push({
        path: `images/products/${folderName}/${i + 1}.${ext}`,
        url,
        name: `${i + 1}.${ext}`,
      });
    });
  }

  return files;
}

export function buildImageManifest(images: ImageFile[]): Buffer {
  const lines = images.map((f) => `${f.path}\t${f.url}`);
  return Buffer.from(["# path\turl", ...lines].join("\n"), "utf-8");
}

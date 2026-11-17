import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { storeMediaFile } from "@/lib/media/upload";
import { resolveUploadLink } from "@/lib/media/upload-links";
import { invalidateSiteCache } from "@/lib/supabase/public-cache";

export const maxDuration = 60;

/** One image per request (multipart field "file") into the link's site media library. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = await createAdminClient();
  const link = await resolveUploadLink(admin, token);
  if (!link) return NextResponse.json({ error: "This upload link has expired. Ask Claude for a new one." }, { status: 410 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Images only (JPG, PNG, WebP, GIF, AVIF)." }, { status: 400 });

  const r = await storeMediaFile(admin, link.tenant_id, file);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  await admin.from("media_upload_links").update({ uploads: link.uploads + 1 }).eq("token", token);
  invalidateSiteCache(link.tenant_id);
  return NextResponse.json({ url: r.url, name: r.name });
}

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Photo attached to a product review (5 MB, JPG/PNG/WEBP), stored in the store's review-photos folder. */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Store not found" }, { status: 400 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Upload a JPG, PNG or WEBP photo" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Photo is larger than 5 MB" }, { status: 400 });
  const admin = await createAdminClient();
  const path = `review-photos/${tenantId}/${randomUUID()}.${ext}`;
  const { error } = await admin.storage.from("media").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  return NextResponse.json({ url: admin.storage.from("media").getPublicUrl(path).data.publicUrl });
}

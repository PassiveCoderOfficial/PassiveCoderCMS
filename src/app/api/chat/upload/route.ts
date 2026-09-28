import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { currentUserId } from "@/lib/marketplace-ecom/chat";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Photo upload for chat messages and reviews (multipart `file`). Signed-in
 *  users only; returns the public URL to attach. */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Unknown store" }, { status: 400 });
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  const kind = form?.get("kind") === "review" ? "reviews" : "chat";
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!TYPES[file.type]) return NextResponse.json({ error: "Use a JPG, PNG or WebP image" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Max 5 MB" }, { status: 400 });

  const admin = await createAdminClient();
  const path = `${kind}/${tenantId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${TYPES[file.type]}`;
  const { error } = await admin.storage
    .from("media")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = admin.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}

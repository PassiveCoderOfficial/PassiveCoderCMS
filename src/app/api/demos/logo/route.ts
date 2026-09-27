import { NextResponse } from "next/server";
import { demoCaller } from "@/modules/demo/auth";

const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };
const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(req: Request) {
  const c = await demoCaller();
  if (!c) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!TYPES[file.type]) return NextResponse.json({ error: "Use PNG, JPG, WebP or SVG" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Max 3 MB" }, { status: 400 });

  const path = `demos/${c.user.id}/${Date.now()}.${TYPES[file.type]}`;
  const { error } = await c.admin.storage.from("media")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = c.admin.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

const MAX = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

/**
 * Bank-transfer receipt upload from checkout (shopper is usually signed out).
 * Stored under a random name in the store's payment-proofs folder; the order
 * only accepts URLs from that folder (see /api/ecommerce/orders).
 */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Store not found" }, { status: 400 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Upload a JPG, PNG, WEBP or PDF" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "File is larger than 5 MB" }, { status: 400 });
  const admin = await createAdminClient();
  const path = `payment-proofs/${tenantId}/${randomUUID()}.${ext}`;
  const { error } = await admin.storage.from("media").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  const { data } = admin.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}

import { NextRequest, NextResponse } from "next/server";
import { tooMany } from "@/lib/rate-limit";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { publicFormTenantId } from "@/lib/site/root-builder";

const BUCKET = "form-uploads";
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = new Set([
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg", "image/png", "image/webp", "text/plain",
]);

/**
 * POST /api/contact/upload (multipart, field "file") — a contact form file
 * field (CV, photo, document). Public, so: tenant from the site host header,
 * 10 MB cap, a short list of document/image types, private bucket. Returns a
 * link that only members of this site can open (/api/contact/file).
 */
export async function POST(req: NextRequest) {
  // Public upload: a visitor attaches a file or two to one form.
  const limited = tooMany(req, "contact-upload", 20);
  if (limited) return limited;
  const tenantId = await publicFormTenantId(req.headers);
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is larger than 10 MB." }, { status: 400 });
  if (!TYPES.has(file.type)) return NextResponse.json({ error: "Upload a PDF, Word document or image." }, { status: 400 });

  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80) || "file";
  const path = `${tenantId}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}-${safe}`;
  const admin = await createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  return NextResponse.json({ name: file.name, url: `https://${host}/api/contact/file?p=${encodeURIComponent(path)}` });
}

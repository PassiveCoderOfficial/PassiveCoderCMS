import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getDonorSession } from "@/lib/donors/auth";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};

/** Upload a donor profile photo (multipart: file, donor_id). */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const me = await getDonorSession(tenantId);
  if (!me) return NextResponse.json({ error: "login_required" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  const donorId = (form?.get("donor_id") as string | null) || me.id;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!TYPES[file.type]) return NextResponse.json({ error: "Use a JPG, PNG or WebP image" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Max 3 MB" }, { status: 400 });

  const supabase = await createAdminClient();
  const { data: donor } = await supabase.from("donors")
    .select("id, created_by, is_claimed")
    .eq("tenant_id", tenantId).eq("id", donorId).maybeSingle();
  if (!donor) return NextResponse.json({ error: "Donor not found" }, { status: 404 });

  const allowed = me.is_admin
    || donor.id === me.id
    || (!donor.is_claimed && donor.created_by === me.id);
  if (!allowed) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const path = `donors/${tenantId}/${donorId}-${Date.now()}.${TYPES[file.type]}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage.from("media")
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
  await supabase.from("donors")
    .update({ photo_url: pub.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", donorId).eq("tenant_id", tenantId);

  return NextResponse.json({ ok: true, photo_url: pub.publicUrl });
}

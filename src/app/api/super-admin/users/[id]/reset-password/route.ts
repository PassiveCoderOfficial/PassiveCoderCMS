import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";
import { randomBytes } from "crypto";

function generateTempPassword() {
  // 16 random bytes → base64url, trimmed to a readable 20-char temp password.
  return randomBytes(16).toString("base64url").slice(0, 20);
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: targetId } = await params;
  const admin = await createAdminClient();

  const tempPassword = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(targetId, { password: tempPassword });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, tempPassword });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: targetId } = await params;
  const admin = await createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ email_verified_at: new Date().toISOString() })
    .eq("id", targetId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

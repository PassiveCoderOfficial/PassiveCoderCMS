import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/super-admin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: targetId } = await params;
  const { active } = await req.json() as { active: boolean };

  if (targetId === caller.id && !active) {
    return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const update: Record<string, unknown> = { is_active: active };
  // Manual reactivation also clears the grace-period lock condition so the
  // middleware check doesn't immediately re-lock the user on their next request.
  // Deactivation does NOT clear it — deactivation is an independent override,
  // not an "unverify" action.
  if (active) update.email_verified_at = new Date().toISOString();

  const { error } = await admin.from("profiles").update(update).eq("id", targetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

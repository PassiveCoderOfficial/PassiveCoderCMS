import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { callerCanManageTenant } from "@/lib/auth/verify-bearer";

export async function POST(req: Request) {
  const { tenantId } = await req.json();
  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });

  // Cookie session (web) first, Bearer token (mobile) fallback — same
  // dual-auth shape as domain/connect and api/ecommerce/pos, added so the
  // Passive Coder Admin app's own onboarding flow can call this route.
  if (!(await callerCanManageTenant(req, tenantId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminClient = await createAdminClient();

  const { error } = await adminClient
    .from("tenants")
    .update({ onboarding_completed: true })
    .eq("id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

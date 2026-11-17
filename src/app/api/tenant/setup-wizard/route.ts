import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";

export async function POST() {
  const tenantId = await getCurrentTenantId();
  const admin = await createAdminClient();

  const { error } = await admin
    .from("tenants")
    .update({ setup_wizard_completed_at: new Date().toISOString() })
    .eq("id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

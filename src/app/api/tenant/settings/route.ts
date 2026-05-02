import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";

export async function GET() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createAdminClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  if (!settings) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const tenantId = await getCurrentTenantId();
  const supabase = await createAdminClient();
  const body = await req.json();

  // Strip fields that shouldn't be updated directly
  const { id, tenant_id, created_at, ...updates } = body;

  const { error } = await supabase
    .from("site_settings")
    .update(updates)
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

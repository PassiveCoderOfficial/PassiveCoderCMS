import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
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

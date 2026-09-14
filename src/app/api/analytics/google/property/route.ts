import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/** Save which GA4 property (of the connected account's list) to pull report
 *  data from — set once after connecting, changeable any time. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { property_id } = await req.json();
  if (!property_id?.trim()) return NextResponse.json({ error: "Missing property_id" }, { status: 400 });

  const admin = await createAdminClient();
  const { error } = await admin
    .from("site_settings")
    .update({ ga_property_id: property_id })
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

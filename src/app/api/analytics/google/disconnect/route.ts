import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/** Forgets the stored Google grant. Does not call Google's revoke endpoint —
 *  the tenant remains free to also remove Passive Coder from
 *  myaccount.google.com/permissions themselves; we only stop being able to
 *  read their data going forward. */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { error } = await admin
    .from("site_settings")
    .update({
      ga_oauth_refresh_token: null,
      ga_oauth_access_token: null,
      ga_oauth_expires_at: null,
      ga_oauth_connected_email: null,
      ga_property_id: null,
    })
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

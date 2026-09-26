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
  // Secrets live in tenant_integrations (see migration 101); the picked
  // property id lives in site_settings. Clear both.
  const { error } = await admin
    .from("tenant_integrations")
    .delete()
    .eq("tenant_id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { error: settingsError } = await admin
    .from("site_settings")
    .update({ ga_property_id: null })
    .eq("tenant_id", tenantId);
  if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

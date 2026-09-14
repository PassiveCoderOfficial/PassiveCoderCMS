import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/**
 * Manual Measurement ID save — moved here from Settings -> Appearance
 * (2026-09-14, per Wali) so it lives next to the rest of the Google
 * Analytics connection instead of a separate settings page. Picking a GA4
 * property via OAuth (property/route.ts) already auto-fills this field; this
 * route exists for the fallback case — a property with no web data stream,
 * or a tenant who'd rather paste an ID directly without connecting OAuth at
 * all (still fully supported, independent of the OAuth flow).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { measurement_id } = await req.json();
  const trimmed = typeof measurement_id === "string" ? measurement_id.trim() : "";
  // Empty is a valid save — it's how a tenant clears a manually-pasted id.
  if (trimmed && !/^G-[A-Z0-9]+$/i.test(trimmed)) {
    return NextResponse.json({ error: "That doesn't look like a GA4 Measurement ID (should look like G-XXXXXXXXXX)" }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { error } = await admin
    .from("site_settings")
    .update({ ga_measurement_id: trimmed || null })
    .eq("tenant_id", tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

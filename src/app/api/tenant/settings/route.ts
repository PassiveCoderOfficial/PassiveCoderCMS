import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { canWriteSite } from "@/lib/auth/site-write";

// Columns the settings form is allowed to write. Anything else (id, tenant_id,
// created_at, stray keys like `error` from a prior failed fetch) is ignored.
const ALLOWED = [
  "site_name", "site_description", "site_url", "logo_url", "favicon_url",
  "timezone", "language", "maintenance_mode", "meta_title", "meta_description",
  "analytics_code", "custom_css", "custom_js", "site_theme", "ga_measurement_id", "gtm_container_id",
  "currency", "currency_symbol", "currency_position",
  "maintenance_title", "maintenance_message", "auto_translate_enabled", "google_site_verification", "bing_site_verification", "allow_ai_training",
] as const;

// Web cookie session or mobile Bearer + X-Tenant-Id (membership verified).
async function callerTenant(req: Request) {
  return (await getApiCaller(req))?.tenantId ?? null;
}

export async function GET(req: Request) {
  const tenantId = await callerTenant(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createAdminClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  // Auto-create a default row if none exists, so the form always has real data
  // (avoids a 404 body leaking an `error` key into the form state).
  if (!settings) {
    const { data: created } = await supabase
      .from("site_settings")
      .insert({ tenant_id: tenantId })
      .select("*")
      .single();
    return NextResponse.json(created ?? {});
  }

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const tenantId = await callerTenant(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canWriteSite(tenantId))) return NextResponse.json({ error: "Your role can't change this site's settings." }, { status: 403 });
  const supabase = await createAdminClient();
  const body = await req.json();

  // Whitelist allowed columns only.
  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key];
  }
  updates.updated_at = new Date().toISOString();

  // Upsert so a missing row is created rather than silently updating nothing.
  const { error } = await supabase
    .from("site_settings")
    .upsert({ tenant_id: tenantId, ...updates }, { onConflict: "tenant_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

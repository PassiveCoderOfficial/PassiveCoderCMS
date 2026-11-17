import { NextResponse } from "next/server";
import { isBelowSiteAdmin } from "@/lib/auth/site-write";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";

const ALLOWED = [
  "db_enabled", "db_frequency", "db_retention_count",
  "files_enabled", "files_frequency", "files_retention_count",
] as const;

export async function GET() {
  const tenantId = await getCurrentTenantId();
  const admin = await createAdminClient();

  const { data } = await admin.from("backup_settings").select("*").eq("tenant_id", tenantId).maybeSingle();
  if (data) return NextResponse.json(data);

  const { data: created } = await admin
    .from("backup_settings")
    .insert({ tenant_id: tenantId })
    .select("*")
    .single();
  return NextResponse.json(created ?? {});
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getCurrentTenantId();
  // Only the owner or an admin changes backup settings (staff and super admins too); editors and view-only members cannot.
  if (await isBelowSiteAdmin(tenantId)) return NextResponse.json({ error: "Only the site owner or an admin can change backup settings." }, { status: 403 });
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key];
  }
  updates.updated_at = new Date().toISOString();

  const admin = await createAdminClient();
  const { error } = await admin
    .from("backup_settings")
    .upsert({ tenant_id: tenantId, ...updates }, { onConflict: "tenant_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

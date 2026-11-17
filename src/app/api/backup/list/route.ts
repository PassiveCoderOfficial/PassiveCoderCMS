import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiUser } from "@/lib/auth/api-caller";
import { getStaff, staffSites } from "@/lib/staff";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
    // Web cookie session or mobile Bearer token (apps/mobile-admin).
    const user = await apiUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();

  const { data: member } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: sa } = await admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();

  let allowed = !!member || !!sa;

  if (!allowed) {
    const agent = await getStaff();
    if (agent) {
      const { data: tenant } = await staffSites(admin.from("tenants").select("id").eq("id", tenantId), agent).maybeSingle();
      allowed = !!tenant;
    }
  }

  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data } = await admin
    .from("backup_runs")
    .select("id,status,storage_path,created_at,completed_at,error,backup_type,size_bytes")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(30);
  const { data: tenant } = await admin.from("tenants").select("name").eq("id", tenantId).maybeSingle();

  // siteName: what the restore confirm asks the user to type.
  return NextResponse.json({ runs: data ?? [], siteName: tenant?.name ?? "" });
}

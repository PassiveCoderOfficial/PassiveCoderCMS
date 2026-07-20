import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAgent } from "@/lib/agent";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    const agent = await getAgent();
    if (agent) {
      const { data: tenant } = await admin
        .from("tenants")
        .select("id")
        .eq("id", tenantId)
        .or(`assigned_agent_id.eq.${agent.id},referred_by_agent_id.eq.${agent.id}`)
        .maybeSingle();
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

  return NextResponse.json({ runs: data ?? [] });
}

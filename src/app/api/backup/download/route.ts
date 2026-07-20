import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAgent } from "@/lib/agent";

const BUCKET = "backups";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();

  // Path format: tenantId/YYYY-MM-DD/file.ext
  const tenantId = path.split("/")[0];

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

  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const filename = path.split("/").pop() ?? "backup";
  return new NextResponse(data, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": data.type || "application/octet-stream",
    },
  });
}

import { NextResponse } from "next/server";
import { runBackup, type BackupType } from "@/lib/backup/runner";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAgent } from "@/lib/agent";

export async function POST(req: Request) {
  const { tenantId, type } = await req.json();
  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
  const backupType: BackupType = ["db", "files", "full"].includes(type) ? type : "full";

  // Allow internal cron calls via secret header
  const cronSecret = req.headers.get("x-cron-secret");
  const isCron = cronSecret && cronSecret === process.env.INTERNAL_CRON_SECRET;

  if (!isCron) {
    // .auth.getUser() must run on the cookie-bound client — the service-role
    // admin client has no session context and always returns null here,
    // which is why this previously 401'd for every real logged-in user.
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

    // Agent viewing an assigned/referred site under their own session — not
    // a tenant_member, so check assignment directly instead.
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
  }

  try {
    const result = await runBackup(tenantId, backupType);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Backup failed" },
      { status: 500 },
    );
  }
}

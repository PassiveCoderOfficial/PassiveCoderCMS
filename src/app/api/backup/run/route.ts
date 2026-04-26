import { NextResponse } from "next/server";
import { runBackup } from "@/lib/backup/runner";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { tenantId } = await req.json();
  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });

  // Allow internal cron calls via secret header
  const cronSecret = req.headers.get("x-cron-secret");
  const isCron = cronSecret && cronSecret === process.env.INTERNAL_CRON_SECRET;

  if (!isCron) {
    // Verify caller is owner/admin of this tenant
    const supabase = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .single();

    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await runBackup(tenantId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Backup failed" },
      { status: 500 },
    );
  }
}

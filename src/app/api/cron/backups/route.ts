import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runBackup } from "@/lib/backup/runner";

export const maxDuration = 300;

/**
 * Daily automatic backups for every site — the "Daily backups" promised on
 * the pricing page. Before this existed no backup had ever run: the
 * runner was only reachable from the dashboard's manual "Back up now".
 *
 * Every site gets a database backup daily and a full backup (database +
 * media files) on Sundays; runBackup() prunes old runs to each site's
 * retention setting. Sites already backed up in the last 20h are skipped,
 * so a re-run the same day only finishes what's left. Stops before the
 * function time limit and carries the rest to the next run.
 */
async function handle(req: Request) {
  const bearer = req.headers.get("authorization");
  const viaCron = !!process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`;
  const viaManual = !!process.env.INTERNAL_CRON_SECRET && req.headers.get("x-cron-secret") === process.env.INTERNAL_CRON_SECRET;
  if (!viaCron && !viaManual) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const started = Date.now();
  const admin = await createAdminClient();
  const { data: tenants } = await admin.from("tenants").select("id").is("demo_expires_at", null).order("created_at");
  const since = new Date(Date.now() - 20 * 3600_000).toISOString();
  const { data: recent } = await admin.from("backup_runs").select("tenant_id").eq("status", "complete").gte("created_at", since);
  const done = new Set((recent ?? []).map((r) => r.tenant_id as string));
  const type = new Date().getUTCDay() === 0 ? "full" : "db";

  const summary = { total: tenants?.length ?? 0, backedUp: 0, skipped: 0, failed: 0, deferred: 0 };
  for (const t of tenants ?? []) {
    if (done.has(t.id)) { summary.skipped++; continue; }
    if (Date.now() - started > 250_000) { summary.deferred++; continue; }
    try {
      await runBackup(t.id, type);
      summary.backedUp++;
    } catch (e) {
      summary.failed++;
      console.error("[backups] tenant", t.id, e instanceof Error ? e.message : e);
    }
  }
  console.log("[backups]", JSON.stringify(summary));
  return NextResponse.json(summary);
}

export const GET = handle;
export const POST = handle;

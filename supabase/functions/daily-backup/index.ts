// Supabase Edge Function — runs daily at 2:00 AM UTC
// Schedule: "0 2 * * *" (set in supabase/config.toml or via dashboard)
// Deno runtime — calls the Next.js backup API for each active tenant,
// once per enabled backup type (db/files), respecting each type's own
// frequency and enabled flag from backup_settings.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL")!; // e.g. https://cmsstudio.io
const INTERNAL_CRON_SECRET = Deno.env.get("INTERNAL_CRON_SECRET")!;

type Frequency = "daily" | "weekly" | "monthly";

// Runs today if: daily (always), weekly (Sundays), monthly (1st of month).
function isDueToday(frequency: Frequency, now: Date): boolean {
  if (frequency === "daily") return true;
  if (frequency === "weekly") return now.getUTCDay() === 0;
  if (frequency === "monthly") return now.getUTCDate() === 1;
  return false;
}

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${INTERNAL_CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id,slug")
    .in("status", ["active", "trial"]);

  if (error) {
    console.error("Failed to fetch tenants:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  try {
    await fetch(`${APP_URL}/api/cron/expire-trials`, {
      method: "POST",
      headers: { "x-cron-secret": INTERNAL_CRON_SECRET },
    });
  } catch (err) {
    console.error("[daily-backup] expire-trials call failed:", err);
  }

  const { data: settingsRows } = await supabase
    .from("backup_settings")
    .select("tenant_id, db_enabled, db_frequency, files_enabled, files_frequency");
  const settingsByTenant = new Map((settingsRows ?? []).map((s) => [s.tenant_id, s]));

  const results: Array<{ tenantId: string; type: string; ok: boolean; error?: string }> = [];

  async function runOne(tenantId: string, type: "db" | "files") {
    try {
      const res = await fetch(`${APP_URL}/api/backup/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cron-secret": INTERNAL_CRON_SECRET },
        body: JSON.stringify({ tenantId, type }),
      });
      if (!res.ok) {
        results.push({ tenantId, type, ok: false, error: await res.text() });
      } else {
        results.push({ tenantId, type, ok: true });
      }
    } catch (err) {
      results.push({ tenantId, type, ok: false, error: String(err) });
    }
  }

  for (const tenant of tenants ?? []) {
    // Defaults match backup_settings' column defaults for tenants that
    // haven't visited the Backups settings page yet: db daily, files weekly.
    const s = settingsByTenant.get(tenant.id);
    const dbEnabled = s?.db_enabled ?? true;
    const dbFrequency: Frequency = (s?.db_frequency as Frequency) ?? "daily";
    const filesEnabled = s?.files_enabled ?? true;
    const filesFrequency: Frequency = (s?.files_frequency as Frequency) ?? "weekly";

    if (dbEnabled && isDueToday(dbFrequency, now)) await runOne(tenant.id, "db");
    if (filesEnabled && isDueToday(filesFrequency, now)) await runOne(tenant.id, "files");
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`Backup cron: ${results.length} runs, ${failed.length} failed`);
  if (failed.length) console.error("Failed backups:", failed);

  return new Response(
    JSON.stringify({ total: results.length, failed: failed.length, results }),
    { headers: { "Content-Type": "application/json" } },
  );
});

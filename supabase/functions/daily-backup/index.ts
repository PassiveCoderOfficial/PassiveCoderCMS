// Supabase Edge Function — runs daily at 2:00 AM UTC
// Schedule: "0 2 * * *" (set in supabase/config.toml or via dashboard)
// Deno runtime — calls the Next.js backup API for each active tenant

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL")!; // e.g. https://cmsstudio.io
const INTERNAL_CRON_SECRET = Deno.env.get("INTERNAL_CRON_SECRET")!;

Deno.serve(async (req) => {
  // Verify the request is from Supabase cron (or internal call)
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${INTERNAL_CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch all active tenants
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id,slug")
    .in("status", ["active", "trial"]);

  if (error) {
    console.error("Failed to fetch tenants:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Expire trials first
  try {
    await fetch(`${APP_URL}/api/cron/expire-trials`, {
      method: "POST",
      headers: { "x-cron-secret": INTERNAL_CRON_SECRET },
    });
  } catch (err) {
    console.error("[daily-backup] expire-trials call failed:", err);
  }

  const results: Array<{ tenantId: string; ok: boolean; error?: string }> = [];

  for (const tenant of tenants ?? []) {
    try {
      const res = await fetch(`${APP_URL}/api/backup/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": INTERNAL_CRON_SECRET,
        },
        body: JSON.stringify({ tenantId: tenant.id }),
      });

      if (!res.ok) {
        const body = await res.text();
        results.push({ tenantId: tenant.id, ok: false, error: body });
      } else {
        results.push({ tenantId: tenant.id, ok: true });
      }
    } catch (err) {
      results.push({ tenantId: tenant.id, ok: false, error: String(err) });
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`Backup cron: ${results.length} tenants, ${failed.length} failed`);
  if (failed.length) console.error("Failed backups:", failed);

  return new Response(
    JSON.stringify({ total: results.length, failed: failed.length, results }),
    { headers: { "Content-Type": "application/json" } },
  );
});

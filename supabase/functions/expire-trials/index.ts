// Supabase Edge Function — runs daily via cron
// Suspends tenants whose trial has expired and marks subscription as expired

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  // Allow internal cron calls or service role
  const secret = req.headers.get("x-cron-secret");
  if (secret !== Deno.env.get("INTERNAL_CRON_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date().toISOString();

  // Find expired trials on tenants table
  const { data: expiredTenants, error: fetchErr } = await supabase
    .from("tenants")
    .select("id,slug,name,trial_ends_at")
    .eq("status", "trial")
    .lt("trial_ends_at", now);

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500 });
  }

  const ids = (expiredTenants ?? []).map((t: { id: string }) => t.id);

  if (ids.length === 0) {
    return new Response(JSON.stringify({ suspended: 0 }), { status: 200 });
  }

  // Suspend tenants
  await supabase
    .from("tenants")
    .update({ status: "suspended" })
    .in("id", ids);

  // Mark subscriptions as expired
  await supabase
    .from("subscriptions")
    .update({ status: "expired" })
    .in("tenant_id", ids)
    .eq("status", "trial");

  console.log(`[expire-trials] Suspended ${ids.length} tenants:`, ids);

  return new Response(JSON.stringify({ suspended: ids.length, tenants: ids }), { status: 200 });
});

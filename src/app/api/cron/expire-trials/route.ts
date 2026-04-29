import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();

  // Self-apply schema migration (idempotent)
  try { await supabase.rpc("apply_migration_009"); } catch { /* no-op */ }

  const now = new Date().toISOString();

  const { data: expired, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("status", "trial")
    .lt("trial_ends_at", now);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (expired ?? []).map((t) => t.id);
  if (ids.length === 0) return NextResponse.json({ suspended: 0 });

  await supabase.from("tenants").update({ status: "suspended" }).in("id", ids);
  await supabase
    .from("subscriptions")
    .update({ status: "expired" })
    .in("tenant_id", ids)
    .eq("status", "trial");

  // Invalidate tenant cache entries — cache lives per-process so this only
  // helps the current instance, but expiry is already handled by status check
  console.log(`[expire-trials] Suspended ${ids.length} tenants`);

  return NextResponse.json({ suspended: ids.length });
}

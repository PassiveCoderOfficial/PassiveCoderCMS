import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyNextVendorWave } from "@/lib/marketplace/notifyVendors";

const ESCALATE_AFTER_MS = 10 * 60 * 1000;

/**
 * Urgent service requests still open 10+ minutes after their last notify
 * wave get the next 5 nearest (not-yet-notified) vendors pinged. Runs every
 * 10 minutes via Vercel Cron (see vercel.json). A request with no more
 * unnotified vendors within radius simply gets an empty wave (no-op) and
 * stays open until claimed or cancelled by hand — see [[project_marketplace_module]].
 * Vercel Cron → GET with Authorization: Bearer CRON_SECRET;
 * manual → POST with x-cron-secret: INTERNAL_CRON_SECRET.
 */
async function handle(authorized: boolean) {
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();
  const cutoff = new Date(Date.now() - ESCALATE_AFTER_MS).toISOString();

  const { data: due, error } = await supabase
    .from("service_requests")
    .select("id, tenant_id, subcategory_id, lat, lng, radius_km, address, notified_vendor_ids")
    .eq("status", "open")
    .eq("urgency", "urgent")
    .or(`last_notified_at.is.null,last_notified_at.lt.${cutoff}`)
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let waves = 0;
  let totalNotified = 0;
  for (const r of due ?? []) {
    const { notifiedIds } = await notifyNextVendorWave(r);
    if (notifiedIds.length) { waves++; totalNotified += notifiedIds.length; }
  }

  return NextResponse.json({ checked: due?.length ?? 0, waves, totalNotified });
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const ok = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  return handle(ok);
}

export async function POST(req: Request) {
  const ok = req.headers.get("x-cron-secret") === process.env.INTERNAL_CRON_SECRET;
  return handle(ok);
}

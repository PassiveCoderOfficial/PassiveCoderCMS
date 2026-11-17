import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ensureBookingChrome } from "@/lib/booking/nav";

export const maxDuration = 120;

/**
 * Daily: make sure every site's header has the builder's Booking button
 * switched on (unless the owner turned it off). Also catches sites created
 * by seed scripts, which skip the app's signup path. Footers are left alone
 * here: the footer booking section is only switched on for new sites.
 */
async function handle(req: Request) {
  const bearer = req.headers.get("authorization");
  const viaCron = !!process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`;
  const viaManual = !!process.env.INTERNAL_CRON_SECRET && req.headers.get("x-cron-secret") === process.env.INTERNAL_CRON_SECRET;
  if (!viaCron && !viaManual) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data: tenants } = await admin.from("tenants").select("id");
  let sites = 0, updates = 0;
  for (const t of tenants ?? []) {
    try {
      const n = await ensureBookingChrome(admin, t.id as string);
      if (n) { sites++; updates += n; }
    } catch (e) {
      console.error("[booking-chrome]", t.id, e instanceof Error ? e.message : e);
    }
  }
  console.log("[booking-chrome]", JSON.stringify({ sites, updates }));
  return NextResponse.json({ sites, updates });
}

export const GET = handle;
export const POST = handle;

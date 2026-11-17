import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** Daily: drop site visitor page rows and sessions older than 30 days. */
async function handle(req: Request) {
  const bearer = req.headers.get("authorization");
  const viaCron = !!process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`;
  const viaManual = !!process.env.INTERNAL_CRON_SECRET && req.headers.get("x-cron-secret") === process.env.INTERNAL_CRON_SECRET;
  if (!viaCron && !viaManual) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await createAdminClient();
  const cutoff = new Date(Date.now() - 30 * 864e5).toISOString();
  const [p, v] = await Promise.all([
    admin.from("site_visitor_pages").delete({ count: "exact" }).lt("entered_at", cutoff),
    admin.from("site_visitors").delete({ count: "exact" }).lt("last_seen", cutoff),
  ]);
  return NextResponse.json({ ok: true, pages: p.count ?? 0, visitors: v.count ?? 0 });
}
export const GET = handle;
export const POST = handle;

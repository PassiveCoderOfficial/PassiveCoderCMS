import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { processRuns } from "@/lib/crm/sequences";

/**
 * Execute due CRM follow-up sequence steps. vercel.json runs it daily (Hobby
 * plan rejects the whole deploy for sub-daily crons); new leads also sweep
 * due runs, and an external pinger can POST here more often.
 * Vercel Cron → GET with Authorization: Bearer CRON_SECRET;
 * manual → POST with x-cron-secret: INTERNAL_CRON_SECRET.
 */
async function handle(authorized: boolean) {
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await processRuns(await createAdminClient());
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  return handle(!!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`);
}

export async function POST(req: Request) {
  return handle(!!process.env.INTERNAL_CRON_SECRET && req.headers.get("x-cron-secret") === process.env.INTERNAL_CRON_SECRET);
}

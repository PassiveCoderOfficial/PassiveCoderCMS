import { NextResponse } from "next/server";
import { runDueDeletions } from "@/lib/account/deletion";

/** Daily: delete accounts whose 14-day deletion grace period is over. */
async function handle(req: Request) {
  const bearer = req.headers.get("authorization");
  const viaCron = !!process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`;
  const viaManual = !!process.env.INTERNAL_CRON_SECRET && req.headers.get("x-cron-secret") === process.env.INTERNAL_CRON_SECRET;
  if (!viaCron && !viaManual) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await runDueDeletions();
  console.log("[account-deletions]", res);
  return NextResponse.json(res);
}

export const GET = handle;
export const POST = handle;

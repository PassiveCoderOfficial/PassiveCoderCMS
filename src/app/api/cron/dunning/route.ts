import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runDunning } from "@/lib/billing/dunning";

export const maxDuration = 300;

/**
 * Daily dunning pass: chase overdue subscriptions, and suspend only at the end
 * of the sequence.
 *
 * Daily rather than every 15 minutes — the schedule is measured in days, so a
 * finer tick would do nothing but re-scan. The pass is idempotent, so a
 * duplicate run in the same day sends nothing twice.
 */
async function handle(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await createAdminClient();
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";

  try {
    const summary = await runDunning(admin, rootDomain);
    console.log("[dunning]", JSON.stringify(summary));
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dunning run failed";
    console.error("[dunning]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = handle;

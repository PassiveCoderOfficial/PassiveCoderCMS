import { NextResponse } from "next/server";
import { publishDueAllSites } from "@/lib/posts/scheduled";

// Backstop sweep for scheduled posts/pages. Public renders already publish a
// site's due posts on the next visit (src/lib/posts/scheduled.ts), so a daily
// tick is enough to catch sites nobody visited.
async function handle(req: Request) {
  // Vercel Cron -> GET with Authorization: Bearer CRON_SECRET; manual -> POST
  // with x-cron-secret. (It used to accept POST only, so it never ran.)
  const bearer = req.headers.get("authorization");
  const viaCron = !!process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`;
  const viaManual = !!process.env.INTERNAL_CRON_SECRET && req.headers.get("x-cron-secret") === process.env.INTERNAL_CRON_SECRET;
  if (!viaCron && !viaManual) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await publishDueAllSites();
    const published = rows.reduce((s, r) => s + r.published, 0);
    if (published) console.log(`[publish-scheduled] Published ${published} across ${rows.length} sites`);
    return NextResponse.json({ published, sites: rows.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;

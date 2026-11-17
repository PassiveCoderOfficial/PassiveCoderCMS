import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET, MEDIA_DAYS, type Media } from "@/lib/support/reports";

/**
 * Daily: delete support screen recordings and voice notes older than
 * MEDIA_DAYS (7). Files leave the bucket; the ticket keeps a "deleted" entry
 * so the thread still shows a recording was there. Screenshots are kept.
 */
async function handle(req: Request) {
  const bearer = req.headers.get("authorization");
  const viaCron = !!process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`;
  const viaManual = !!process.env.INTERNAL_CRON_SECRET && req.headers.get("x-cron-secret") === process.env.INTERNAL_CRON_SECRET;
  if (!viaCron && !viaManual) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const cutoff = Date.now() - MEDIA_DAYS * 864e5;
  const now = new Date().toISOString();
  const old = (m: Media) => !m.deleted_at && new Date(m.created_at).getTime() < cutoff;
  const paths: string[] = [];

  for (const table of ["support_tickets", "support_ticket_messages"] as const) {
    const { data } = await admin.from(table).select("id, media").neq("media", "[]");
    for (const row of data ?? []) {
      const list = (row.media ?? []) as Media[];
      if (!list.some(old)) continue;
      paths.push(...list.filter(old).map((m) => m.path));
      await admin.from(table).update({ media: list.map((m) => (old(m) ? { ...m, deleted_at: now } : m)) }).eq("id", row.id);
    }
  }
  for (let i = 0; i < paths.length; i += 100) await admin.storage.from(MEDIA_BUCKET).remove(paths.slice(i, i + 100));
  console.log("[support-media-cleanup]", paths.length);
  return NextResponse.json({ deleted: paths.length });
}

export const GET = handle;
export const POST = handle;

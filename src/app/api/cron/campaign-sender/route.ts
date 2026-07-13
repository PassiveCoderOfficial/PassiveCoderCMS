import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { renderTemplate } from "@/lib/marketing/render";

const BATCH = 40; // per tick, stays well inside function time limits

/**
 * Drain pending campaign recipients in batches. Runs every 5 minutes.
 * Vercel Cron → GET Bearer CRON_SECRET; manual → POST x-cron-secret.
 */
async function handle(authorized: boolean) {
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();

  const { data: sending } = await supabase.from("campaigns")
    .select("id, tenant_id, subject, body, channel")
    .eq("status", "sending")
    .limit(10);

  let processed = 0;
  for (const campaign of sending ?? []) {
    if (campaign.channel !== "email") continue;

    const { data: batch } = await supabase.from("campaign_recipients")
      .select("id, contact_id")
      .eq("campaign_id", campaign.id)
      .eq("status", "pending")
      .limit(BATCH - processed);

    for (const r of batch ?? []) {
      const { data: contact } = await supabase.from("contacts")
        .select("first_name, last_name, email, consent_email")
        .eq("id", r.contact_id).maybeSingle();

      if (!contact?.email || !contact.consent_email) {
        await supabase.from("campaign_recipients")
          .update({ status: "skipped", error: "No email or consent withdrawn" })
          .eq("id", r.id);
        continue;
      }

      const result = await sendEmail({
        to: contact.email,
        subject: campaign.subject ?? "",
        text: renderTemplate(campaign.body, contact),
      });

      await supabase.from("campaign_recipients")
        .update(result.ok
          ? { status: "sent", sent_at: new Date().toISOString() }
          : { status: "failed", error: result.error ?? "send failed" })
        .eq("id", r.id);
      processed++;
    }

    // Update counters; close the campaign when nothing is pending
    const { count: pending } = await supabase.from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id).eq("status", "pending");
    const { count: sent } = await supabase.from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id).eq("status", "sent");
    const { count: failed } = await supabase.from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id).eq("status", "failed");

    await supabase.from("campaigns")
      .update({
        sent_count: sent ?? 0,
        failed_count: failed ?? 0,
        ...(pending === 0
          ? { status: "sent", sent_at: new Date().toISOString() }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    if (processed >= BATCH) break;
  }

  return NextResponse.json({ campaigns: sending?.length ?? 0, processed });
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

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

/**
 * Email customers a reminder for confirmed appointments happening tomorrow.
 * Vercel Cron → GET with Authorization: Bearer CRON_SECRET;
 * manual → POST with x-cron-secret: INTERNAL_CRON_SECRET.
 */
async function handle(authorized: boolean) {
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().slice(0, 10);

  const { data: appts, error } = await supabase
    .from("booking_appointments")
    .select("id, tenant_id, date, start_time, customer_name, customer_email")
    .eq("date", date)
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const a of appts ?? []) {
    const { data: settings } = await supabase
      .from("booking_settings")
      .select("service_name")
      .eq("tenant_id", a.tenant_id)
      .maybeSingle();

    const result = await sendEmail({
      to: a.customer_email,
      subject: `Reminder: your ${settings?.service_name ?? "appointment"} tomorrow at ${a.start_time.slice(0, 5)}`,
      text: [
        `Hi ${a.customer_name},`,
        "",
        `This is a reminder for your ${settings?.service_name ?? "appointment"} on ${a.date} at ${a.start_time.slice(0, 5)}.`,
        "",
        "See you then!",
      ].join("\n"),
    });

    if (result.ok) sent++;
    await supabase.from("booking_appointments")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", a.id);
  }

  return NextResponse.json({ date, due: appts?.length ?? 0, sent });
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

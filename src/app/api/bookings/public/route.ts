import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { upsertContact } from "@/lib/crm/upsertContact";

interface Slot { start: string; end: string }

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toTime(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

async function computeSlots(tenantId: string, date: string): Promise<{ slots: Slot[]; error?: string }> {
  const supabase = await createAdminClient();

  const [{ data: settings }, { data: availability }, { data: blocked }, { data: appts }] = await Promise.all([
    supabase.from("booking_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
    supabase.from("booking_availability").select("*").eq("tenant_id", tenantId),
    supabase.from("booking_blocked_dates").select("blocked_date").eq("tenant_id", tenantId).eq("blocked_date", date),
    supabase.from("booking_appointments").select("start_time, end_time, status")
      .eq("tenant_id", tenantId).eq("date", date).neq("status", "cancelled"),
  ]);

  if (!settings?.enabled) return { slots: [], error: "Booking is not enabled" };
  if (blocked?.length) return { slots: [] };

  const day = new Date(date + "T00:00:00").getDay();
  const avail = (availability ?? []).find((a) => a.day_of_week === day);
  if (!avail?.is_open) return { slots: [] };

  const duration = settings.slot_duration_mins ?? 60;
  const buffer = settings.buffer_mins ?? 0;
  const step = duration + buffer;
  const open = toMinutes(avail.open_time);
  const close = toMinutes(avail.close_time);

  // Respect advance window + minimum notice
  const now = new Date();
  const dateObj = new Date(date + "T00:00:00");
  const maxDate = new Date(now); maxDate.setDate(maxDate.getDate() + (settings.advance_days ?? 30));
  if (dateObj > maxDate) return { slots: [] };
  const minNoticeMs = (settings.min_notice_hours ?? 0) * 3600_000;

  const taken = (appts ?? []).map((a) => [toMinutes(a.start_time.slice(0, 5)), toMinutes(a.end_time.slice(0, 5))]);

  const slots: Slot[] = [];
  for (let start = open; start + duration <= close; start += step) {
    const end = start + duration;
    const overlaps = taken.some(([s, e]) => start < e && end > s);
    if (overlaps) continue;
    const slotTime = new Date(`${date}T${toTime(start)}:00`);
    if (slotTime.getTime() - now.getTime() < minNoticeMs) continue;
    slots.push({ start: toTime(start), end: toTime(end) });
  }
  return { slots };
}

/** GET ?date=YYYY-MM-DD — list open slots for a tenant site (x-tenant-id header). */
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const date = new URL(req.url).searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const { slots, error } = await computeSlots(tenantId, date);
  return NextResponse.json({ slots, ...(error ? { error } : {}) });
}

/** POST — create an appointment from the public widget. */
export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Tenant not resolved" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const { date, start, name, email, phone, message } = body ?? {};
  if (!date || !start || !name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Server-side slot validation — never trust the widget
  const { slots, error } = await computeSlots(tenantId, date);
  const slot = slots.find((s) => s.start === start);
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (!slot) return NextResponse.json({ error: "That time is no longer available" }, { status: 409 });

  const supabase = await createAdminClient();
  const { data: settings } = await supabase.from("booking_settings")
    .select("confirmation_mode, service_name, success_message, notify_email")
    .eq("tenant_id", tenantId).maybeSingle();

  const status = settings?.confirmation_mode === "auto" ? "confirmed" : "pending";

  const { data: appt, error: insErr } = await supabase.from("booking_appointments")
    .insert({
      tenant_id: tenantId,
      date,
      start_time: slot.start,
      end_time: slot.end,
      customer_name: name.trim(),
      customer_email: email.trim().toLowerCase(),
      customer_phone: phone?.trim() || null,
      message: message?.trim() || null,
      status,
    })
    .select("id")
    .single();

  if (insErr) return NextResponse.json({ error: "Failed to book" }, { status: 500 });

  // CRM: booking auto-creates/updates a contact with a timeline event
  await upsertContact({
    tenantId,
    email,
    phone,
    name,
    source: "booking",
    event: {
      type: "booking",
      title: `Booked ${settings?.service_name ?? "appointment"} — ${date} ${slot.start}`,
      body: message || null,
      meta: { appointment_id: appt.id, date, start: slot.start, status },
    },
  }).catch(() => null);

  // Notify the business
  if (settings?.notify_email) {
    sendEmail({
      to: settings.notify_email,
      subject: `New booking: ${name} — ${date} ${slot.start}`,
      text: [
        `Service: ${settings.service_name ?? "Appointment"}`,
        `When: ${date} ${slot.start}–${slot.end}`,
        `Name: ${name}`, `Email: ${email}`,
        phone ? `Phone: ${phone}` : null,
        message ? `Message: ${message}` : null,
        `Status: ${status}`,
      ].filter(Boolean).join("\n"),
    }).catch(() => null);
  }

  // Confirmation to the customer
  sendEmail({
    to: email,
    subject: status === "confirmed"
      ? `Booking confirmed — ${date} at ${slot.start}`
      : `Booking request received — ${date} at ${slot.start}`,
    text: [
      `Hi ${name},`,
      "",
      status === "confirmed"
        ? `Your ${settings?.service_name ?? "appointment"} is confirmed for ${date} at ${slot.start}.`
        : `We received your request for ${settings?.service_name ?? "an appointment"} on ${date} at ${slot.start}. We'll confirm shortly.`,
    ].join("\n"),
  }).catch(() => null);

  return NextResponse.json({
    ok: true,
    status,
    message: settings?.success_message ?? "Your appointment request has been received!",
  });
}

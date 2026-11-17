import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { getSiteSender } from "@/lib/email/sender";
import { computeSlots, depositOf, fmtDeposit } from "@/lib/booking/slots";
import { getStorePaymentMethods } from "@/lib/ecommerce/payment-methods";
import { tooMany } from "@/lib/rate-limit";
import { notifyTenantEvent } from "@/lib/push/notify";

/**
 * A customer's own booking, by the private token in their confirmation
 * (audit 2026-10-18). No login.
 * GET  ?token=&date=  -> the booking, the site's deposit terms and payment
 *                        methods, and open slots on `date` (for a reschedule)
 * POST { token, action: "cancel" | "reschedule" (date, start) | "payment" (reference) }
 */
const SAFE = "id, tenant_id, date, start_time, end_time, customer_name, customer_email, status, deposit_status, payment_reference, created_at, visit_label";

async function load(token: string | null) {
  if (!token || !/^[a-f0-9]{32}$/.test(token)) return null;
  const admin = await createAdminClient();
  const { data: appt } = await admin.from("booking_appointments").select(SAFE).eq("manage_token", token).maybeSingle();
  if (!appt) return null;
  const { data: settings } = await admin.from("booking_settings")
    .select("service_name, min_notice_hours, deposit_required, deposit_amount, deposit_currency, deposit_note, notify_email")
    .eq("tenant_id", appt.tenant_id).maybeSingle();
  return { admin, appt, settings };
}

/** Changes are allowed until the notice period before the start. */
function changeable(appt: { date: string; start_time: string; status: string }, minNoticeHours: number) {
  if (appt.status === "cancelled" || appt.status === "completed" || appt.status === "no_show") return false;
  const start = new Date(`${appt.date}T${String(appt.start_time).slice(0, 5)}:00`);
  return start.getTime() - Date.now() > Math.max(minNoticeHours, 1) * 3600_000;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const c = await load(url.searchParams.get("token"));
  if (!c) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const date = url.searchParams.get("date");
  const deposit = depositOf(c.settings);
  const [slots, methods] = await Promise.all([
    date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? computeSlots(c.appt.tenant_id, date, c.appt.id) : Promise.resolve({ slots: [] }),
    deposit.required ? getStorePaymentMethods(c.appt.tenant_id, deposit.currency ?? "BDT") : Promise.resolve([]),
  ]);
  const { tenant_id: _t, id: _i, ...safe } = c.appt;
  void _t; void _i;
  return NextResponse.json({
    booking: { ...safe, start_time: String(safe.start_time).slice(0, 5), end_time: String(safe.end_time).slice(0, 5) },
    // Website chat requests keep the site's own word on the customer's page.
    serviceName: c.appt.visit_label ? `${String(c.appt.visit_label).charAt(0).toUpperCase()}${String(c.appt.visit_label).slice(1)}` : c.settings?.service_name ?? "Appointment",
    canChange: changeable(c.appt, c.settings?.min_notice_hours ?? 0),
    deposit: deposit.required ? { ...deposit, label: fmtDeposit(deposit), methods } : null,
    slots: slots.slots,
  });
}

export async function POST(req: NextRequest) {
  const limited = tooMany(req, "booking-manage", 30);
  if (limited) return limited;
  const b = (await req.json().catch(() => ({}))) as { token?: string; action?: string; date?: string; start?: string; reference?: string };
  const c = await load(b.token ?? null);
  if (!c) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const { admin, appt, settings } = c;
  const label = (appt.visit_label as string | null) ?? null;
  const service = label ?? settings?.service_name ?? "appointment";
  const Word = label ? label.charAt(0).toUpperCase() + label.slice(1) : "Booking";
  const who = appt.customer_name as string;

  if (b.action === "payment") {
    const reference = String(b.reference ?? "").trim().slice(0, 120);
    if (!reference) return NextResponse.json({ error: "Enter the transaction ID or reference" }, { status: 400 });
    if (appt.deposit_status === "received") return NextResponse.json({ ok: true, deposit_status: "received" });
    await admin.from("booking_appointments").update({ payment_reference: reference, deposit_status: "reported", updated_at: new Date().toISOString() }).eq("id", appt.id);
    await notifyTenantEvent({ tenantId: appt.tenant_id, type: "booking", id: appt.id, dedupeKey: `booking-deposit:${appt.id}:${reference}`, webUrl: "/dashboard/bookings", title: `Deposit reported: ${who}`, body: `${service} on ${appt.date} at ${String(appt.start_time).slice(0, 5)}. Reference ${reference}. Check and mark it received.` });
    return NextResponse.json({ ok: true, deposit_status: "reported" });
  }

  if (!changeable(appt, settings?.min_notice_hours ?? 0)) {
    return NextResponse.json({ error: `This ${label ?? "booking"} can no longer be changed online. Please contact us.` }, { status: 409 });
  }

  if (b.action === "cancel") {
    await admin.from("booking_appointments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", appt.id);
    await notifyTenantEvent({ tenantId: appt.tenant_id, type: "booking_cancelled", id: appt.id, dedupeKey: `booking-cancel:${appt.id}`, webUrl: "/dashboard/bookings", title: `${Word} cancelled by ${who}`, body: `${service} on ${appt.date} at ${String(appt.start_time).slice(0, 5)}` });
    if (settings?.notify_email) sendEmail({ brandTenantId: appt.tenant_id, to: settings.notify_email, subject: `${Word} cancelled by ${who}: ${appt.date} ${String(appt.start_time).slice(0, 5)}`, text: `${who} cancelled their ${service} on ${appt.date} at ${String(appt.start_time).slice(0, 5)} from their ${label ?? "booking"} link.` }).catch(() => null);
    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  if (b.action === "reschedule") {
    const date = String(b.date ?? ""), start = String(b.start ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) return NextResponse.json({ error: "Pick a date and time" }, { status: 400 });
    const { slots, error } = await computeSlots(appt.tenant_id, date, appt.id);
    if (error) return NextResponse.json({ error }, { status: 400 });
    const slot = slots.find((s) => s.start === start);
    if (!slot) return NextResponse.json({ error: "That time is no longer available" }, { status: 409 });
    const was = `${appt.date} ${String(appt.start_time).slice(0, 5)}`;
    await admin.from("booking_appointments").update({ date, start_time: slot.start, end_time: slot.end, updated_at: new Date().toISOString() }).eq("id", appt.id);
    await notifyTenantEvent({ tenantId: appt.tenant_id, type: "booking", id: appt.id, dedupeKey: `booking-move:${appt.id}:${date}:${slot.start}`, webUrl: "/dashboard/bookings", title: `${Word} moved by ${who}`, body: `${service}: ${was} -> ${date} ${slot.start}` });
    if (settings?.notify_email) sendEmail({ brandTenantId: appt.tenant_id, to: settings.notify_email, subject: `${Word} moved by ${who}: now ${date} ${slot.start}`, text: `${who} moved their ${service} from ${was} to ${date} ${slot.start}-${slot.end} from their ${label ?? "booking"} link.` }).catch(() => null);
    if (appt.customer_email) sendEmail({ ...(await getSiteSender(appt.tenant_id)), to: appt.customer_email as string, subject: `Your ${label ?? "booking"} is now ${date} at ${slot.start}`, text: `Hi ${who},\n\nYour ${service} has been moved to ${date} at ${slot.start}.\n\nManage it any time: ${new URL(req.url).origin}/book/manage/${b.token}` }).catch(() => null);
    return NextResponse.json({ ok: true, date, start: slot.start, end: slot.end });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

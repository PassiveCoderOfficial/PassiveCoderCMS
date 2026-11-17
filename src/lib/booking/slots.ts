import { createAdminClient } from "@/lib/supabase/server";

/**
 * Open booking slots for a site on a date: opening hours minus blocked dates,
 * existing appointments, the notice period and the advance window. Shared by
 * the public widget (api/bookings/public) and the customer's manage page
 * (api/bookings/manage), so a reschedule obeys the same rules as a booking.
 */
export interface Slot { start: string; end: string }

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
export function toTime(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

/** `ignoreAppointmentId`: a reschedule may take its own current slot. */
export async function computeSlots(tenantId: string, date: string, ignoreAppointmentId?: string): Promise<{ slots: Slot[]; error?: string }> {
  const supabase = await createAdminClient();

  const [{ data: settings }, { data: availability }, { data: blocked }, { data: appts }] = await Promise.all([
    supabase.from("booking_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
    supabase.from("booking_availability").select("*").eq("tenant_id", tenantId),
    supabase.from("booking_blocked_dates").select("blocked_date").eq("tenant_id", tenantId).eq("blocked_date", date),
    supabase.from("booking_appointments").select("id, start_time, end_time, status")
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

  const now = new Date();
  const dateObj = new Date(date + "T00:00:00");
  const maxDate = new Date(now); maxDate.setDate(maxDate.getDate() + (settings.advance_days ?? 30));
  if (dateObj > maxDate) return { slots: [] };
  const minNoticeMs = (settings.min_notice_hours ?? 0) * 3600_000;

  const taken = (appts ?? []).filter((a) => a.id !== ignoreAppointmentId)
    .map((a) => [toMinutes(a.start_time.slice(0, 5)), toMinutes(a.end_time.slice(0, 5))]);

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

export type DepositInfo = { required: boolean; amount: number | null; currency: string | null; note: string | null };

export function depositOf(settings: { deposit_required?: boolean | null; deposit_amount?: number | string | null; deposit_currency?: string | null; deposit_note?: string | null } | null | undefined): DepositInfo {
  const amount = settings?.deposit_amount != null ? Number(settings.deposit_amount) : null;
  const required = !!settings?.deposit_required && !!amount && amount > 0;
  return { required, amount: required ? amount : null, currency: required ? settings?.deposit_currency ?? null : null, note: required ? settings?.deposit_note ?? null : null };
}

export const fmtDeposit = (d: DepositInfo) => d.amount == null ? "" : `${d.currency === "USD" ? "$" : d.currency === "BDT" || !d.currency ? "৳" : `${d.currency} `}${d.amount.toLocaleString("en-US")}`;

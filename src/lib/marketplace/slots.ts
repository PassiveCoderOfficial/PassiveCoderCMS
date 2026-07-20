import { createAdminClient } from "@/lib/supabase/server";

export interface Slot { start: string; end: string }

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toTime(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

/** Per-vendor slot engine — same algorithm as computeSlots() in
 *  src/app/api/bookings/public/route.ts (single-tenant booking module),
 *  parameterized by vendor_id instead of tenant_id since each vendor has
 *  their own hours/capacity (see vendor_availability, 050_marketplace.sql). */
export async function computeVendorSlots(vendorId: string, date: string): Promise<{ slots: Slot[]; error?: string }> {
  const supabase = await createAdminClient();

  const [{ data: settings }, { data: availability }, { data: blocked }, { data: bookings }] = await Promise.all([
    supabase.from("vendor_booking_settings").select("*").eq("vendor_id", vendorId).maybeSingle(),
    supabase.from("vendor_availability").select("*").eq("vendor_id", vendorId),
    supabase.from("vendor_blocked_dates").select("blocked_date").eq("vendor_id", vendorId).eq("blocked_date", date),
    supabase.from("marketplace_bookings").select("scheduled_time, scheduled_end_time, status")
      .eq("vendor_id", vendorId).eq("scheduled_date", date).neq("status", "cancelled"),
  ]);

  if (blocked?.length) return { slots: [] };

  const day = new Date(date + "T00:00:00").getDay();
  const avail = (availability ?? []).find((a) => a.day_of_week === day);
  if (!avail?.is_open) return { slots: [] };

  const duration = settings?.slot_duration_mins ?? 60;
  const buffer = settings?.buffer_mins ?? 15;
  const step = duration + buffer;
  const open = toMinutes(avail.open_time.slice(0, 5));
  const close = toMinutes(avail.close_time.slice(0, 5));

  const now = new Date();
  const dateObj = new Date(date + "T00:00:00");
  const maxDate = new Date(now); maxDate.setDate(maxDate.getDate() + (settings?.advance_days ?? 30));
  if (dateObj > maxDate) return { slots: [] };
  const minNoticeMs = (settings?.min_notice_hours ?? 2) * 3600_000;

  const taken = (bookings ?? [])
    .filter((b) => b.scheduled_time && b.scheduled_end_time)
    .map((b) => [toMinutes(b.scheduled_time!.slice(0, 5)), toMinutes(b.scheduled_end_time!.slice(0, 5))]);

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

-- 031_booking_reminders.sql
-- Phase 2: track customer reminder emails for upcoming appointments so the
-- booking-reminders cron sends each one exactly once.

begin;

alter table public.booking_appointments
  add column if not exists reminder_sent_at timestamptz;

create index if not exists booking_appointments_reminder_idx
  on public.booking_appointments(date, status)
  where reminder_sent_at is null;

commit;

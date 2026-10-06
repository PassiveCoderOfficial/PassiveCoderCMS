-- Every site comes with a working booking system (2026-10-06, Wali):
-- booking settings switched on and opening hours ready, so the built-in
-- /book page and any Appointment Booking block work from day one.
--
-- Weekly hours: Sat-Thu for Bangladesh and the Gulf (Friday closed),
-- Mon-Sat elsewhere (Sunday closed), 09:00-18:00. Requests are confirmed
-- manually and the owner is emailed. All editable in Dashboard > Bookings.
create or replace function public.ensure_booking_defaults(p_tenant uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  tz text;
  closed_day int;
  owner_email text;
begin
  select timezone into tz from site_settings where tenant_id = p_tenant limit 1;
  closed_day := case when tz in ('Asia/Dhaka','Asia/Dubai','Asia/Riyadh','Asia/Qatar','Asia/Kuwait','Asia/Bahrain','Asia/Muscat') then 5 else 0 end;
  select p.email into owner_email from tenants t join profiles p on p.id = t.owner_id where t.id = p_tenant;

  insert into booking_settings (tenant_id, enabled, service_name, slot_duration_mins, buffer_mins, advance_days, min_notice_hours, confirmation_mode, notify_email)
  values (p_tenant, true, 'Appointment', 60, 0, 30, 4, 'manual', owner_email)
  on conflict (tenant_id) do nothing;

  if not exists (select 1 from booking_availability where tenant_id = p_tenant) then
    insert into booking_availability (tenant_id, day_of_week, open_time, close_time, is_open)
    select p_tenant, d, '09:00', '18:00', d <> closed_day from generate_series(0, 6) d;
  end if;
end $$;
revoke all on function public.ensure_booking_defaults(uuid) from public, anon, authenticated;

create or replace function public.tenants_booking_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform ensure_booking_defaults(new.id);
  return new;
end $$;
drop trigger if exists tenants_booking_defaults on public.tenants;
create trigger tenants_booking_defaults after insert on public.tenants
  for each row execute function public.tenants_booking_defaults();

-- Backfill every existing site (existing settings are left as they are).
select ensure_booking_defaults(id) from tenants;
-- The one site that had settings but no hours was effectively off; switch it on too.
update booking_settings set enabled = true where enabled = false
  and tenant_id in (select tenant_id from booking_availability group by tenant_id);

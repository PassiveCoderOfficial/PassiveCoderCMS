-- 039_donor_availability_translate.sql
-- 1) Donor "temporarily unavailable" toggle (independent of last-donated
--    cooldown — a ready donor can still mark themselves unavailable, e.g.
--    traveling / sick). Shown as grey on map + list, overriding the
--    red/yellow/green readiness color.
-- 2) Per-tenant Google Translate widget toggle.

begin;

alter table public.donors add column if not exists is_available boolean not null default true;

alter table public.site_settings add column if not exists auto_translate_enabled boolean not null default false;

commit;

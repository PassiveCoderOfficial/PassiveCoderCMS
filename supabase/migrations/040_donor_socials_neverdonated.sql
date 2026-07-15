-- 040_donor_socials_neverdonated.sql
-- Donor round 7: social profile links (fixed set of platforms, editable by
-- admin/owner) stored as a small jsonb map, and a "never donated" flag so a
-- donor with no recorded date but who has genuinely never donated shows as
-- ready (green) rather than unknown (yellow).

begin;

alter table public.donors add column if not exists socials jsonb not null default '{}';
alter table public.donors add column if not exists never_donated boolean not null default false;

commit;

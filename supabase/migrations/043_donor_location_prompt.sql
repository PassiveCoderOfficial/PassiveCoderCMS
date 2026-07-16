-- 043_donor_location_prompt.sql
-- Track whether we've asked this donor for GPS consent, so the first-login
-- prompt appears exactly once. A donor with no coordinates can't be matched
-- to nearby urgent requests, so we ask up front rather than leaving them
-- silently unreachable — but we never nag after a decline.

begin;

alter table public.donors
  add column if not exists location_prompt_seen boolean not null default false;

commit;

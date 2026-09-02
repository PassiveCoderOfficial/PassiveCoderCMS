-- Free first AI build at signup.
--
-- A six-page generated site costs roughly 50 generations; Basic includes 20 a
-- month. Metering the onboarding build normally would put a new customer over
-- quota before they had edited anything, which is the worst possible first day.
-- So the signup build draws on a one-time grant instead, and everything after
-- it meters as usual.

alter table public.tenants
  add column if not exists ai_free_build_credits int not null default 0,
  add column if not exists ai_onboarding_build_at timestamptz;

comment on column public.tenants.ai_free_build_credits is
  'One-time generation grant for the signup build. Consumed before plan quota; never refilled.';
comment on column public.tenants.ai_onboarding_build_at is
  'When the automatic signup build ran. Null means it has not run.';

-- Atomic consume-one. Returns true when a credit was taken, so the caller can
-- fall through to normal quota when the grant is exhausted. Conditional UPDATE
-- rather than read-then-write, matching reserveGeneration: two concurrent
-- section builds must not both spend the same last credit.
create or replace function public.consume_free_build_credit(t uuid)
returns boolean language plpgsql security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  update public.tenants
     set ai_free_build_credits = ai_free_build_credits - 1
   where id = t
     and ai_free_build_credits > 0;
  get diagnostics ok = row_count;
  return ok;
end $$;

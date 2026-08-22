-- 074_agent_chat_metering.sql
-- Meters AI agent chat so it can't run up unbounded OpenRouter spend.
--
-- Chat is materially cheaper per call than a page generation (one or two
-- short completions vs a full block-copy generation), so charging a whole
-- generation per message would be punitive. Instead chat accrues *fractional*
-- cost against the same monthly pool: CHAT_COST_UNITS milli-generations per
-- message, rolled into whole generations once a full unit accumulates.
-- Keeping the accrual in its own integer column leaves ai_coder's existing
-- (concurrency-safe, integer) counter maths untouched.
--
-- Also adds a hard per-day call ceiling as a runaway backstop, independent of
-- the monthly plan quota: a scripted client or a retry bug shouldn't be able
-- to burn a Biz tenant's whole month in an afternoon.

begin;

alter table public.tenants
  add column if not exists ai_chat_milli_used int not null default 0,
  add column if not exists ai_chat_day_count int not null default 0,
  add column if not exists ai_chat_day_start date;

comment on column public.tenants.ai_chat_milli_used is
  'Fractional agent-chat usage in milli-generations (1000 = one generation). Rolls into ai_generations_used_this_month when it crosses 1000.';
comment on column public.tenants.ai_chat_day_count is
  'Agent calls made during the day starting at ai_chat_day_start. Reset lazily.';

commit;

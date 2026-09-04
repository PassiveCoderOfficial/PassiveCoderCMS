-- Make the signup site build resumable across invocations.
--
-- A test signup showed the original design cannot work: four pages at roughly
-- nine sections each is ~36 sequential model calls, and the platform stops a
-- function at 300s. Sections cannot be parallelised — the quota reservation is
-- a conditional UPDATE, so concurrent calls for one tenant collide — so the
-- work has to span invocations instead of fitting inside one.
--
-- The plan and the extracted facts are therefore persisted when planning
-- finishes, and a cron builds one page per tick from where the last one
-- stopped. A killed invocation now costs a few minutes, not the site.

alter table public.onboarding_build_jobs
  add column if not exists plan          jsonb,
  add column if not exists facts         jsonb,
  add column if not exists next_page_index int not null default 0,
  add column if not exists attempts      int not null default 0,
  add column if not exists locked_at     timestamptz;

comment on column public.onboarding_build_jobs.plan is
  'The site plan from planSite(), so a later invocation can resume without re-planning (which would also re-spend generations).';
comment on column public.onboarding_build_jobs.facts is
  'Extracted BusinessFacts, needed by every page build and expensive to redo.';
comment on column public.onboarding_build_jobs.next_page_index is
  'Index of the next page to build. The resume cursor.';
comment on column public.onboarding_build_jobs.locked_at is
  'Set while a worker holds this job. A lock older than the function timeout is treated as abandoned and may be retaken.';
comment on column public.onboarding_build_jobs.attempts is
  'Incremented per page attempt. Caps retries so a permanently failing job cannot loop forever.';

create index if not exists idx_onboarding_build_jobs_resumable
  on public.onboarding_build_jobs(status, locked_at)
  where status in ('planning', 'building');

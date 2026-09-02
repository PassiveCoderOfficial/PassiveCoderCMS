-- Progress record for the automatic signup site build.
--
-- The build takes minutes and spans several serverless invocations, so the
-- owner needs something to watch and the process needs somewhere to record
-- where it got to. Without this the new customer stares at a template full of
-- placeholder copy with no idea anything is happening.

create table if not exists public.onboarding_build_jobs (
  tenant_id     uuid primary key references public.tenants(id) on delete cascade,
  status        text not null default 'pending'
                check (status in ('pending','planning','building','done','failed')),
  total_pages   int not null default 0,
  pages_done    int not null default 0,
  current_page  text,
  error         text,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);

comment on table public.onboarding_build_jobs is
  'Progress of the automatic AI site build kicked off at signup. One row per tenant.';

alter table public.onboarding_build_jobs enable row level security;

drop policy if exists obj_read on public.onboarding_build_jobs;
create policy obj_read on public.onboarding_build_jobs
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));

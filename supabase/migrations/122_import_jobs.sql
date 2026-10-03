-- Import jobs (Dashboard > Import / Export): WordPress export files,
-- WordPress-by-URL, the Passive Coder Migration plugin, CSV/JSON.
-- Items are normalised into `items` and processed a few at a time by
-- /api/import/jobs/[id]/step so large sites never hit the function time limit.
create table if not exists public.import_jobs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  created_by  uuid,
  source      text not null,             -- wxr | wp_url | wp_plugin | csv_contacts | site_json
  source_label text,                     -- e.g. the WordPress site address
  status      text not null default 'ready' check (status in ('ready', 'running', 'done', 'failed')),
  items       jsonb not null default '[]'::jsonb,
  cursor      integer not null default 0,
  options     jsonb not null default '{}'::jsonb,
  results     jsonb not null default '{"created":0,"skipped":0,"failed":0,"media":0,"errors":[]}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists import_jobs_tenant on public.import_jobs (tenant_id, created_at desc);

alter table public.import_jobs enable row level security;
drop policy if exists import_jobs_member_read on public.import_jobs;
create policy import_jobs_member_read on public.import_jobs for select using (is_tenant_member(tenant_id));
revoke insert, update, delete on public.import_jobs from anon, authenticated;

-- Job list without the (possibly large) item payloads.
create or replace function public.import_job_list(p_tenant uuid)
returns table (id uuid, source text, source_label text, status text, cursor integer, total integer, results jsonb, created_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select j.id, j.source, j.source_label, j.status, j.cursor, jsonb_array_length(j.items), j.results, j.created_at, j.updated_at
  from import_jobs j where j.tenant_id = p_tenant order by j.created_at desc limit 20;
$$;
revoke all on function public.import_job_list(uuid) from public, anon, authenticated;
grant execute on function public.import_job_list(uuid) to service_role;

-- 106_projects.sql
-- Extends the Jobs & Staff module (034_staff_jobs.sql) with a lightweight
-- `projects` grouping so multi-task work (agency/dev-style engagements) can
-- live alongside simple one-off jobs without a parallel system: a job can
-- optionally belong to a project, and can optionally be a subtask of another
-- job within that project (kanban board = jobs grouped by their existing
-- `status` column, no new statuses needed).

begin;

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  contact_id  uuid references public.contacts(id) on delete set null,
  name        text not null,
  description text,
  status      text not null default 'planning'
              check (status in ('planning','active','on_hold','completed','cancelled')),
  priority    text not null default 'medium'
              check (priority in ('low','medium','high','urgent')),
  start_date  date,
  due_date    date,
  budget      numeric(12,2),
  currency    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists projects_tenant_idx on public.projects(tenant_id, status);
create index if not exists projects_contact_idx on public.projects(contact_id);

alter table public.jobs add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.jobs add column if not exists parent_job_id uuid references public.jobs(id) on delete cascade;
alter table public.jobs add column if not exists is_milestone boolean not null default false;
alter table public.jobs add column if not exists position int not null default 0;
alter table public.jobs add column if not exists priority text not null default 'medium'
  check (priority in ('low','medium','high','urgent'));

create index if not exists jobs_project_idx on public.jobs(project_id, status);
create index if not exists jobs_parent_idx on public.jobs(parent_job_id);

alter table public.projects enable row level security;

drop policy if exists "projects_read" on public.projects;
create policy "projects_read" on public.projects for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "projects_write" on public.projects;
create policy "projects_write" on public.projects for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

commit;

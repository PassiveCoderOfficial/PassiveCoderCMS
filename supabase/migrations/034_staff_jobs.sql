-- 034_staff_jobs.sql
-- Phase 5: staff & job management for service businesses (cleaning, handyman,
-- contracting…). Staff are lightweight rows — most field workers never get a
-- login — optionally linkable to an auth user later. Jobs connect a customer
-- (CRM contact) to an assignee, a schedule and a price; staff get notified
-- via wa.me deep links (no WhatsApp API needed).

begin;

create table if not exists public.staff (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  phone      text,
  email      text,
  role_title text,
  user_id    uuid references auth.users(id) on delete set null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists staff_tenant_idx on public.staff(tenant_id, active);

create table if not exists public.jobs (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  contact_id     uuid references public.contacts(id) on delete set null,
  staff_id       uuid references public.staff(id) on delete set null,
  title          text not null,
  description    text,
  address        text,
  customer_name  text,
  customer_phone text,
  status         text not null default 'unassigned'
                 check (status in ('unassigned','assigned','in_progress','completed','cancelled')),
  scheduled_date date,
  scheduled_time time,
  price          numeric(12,2),
  notes          text,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists jobs_tenant_idx on public.jobs(tenant_id, status, scheduled_date);
create index if not exists jobs_staff_idx on public.jobs(staff_id);

alter table public.staff enable row level security;
alter table public.jobs  enable row level security;

drop policy if exists "staff_read" on public.staff;
create policy "staff_read" on public.staff for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "staff_write" on public.staff;
create policy "staff_write" on public.staff for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists "jobs_read" on public.jobs;
create policy "jobs_read" on public.jobs for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "jobs_write" on public.jobs;
create policy "jobs_write" on public.jobs for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

commit;

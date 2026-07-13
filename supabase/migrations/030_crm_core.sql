-- 030_crm_core.sql
-- Phase 1: CRM core. `contacts` is the spine every module FKs into
-- (forms, bookings, orders, invoices, campaigns). `contact_events` is the
-- append-only activity timeline. Writes require editor-level membership
-- (is_tenant_editor); viewers read only. Anonymous paths (form submits,
-- storefront) never touch these tables directly — server routes use the
-- service role via upsertContact().

begin;

-- ── Pipeline stages (single default pipeline; multi-pipeline later) ─────────
create table if not exists public.crm_stages (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  color      text not null default '#6366f1',
  position   int  not null default 0,
  is_won     boolean not null default false,
  is_lost    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists crm_stages_tenant_idx on public.crm_stages(tenant_id, position);

-- ── Contacts ─────────────────────────────────────────────────────────────────
create table if not exists public.contacts (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  first_name       text,
  last_name        text,
  email            text,
  phone            text,                    -- normalized E.164 (+880…)
  whatsapp         text,                    -- E.164; defaults to phone
  company          text,
  source           text not null default 'manual'
                   check (source in ('manual','form','booking','order','enm','import','api')),
  stage_id         uuid references public.crm_stages(id) on delete set null,
  owner_user_id    uuid references auth.users(id) on delete set null,
  tags             text[] not null default '{}',
  custom           jsonb not null default '{}',
  notes            text,
  consent_email    boolean not null default false,
  consent_whatsapp boolean not null default false,
  last_activity_at timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index if not exists contacts_tenant_email_uq
  on public.contacts(tenant_id, lower(email)) where email is not null;
create unique index if not exists contacts_tenant_phone_uq
  on public.contacts(tenant_id, phone) where phone is not null;
create index if not exists contacts_tenant_activity_idx
  on public.contacts(tenant_id, last_activity_at desc);
create index if not exists contacts_tenant_stage_idx
  on public.contacts(tenant_id, stage_id);
create index if not exists contacts_tags_gin on public.contacts using gin(tags);

-- ── Timeline (append-only) ───────────────────────────────────────────────────
create table if not exists public.contact_events (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  contact_id    uuid not null references public.contacts(id) on delete cascade,
  type          text not null check (type in
                ('note','form_submission','booking','order','invoice',
                 'email','whatsapp','call','stage_change','task','system')),
  title         text not null,
  body          text,
  meta          jsonb not null default '{}',
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists contact_events_contact_idx
  on public.contact_events(contact_id, created_at desc);
create index if not exists contact_events_tenant_idx
  on public.contact_events(tenant_id, created_at desc);

-- ── Follow-up tasks ──────────────────────────────────────────────────────────
create table if not exists public.crm_tasks (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  contact_id       uuid references public.contacts(id) on delete cascade,
  title            text not null,
  due_at           timestamptz not null,
  status           text not null default 'open' check (status in ('open','done','cancelled')),
  assignee_user_id uuid references auth.users(id) on delete set null,
  remind_via       text not null default 'email' check (remind_via in ('none','email','whatsapp')),
  reminded_at      timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists crm_tasks_due_idx on public.crm_tasks(tenant_id, status, due_at);

-- ── Triggers ─────────────────────────────────────────────────────────────────
create or replace function public.touch_contact_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.contacts
     set last_activity_at = new.created_at, updated_at = now()
   where id = new.contact_id;
  return new;
end $$;
drop trigger if exists contact_events_touch on public.contact_events;
create trigger contact_events_touch after insert on public.contact_events
  for each row execute function public.touch_contact_activity();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.crm_stages     enable row level security;
alter table public.contacts       enable row level security;
alter table public.contact_events enable row level security;
alter table public.crm_tasks      enable row level security;

drop policy if exists "crm_stages_read" on public.crm_stages;
create policy "crm_stages_read" on public.crm_stages for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "crm_stages_write" on public.crm_stages;
create policy "crm_stages_write" on public.crm_stages for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists "contacts_read" on public.contacts;
create policy "contacts_read" on public.contacts for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "contacts_write" on public.contacts;
create policy "contacts_write" on public.contacts for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists "contact_events_read" on public.contact_events;
create policy "contact_events_read" on public.contact_events for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "contact_events_insert" on public.contact_events;
create policy "contact_events_insert" on public.contact_events for insert
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists "crm_tasks_read" on public.crm_tasks;
create policy "crm_tasks_read" on public.crm_tasks for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "crm_tasks_write" on public.crm_tasks;
create policy "crm_tasks_write" on public.crm_tasks for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

commit;

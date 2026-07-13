-- 033_campaigns.sql
-- Phase 4: messaging marketing. Channel-agnostic campaigns (email live now;
-- whatsapp reserved for the Meta Cloud API integration later so no schema
-- change is needed when it lands). Recipients snapshot the audience at send
-- time; the campaign-sender cron drains them in batches.

begin;

create table if not exists public.campaigns (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  name            text not null,
  channel         text not null default 'email' check (channel in ('email','whatsapp')),
  subject         text,
  body            text not null default '',
  -- audience: {"tags": [], "stage_ids": [], "all": true}
  audience        jsonb not null default '{"all": true}',
  status          text not null default 'draft'
                  check (status in ('draft','sending','sent','failed','cancelled')),
  recipient_count int not null default 0,
  sent_count      int not null default 0,
  failed_count    int not null default 0,
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists campaigns_tenant_idx on public.campaigns(tenant_id, created_at desc);
create index if not exists campaigns_sending_idx on public.campaigns(status) where status = 'sending';

create table if not exists public.campaign_recipients (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  status      text not null default 'pending'
              check (status in ('pending','sent','failed','skipped')),
  error       text,
  sent_at     timestamptz,
  unique (campaign_id, contact_id)
);
create index if not exists campaign_recipients_pending_idx
  on public.campaign_recipients(campaign_id, status) where status = 'pending';

alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;

drop policy if exists "campaigns_read" on public.campaigns;
create policy "campaigns_read" on public.campaigns for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "campaigns_write" on public.campaigns;
create policy "campaigns_write" on public.campaigns for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists "campaign_recipients_read" on public.campaign_recipients;
create policy "campaign_recipients_read" on public.campaign_recipients for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "campaign_recipients_write" on public.campaign_recipients;
create policy "campaign_recipients_write" on public.campaign_recipients for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

commit;

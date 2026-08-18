-- 071_enm_booking_sync.sql
-- Outbound ExpertNear.Me integration. `tenant_api_keys` stores hashes for
-- INBOUND auth and cannot be used here: pushing to ENM needs the raw key.
-- Kept in its own table so the secret is never exposed through the tenant
-- settings surfaces that clients can read.

begin;

create table if not exists public.tenant_enm_integration (
  tenant_id       uuid primary key references public.tenants(id) on delete cascade,
  enm_api_key     text not null,             -- raw ENM ExpertApiKey (write-only from UI)
  enm_expert_slug text,
  sync_bookings   boolean not null default true,
  last_sync_at    timestamptz,
  last_sync_error text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.tenant_enm_integration enable row level security;

-- Owners/admins/editors manage their own tenant's integration. The raw key is
-- readable by tenant editors only; service_role bypasses RLS for the sync path.
drop policy if exists tenant_enm_integration_rw on public.tenant_enm_integration;
create policy tenant_enm_integration_rw
  on public.tenant_enm_integration
  for all
  using (public.is_tenant_editor(tenant_id))
  with check (public.is_tenant_editor(tenant_id));

commit;

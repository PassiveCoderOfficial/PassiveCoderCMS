-- 028_authz_helpers_api_keys.sql
-- Phase 0 of the business-tools suite.
-- 1) is_tenant_editor(): write-capable membership check (owner/admin/editor).
--    is_tenant_member() ignores role, so `viewer` members could pass write
--    policies. All new module tables gate writes on this helper.
-- 2) tenant_api_keys: per-tenant API keys for the /api/v1/* public API
--    (ENM lead dispatch, custom apps, Pro "API access").

begin;

-- ── Editor-level membership (SECURITY DEFINER avoids RLS recursion) ─────────
create or replace function public.is_tenant_editor(t uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = t
      and user_id = auth.uid()
      and role in ('owner','admin','editor')
  );
$$;

-- ── Tenant API keys ──────────────────────────────────────────────────────────
create table if not exists public.tenant_api_keys (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  name         text not null,
  key_prefix   text not null,              -- first 8 chars of raw key, shown in UI
  key_hash     text not null unique,       -- sha256 hex of full raw key (shown once)
  scopes       text[] not null default '{contacts:read,contacts:write}',
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists tenant_api_keys_tenant_idx on public.tenant_api_keys(tenant_id);

alter table public.tenant_api_keys enable row level security;

drop policy if exists "api_keys_tenant_read" on public.tenant_api_keys;
create policy "api_keys_tenant_read" on public.tenant_api_keys
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));

drop policy if exists "api_keys_tenant_write" on public.tenant_api_keys;
create policy "api_keys_tenant_write" on public.tenant_api_keys
  for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

commit;

-- Per-store payment methods. payment_gateways is one platform-wide table, so a
-- store toggling a gateway or typing its bank details changed it for every
-- store. Each store now keeps its own on/off switch and settings here; the
-- global row only says the gateway exists and which currencies it handles.
create table if not exists public.tenant_payment_methods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  gateway_slug text not null,
  enabled boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (tenant_id, gateway_slug)
);
alter table public.tenant_payment_methods enable row level security;
drop policy if exists tenant_payment_methods_editor on public.tenant_payment_methods;
create policy tenant_payment_methods_editor on public.tenant_payment_methods
  for all using (public.is_tenant_editor(tenant_id)) with check (public.is_tenant_editor(tenant_id));

-- Bank transfer: shopper sees the store's bank details at checkout and can
-- attach a transaction id, note and a transfer screenshot to the order.
insert into public.payment_gateways (name, slug, description, is_enabled, is_test_mode, settings, supported_currencies)
select 'Bank Transfer', 'bank_transfer', 'Customer pays into your bank account and attaches the transfer details', true, false, '{}'::jsonb, '{}'
where not exists (select 1 from public.payment_gateways where slug = 'bank_transfer');

alter table public.orders add column if not exists payment_proof jsonb;

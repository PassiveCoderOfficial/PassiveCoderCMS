-- 032_invoices.sql
-- Phase 3: invoicing + payment links. Invoices belong to a tenant, optionally
-- link a CRM contact, and carry a public_token so customers can view/pay at
-- /invoice/<token> without auth (served via service role, token = capability).

begin;

create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  contact_id     uuid references public.contacts(id) on delete set null,
  invoice_number text not null,
  public_token   text not null unique default encode(gen_random_bytes(16), 'hex'),
  status         text not null default 'draft'
                 check (status in ('draft','sent','paid','overdue','cancelled')),
  currency       text not null default 'USD',
  -- Customer snapshot (kept even if the contact is later deleted)
  customer_name  text not null,
  customer_email text,
  customer_phone text,
  -- Line items: [{description, quantity, unit_price}]
  items          jsonb not null default '[]',
  subtotal       numeric(12,2) not null default 0,
  discount       numeric(12,2) not null default 0,
  tax            numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  notes          text,
  issue_date     date not null default current_date,
  due_date       date,
  sent_at        timestamptz,
  paid_at        timestamptz,
  payment_method text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tenant_id, invoice_number)
);

create index if not exists invoices_tenant_idx on public.invoices(tenant_id, created_at desc);
create index if not exists invoices_status_idx on public.invoices(tenant_id, status);
create index if not exists invoices_contact_idx on public.invoices(contact_id);

alter table public.invoices enable row level security;

drop policy if exists "invoices_read" on public.invoices;
create policy "invoices_read" on public.invoices for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists "invoices_write" on public.invoices;
create policy "invoices_write" on public.invoices for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

commit;

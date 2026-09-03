-- Leads captured on Passive Coder's own marketing pages.
--
-- Kept out of the per-tenant CRM on purpose: these are OUR prospects, not a
-- customer's. The marketing pages run on the root domain with no x-tenant-id,
-- so a contact-form submission there had nowhere to go and was silently lost.
--
-- The BD landing page's only calls to action were WhatsApp and signup, which
-- means everyone who read it and was not ready to do either left no trace.
-- That is the leak this closes.

create table if not exists public.marketing_leads (
  id           uuid primary key default gen_random_uuid(),
  name         text,
  -- WhatsApp is the channel this segment actually reads; email is optional.
  whatsapp     text not null,
  business_type text,
  country      text,
  source       text,           -- which page/campaign produced it
  note         text,
  status       text not null default 'new'
               check (status in ('new','contacted','qualified','won','lost')),
  contacted_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_marketing_leads_created on public.marketing_leads(created_at desc);
create index if not exists idx_marketing_leads_status on public.marketing_leads(status);

comment on table public.marketing_leads is
  'Prospects captured on Passive Coder''s own marketing pages. Not tenant CRM data.';

alter table public.marketing_leads enable row level security;

-- Anonymous visitors insert; only super admins read. Nothing here should be
-- readable by a tenant, and a public read policy would expose every prospect's
-- phone number.
drop policy if exists ml_insert on public.marketing_leads;
create policy ml_insert on public.marketing_leads
  for insert to anon, authenticated with check (true);

drop policy if exists ml_read on public.marketing_leads;
create policy ml_read on public.marketing_leads
  for select using (public.is_super_admin());

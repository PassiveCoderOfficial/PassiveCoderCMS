-- Business profile: captured once per tenant, consumed by three things —
-- AiCoder content generation, the site's own contact/service blocks, and the
-- ExpertNear.Me listing. Before this, the AI brief was retyped for every run
-- and ENM provisioning created an account with an email and nothing else.
--
-- Deliberately NOT stored here: tone, designDirection, forbiddenClaims,
-- neverMention. Those are per-run creative direction rather than facts about
-- the business, and already live in the AiCoder brief.

create table if not exists public.tenant_business_profiles (
  tenant_id          uuid primary key references public.tenants(id) on delete cascade,

  business_name      text,
  primary_service    text,
  services           jsonb not null default '[]'::jsonb,   -- string[]
  owner_name         text,

  -- Track-record figures. Optional by design: they become public claims via
  -- provenNumbers, and a guessed figure is worse than an absent one.
  years_operating    int,
  customers_served   int,
  projects_completed int,

  service_areas      jsonb not null default '[]'::jsonb,   -- string[]
  phone              text,
  whatsapp           text,
  email              text,
  office_address     text,
  country_code       text,
  about              text,

  -- Null until the owner finishes the wizard. Gates the ENM opt-in: an empty
  -- directory listing is worse than no listing.
  completed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.tenant_business_profiles is
  'One row per tenant. Feeds AiCoder generation, site contact/service blocks, and the ENM expert listing.';
comment on column public.tenant_business_profiles.completed_at is
  'Null until the wizard is finished. ENM provisioning is gated on this.';

alter table public.tenant_business_profiles enable row level security;

drop policy if exists tbp_read on public.tenant_business_profiles;
create policy tbp_read on public.tenant_business_profiles
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));

drop policy if exists tbp_write on public.tenant_business_profiles;
create policy tbp_write on public.tenant_business_profiles
  for all using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

create or replace function public.touch_tenant_business_profile()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_touch_tenant_business_profile on public.tenant_business_profiles;
create trigger trg_touch_tenant_business_profile
  before update on public.tenant_business_profiles
  for each row execute function public.touch_tenant_business_profile();

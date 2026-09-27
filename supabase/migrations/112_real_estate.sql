-- Real estate module: listings (sale / rent / off-plan), communities (area
-- guides), developers, per-tenant agent settings and property leads.
-- Gated by the `real_estate` plan module (Pro + Custom).

create table if not exists public.re_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  agent_name text,
  agent_title text,
  agent_photo text,
  whatsapp text,
  phone text,
  email text,
  default_currency text not null default 'SAR',
  default_area_unit text not null default 'sqm' check (default_area_unit in ('sqm','sqft')),
  licence_text text,
  brochure_gate boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.re_developers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  logo_url text,
  description text,
  website text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table if not exists public.re_communities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  city text,
  country text,
  image_url text,
  summary text,
  description text,
  highlights text[] not null default '{}',
  avg_price numeric,
  currency text,
  rental_yield numeric,
  lat double precision,
  lng double precision,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table if not exists public.re_properties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null,
  title text not null,
  listing_type text not null default 'sale' check (listing_type in ('sale','rent','offplan')),
  property_type text not null default 'apartment',
  status text not null default 'available' check (status in ('draft','available','reserved','sold','rented')),
  price numeric,
  price_max numeric,
  price_period text check (price_period in ('year','month','week','day')),
  price_on_request boolean not null default false,
  currency text not null default 'SAR',
  beds int,
  beds_max int,
  baths int,
  area numeric,
  area_unit text not null default 'sqm' check (area_unit in ('sqm','sqft')),
  community_id uuid references public.re_communities(id) on delete set null,
  developer_id uuid references public.re_developers(id) on delete set null,
  city text,
  country text,
  address text,
  lat double precision,
  lng double precision,
  furnishing text,
  handover text,
  payment_plan jsonb not null default '[]'::jsonb,
  amenities text[] not null default '{}',
  highlights text[] not null default '{}',
  images text[] not null default '{}',
  floor_plans text[] not null default '{}',
  brochure_url text,
  video_url text,
  tour_url text,
  summary text,
  description text,
  permit_number text,
  reference text,
  featured boolean not null default false,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create index if not exists re_properties_tenant_idx on public.re_properties (tenant_id, listing_type, status);

create table if not exists public.re_leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid references public.re_properties(id) on delete set null,
  contact_id uuid,
  kind text not null default 'enquiry' check (kind in ('enquiry','brochure','valuation','viewing','consultation','whatsapp')),
  name text,
  phone text,
  email text,
  message text,
  budget text,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','contacted','qualified','won','lost')),
  created_at timestamptz not null default now()
);
create index if not exists re_leads_tenant_idx on public.re_leads (tenant_id, created_at desc);

alter table public.re_settings    enable row level security;
alter table public.re_developers  enable row level security;
alter table public.re_communities enable row level security;
alter table public.re_properties  enable row level security;
alter table public.re_leads       enable row level security;

-- Public site reads catalogue rows directly (drafts hidden); members see all.
drop policy if exists re_settings_read on public.re_settings;
create policy re_settings_read on public.re_settings for select using (true);
drop policy if exists re_settings_write on public.re_settings;
create policy re_settings_write on public.re_settings for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists re_developers_read on public.re_developers;
create policy re_developers_read on public.re_developers for select using (true);
drop policy if exists re_developers_write on public.re_developers;
create policy re_developers_write on public.re_developers for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists re_communities_read on public.re_communities;
create policy re_communities_read on public.re_communities for select using (true);
drop policy if exists re_communities_write on public.re_communities;
create policy re_communities_write on public.re_communities for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists re_properties_read on public.re_properties;
create policy re_properties_read on public.re_properties for select
  using (status <> 'draft' or public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists re_properties_write on public.re_properties;
create policy re_properties_write on public.re_properties for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

-- Leads are written by the public API with the service role only.
drop policy if exists re_leads_read on public.re_leads;
create policy re_leads_read on public.re_leads for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists re_leads_write on public.re_leads;
create policy re_leads_write on public.re_leads for update
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));
drop policy if exists re_leads_delete on public.re_leads;
create policy re_leads_delete on public.re_leads for delete
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id));

-- Plan gating: included on Pro and Custom, off by default (tenants opt in).
update public.plans
set modules = coalesce(modules, '{}'::jsonb) || jsonb_build_object('real_estate', jsonb_build_object('included', true, 'defaultOn', false))
where id in ('pro', 'custom');
update public.plans
set modules = coalesce(modules, '{}'::jsonb) || jsonb_build_object('real_estate', jsonb_build_object('included', false, 'defaultOn', false))
where id not in ('pro', 'custom');

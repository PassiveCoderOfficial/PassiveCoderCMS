-- Results module: student results / certificates for schools, institutes and
-- training centres. Public visitors look a result up by certificate number
-- (plus DOB or roll when the site asks for it) through the server API only:
-- results rows hold personal data (DOB, parents, passport) so they are NEVER
-- publicly selectable — no one can list or scrape them.
-- Gated by the `results` plan module (Pro, Biz, Custom).

create table if not exists public.results_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  -- certificate | certificate_dob | certificate_roll
  lookup_mode text not null default 'certificate' check (lookup_mode in ('certificate','certificate_dob','certificate_roll')),
  -- Which fields the public result card shows: { "dob": true, "passport_no": true, ... }
  public_fields jsonb not null default '{}'::jsonb,
  mask_passport boolean not null default true,
  institute_name text,
  signatory_name text,
  signatory_title text,
  signature_url text,
  -- Custom field labels: { "certificate_no": "Certificate Number", ... }
  labels jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.results_courses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  code text,
  level text,
  duration text,
  summary text,
  image_url text,
  -- Course page on the site (CMS page path), so results link to it.
  page_url text,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  certificate_no text not null,
  roll text,
  student_name text not null,
  father_name text,
  mother_name text,
  result text,
  course_id uuid references public.results_courses(id) on delete set null,
  course_name text,
  photo_url text,
  dob text,
  gender text,
  passport_no text,
  issue_date text,
  duration text,
  notes text,
  status text not null default 'published' check (status in ('published','draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Lookups are case/space-insensitive on the certificate number.
create unique index if not exists results_tenant_cert_uidx on public.results (tenant_id, lower(btrim(certificate_no)));
create index if not exists results_tenant_idx on public.results (tenant_id, created_at desc);

alter table public.results_settings enable row level security;
alter table public.results_courses  enable row level security;
alter table public.results          enable row level security;

drop policy if exists results_settings_read on public.results_settings;
create policy results_settings_read on public.results_settings for select using (true);
drop policy if exists results_settings_write on public.results_settings;
create policy results_settings_write on public.results_settings for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

drop policy if exists results_courses_read on public.results_courses;
create policy results_courses_read on public.results_courses for select using (true);
drop policy if exists results_courses_write on public.results_courses;
create policy results_courses_write on public.results_courses for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

-- Results: members only. Public lookups go through /api/results/lookup with
-- the service role, one exact match at a time.
drop policy if exists results_read on public.results;
create policy results_read on public.results for select
  using (public.is_super_admin() or public.is_tenant_member(tenant_id));
drop policy if exists results_write on public.results;
create policy results_write on public.results for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

-- Simple per-IP lookup throttle (rows older than an hour are ignored).
create table if not exists public.results_lookup_log (
  id bigserial primary key,
  tenant_id uuid not null,
  ip text not null,
  found boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists results_lookup_log_idx on public.results_lookup_log (ip, created_at desc);
alter table public.results_lookup_log enable row level security;

-- Plan gating: Pro and up, off by default (tenants opt in).
update public.plans
set modules = coalesce(modules, '{}'::jsonb) || jsonb_build_object('results', jsonb_build_object('included', true, 'defaultOn', false))
where id in ('pro', 'biz', 'custom');
update public.plans
set modules = coalesce(modules, '{}'::jsonb) || jsonb_build_object('results', jsonb_build_object('included', false, 'defaultOn', false))
where id not in ('pro', 'biz', 'custom');

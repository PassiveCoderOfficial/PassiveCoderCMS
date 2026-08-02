-- 056_content_scheduler.sql
-- Social content scheduler. Built for Passive Coder's own use first, shipped
-- as a togglable module ("content_scheduler") that Pro plans include.
--
-- Shape notes:
-- * brand_profiles, not a company/personal enum — a tenant runs N brands
--   (company, founder's personal brand, side products) and each carries its
--   own channels, colors and timezone.
-- * content_items holds the idea; content_targets holds one row per platform
--   it goes out on. One idea → IG reel + LinkedIn post + FB post, each with
--   its own body override, schedule and status. A single-row design can't
--   express "IG published, LinkedIn failed", which is the normal daily case.
-- * Publishing is MANUAL in v1: no social APIs. The scheduler tells you what
--   to post and when, you post it, mark it published and paste the URL back.
--   publish_mode/external_post_url exist so API adapters slot in later
--   without a schema change.
-- * Access is two-layer: tenant membership (existing tenant_members) gates the
--   tenant, content_module_grants gates this module per user. A staffer with
--   a grant sees the scheduler; everyone else never sees the nav item. Owners
--   and admins are implicitly granted so a tenant is never locked out of its
--   own module.

begin;

-- ── Brands ───────────────────────────────────────────────────────────────────
create table if not exists public.brand_profiles (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  slug        text not null,
  kind        text not null default 'company'
              check (kind in ('company','personal','product','other')),
  description text,
  avatar_url  text,
  color       text not null default '#f97316',
  timezone    text not null default 'Asia/Dhaka',
  position    int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists brand_profiles_tenant_slug_uq
  on public.brand_profiles(tenant_id, slug);
create index if not exists brand_profiles_tenant_idx
  on public.brand_profiles(tenant_id, position);

-- ── Channels (a brand's presence on one platform) ────────────────────────────
create table if not exists public.brand_channels (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  brand_id    uuid not null references public.brand_profiles(id) on delete cascade,
  platform    text not null
              check (platform in ('facebook','instagram','linkedin','x','youtube',
                                  'tiktok','threads','pinterest','gbp','other')),
  handle      text,
  profile_url text,
  external_id text,                        -- page/account id once APIs land
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists brand_channels_brand_platform_uq
  on public.brand_channels(brand_id, platform);
create index if not exists brand_channels_tenant_idx on public.brand_channels(tenant_id);

-- ── Content items (the idea) ─────────────────────────────────────────────────
create table if not exists public.content_items (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  brand_id      uuid not null references public.brand_profiles(id) on delete cascade,
  title         text not null,
  hook          text,                      -- opening line / thumbnail text
  body          text,                      -- caption or script
  content_type  text not null default 'post'
                check (content_type in ('short_video','reel','post','carousel','story',
                                        'article','live','thread','newsletter','other')),
  pillar        text                       -- educational / proof / behind_scenes / offer
                check (pillar is null or pillar in
                       ('educational','trust','behind_scenes','case_study','offer','engagement')),
  status        text not null default 'idea'
                check (status in ('idea','drafting','in_review','approved','scheduled',
                                  'published','failed','archived')),
  scheduled_at  timestamptz,
  published_at  timestamptz,
  assignee_id   uuid references auth.users(id) on delete set null,
  created_by    uuid references auth.users(id) on delete set null,
  cta           text,
  tags          text[] not null default '{}',
  media         jsonb  not null default '[]',  -- [{url,type,alt}]
  meta          jsonb  not null default '{}',  -- hashtags, link, production notes
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists content_items_tenant_sched_idx
  on public.content_items(tenant_id, scheduled_at);
create index if not exists content_items_tenant_status_idx
  on public.content_items(tenant_id, status);
create index if not exists content_items_brand_idx on public.content_items(brand_id);
create index if not exists content_items_assignee_idx on public.content_items(assignee_id);
create index if not exists content_items_tags_gin on public.content_items using gin(tags);

-- ── Per-platform targets ─────────────────────────────────────────────────────
create table if not exists public.content_targets (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  content_item_id   uuid not null references public.content_items(id) on delete cascade,
  channel_id        uuid references public.brand_channels(id) on delete set null,
  platform          text not null,
  body_override     text,
  media_override    jsonb,
  scheduled_at      timestamptz,            -- null = inherit the item's schedule
  status            text not null default 'scheduled'
                    check (status in ('scheduled','published','failed','skipped')),
  publish_mode      text not null default 'manual'
                    check (publish_mode in ('manual','api')),
  external_post_url text,
  error_text        text,
  published_at      timestamptz,
  created_at        timestamptz not null default now()
);
create unique index if not exists content_targets_item_platform_uq
  on public.content_targets(content_item_id, platform);
create index if not exists content_targets_tenant_idx on public.content_targets(tenant_id);
create index if not exists content_targets_sched_idx
  on public.content_targets(tenant_id, scheduled_at);

-- ── Comments + activity ──────────────────────────────────────────────────────
create table if not exists public.content_comments (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists content_comments_item_idx
  on public.content_comments(content_item_id, created_at);

create table if not exists public.content_activity (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  action          text not null,
  diff            jsonb not null default '{}',
  created_at      timestamptz not null default now()
);
create index if not exists content_activity_item_idx
  on public.content_activity(content_item_id, created_at desc);

-- ── Per-user module grants ───────────────────────────────────────────────────
-- Who, inside a tenant, can see/use the scheduler. brand_scope null = all
-- brands; otherwise limited to the listed brand ids.
create table if not exists public.content_module_grants (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  access_level text not null default 'editor'
               check (access_level in ('viewer','editor','approver','admin')),
  brand_scope  uuid[],
  granted_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create unique index if not exists content_module_grants_tenant_user_uq
  on public.content_module_grants(tenant_id, user_id);
create index if not exists content_module_grants_user_idx
  on public.content_module_grants(user_id);

-- ── Access helpers ───────────────────────────────────────────────────────────
-- Read access: super admin, tenant owner/admin (implicit), or an explicit grant.
create or replace function public.has_content_access(t uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.is_super_admin()
    or exists (
      select 1 from public.tenant_members
      where tenant_id = t and user_id = auth.uid() and role in ('owner','admin')
    )
    or exists (
      select 1 from public.content_module_grants
      where tenant_id = t and user_id = auth.uid()
    );
$$;

-- Write access: same, minus 'viewer' grants.
create or replace function public.can_edit_content(t uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.is_super_admin()
    or exists (
      select 1 from public.tenant_members
      where tenant_id = t and user_id = auth.uid() and role in ('owner','admin')
    )
    or exists (
      select 1 from public.content_module_grants
      where tenant_id = t and user_id = auth.uid()
        and access_level in ('editor','approver','admin')
    );
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.brand_profiles         enable row level security;
alter table public.brand_channels         enable row level security;
alter table public.content_items          enable row level security;
alter table public.content_targets        enable row level security;
alter table public.content_comments       enable row level security;
alter table public.content_activity       enable row level security;
alter table public.content_module_grants  enable row level security;

do $$
declare tbl text;
begin
  foreach tbl in array array[
    'brand_profiles','brand_channels','content_items',
    'content_targets','content_comments','content_activity'
  ] loop
    execute format('drop policy if exists %I on public.%I', tbl || '_read', tbl);
    execute format(
      'create policy %I on public.%I for select using (public.has_content_access(tenant_id))',
      tbl || '_read', tbl);

    execute format('drop policy if exists %I on public.%I', tbl || '_write', tbl);
    execute format(
      'create policy %I on public.%I for all using (public.can_edit_content(tenant_id)) '
      || 'with check (public.can_edit_content(tenant_id))',
      tbl || '_write', tbl);
  end loop;
end $$;

-- Grants table: any user with module access can see who else has access
-- (needed to render the access UI), but only tenant owner/admin or a
-- module 'admin' may hand out or revoke access.
drop policy if exists content_module_grants_read on public.content_module_grants;
create policy content_module_grants_read on public.content_module_grants
  for select using (public.has_content_access(tenant_id) or user_id = auth.uid());

drop policy if exists content_module_grants_write on public.content_module_grants;
create policy content_module_grants_write on public.content_module_grants
  for all
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.tenant_members
      where tenant_id = content_module_grants.tenant_id
        and user_id = auth.uid() and role in ('owner','admin')
    )
    or exists (
      select 1 from public.content_module_grants g
      where g.tenant_id = content_module_grants.tenant_id
        and g.user_id = auth.uid() and g.access_level = 'admin'
    )
  )
  with check (
    public.is_super_admin()
    or exists (
      select 1 from public.tenant_members
      where tenant_id = content_module_grants.tenant_id
        and user_id = auth.uid() and role in ('owner','admin')
    )
    or exists (
      select 1 from public.content_module_grants g
      where g.tenant_id = content_module_grants.tenant_id
        and g.user_id = auth.uid() and g.access_level = 'admin'
    )
  );

-- ── Tenant user search (for the access-granting UI) ──────────────────────────
-- Scoped to one tenant's members so it can never be used to enumerate every
-- profile on the platform. Caller must already have module access.
create or replace function public.search_tenant_users(t uuid, q text)
returns table (user_id uuid, full_name text, email text, role text, has_access boolean)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.full_name, p.email, tm.role,
         exists (select 1 from public.content_module_grants g
                 where g.tenant_id = t and g.user_id = p.id)
  from public.tenant_members tm
  join public.profiles p on p.id = tm.user_id
  where tm.tenant_id = t
    and public.has_content_access(t)
    and (
      q is null or q = ''
      or p.email ilike '%' || q || '%'
      or coalesce(p.full_name,'') ilike '%' || q || '%'
    )
  order by p.full_name nulls last
  limit 20;
$$;

revoke execute on function public.search_tenant_users(uuid, text) from public, anon;
grant execute on function public.search_tenant_users(uuid, text) to authenticated;

revoke execute on function public.has_content_access(uuid) from public, anon;
grant execute on function public.has_content_access(uuid) to authenticated;
revoke execute on function public.can_edit_content(uuid) from public, anon;
grant execute on function public.can_edit_content(uuid) to authenticated;

-- ── updated_at triggers ──────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists brand_profiles_touch on public.brand_profiles;
create trigger brand_profiles_touch before update on public.brand_profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists content_items_touch on public.content_items;
create trigger content_items_touch before update on public.content_items
  for each row execute function public.touch_updated_at();

-- ── Plan module registration ─────────────────────────────────────────────────
-- Included on every plan so SA can switch it on per tenant, but defaultOn only
-- where the plan is Pro-tier. Tenants that never opt in see nothing.
update public.plans
set modules = modules || jsonb_build_object(
  'content_scheduler',
  jsonb_build_object('included', true, 'defaultOn', id in ('pro','agency','custom'))
)
where not (modules ? 'content_scheduler');

commit;

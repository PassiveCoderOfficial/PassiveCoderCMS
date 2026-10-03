-- Automatic 301 redirects when a page's URL (slug) changes, so links from
-- Google, social posts and other sites keep working. Served by the public
-- catch-all route before it gives up with a 404.

create table if not exists public.page_redirects (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  from_path  text not null,           -- slug without leading slash, e.g. "about-us"
  to_path    text not null,
  hits       integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, from_path)
);

alter table public.page_redirects enable row level security;
-- Site members can see and remove their redirects; the public route reads
-- with the service role.
drop policy if exists page_redirects_member_read on public.page_redirects;
create policy page_redirects_member_read on public.page_redirects for select using (is_tenant_member(tenant_id));
drop policy if exists page_redirects_member_delete on public.page_redirects;
create policy page_redirects_member_delete on public.page_redirects for delete using (is_tenant_member(tenant_id));
revoke all on public.page_redirects from anon;

create or replace function public.record_page_redirect()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tenant_id is null or new.slug is not distinct from old.slug or old.slug is null then
    return new;
  end if;
  -- Point existing redirects at the new address (no chains).
  update page_redirects set to_path = new.slug where tenant_id = new.tenant_id and to_path = old.slug;
  -- The new address is a real page again: drop any redirect away from it.
  delete from page_redirects where tenant_id = new.tenant_id and from_path = new.slug;
  insert into page_redirects (tenant_id, from_path, to_path)
  values (new.tenant_id, old.slug, new.slug)
  on conflict (tenant_id, from_path) do update set to_path = excluded.to_path;
  return new;
end $$;

drop trigger if exists trg_record_page_redirect on public.pages;
create trigger trg_record_page_redirect
  after update of slug on public.pages
  for each row execute function public.record_page_redirect();

-- A new page taking over an old address removes the redirect.
create or replace function public.clear_page_redirect_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tenant_id is not null then
    delete from page_redirects where tenant_id = new.tenant_id and from_path = new.slug;
  end if;
  return new;
end $$;

drop trigger if exists trg_clear_page_redirect on public.pages;
create trigger trg_clear_page_redirect
  after insert on public.pages
  for each row execute function public.clear_page_redirect_on_insert();

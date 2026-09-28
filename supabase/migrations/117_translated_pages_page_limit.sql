-- Translated copies of a page (seo.lang set, slug "<lang>" for the home page
-- or "<lang>/<base slug>") don't count toward the plan's page limit: a Basic
-- site with 6 pages in English and Arabic is still a 6-page site. A page only
-- qualifies when the base page it translates actually exists, so seo.lang
-- can't be used to slip extra pages past the limit.

create or replace function public.is_translated_page(p_tenant uuid, p_slug text, p_seo jsonb)
returns boolean
language sql
stable
security definer
as $$
  select coalesce(
    (p_seo->>'lang') is not null and length(p_seo->>'lang') between 2 and 5 and (
      (p_slug = p_seo->>'lang' and exists (
        select 1 from pages b
         where b.tenant_id = p_tenant and b.slug = 'home'
           and b.deleted_at is null and b.seo->>'lang' is null))
      or (p_slug like (p_seo->>'lang') || '/%' and exists (
        select 1 from pages b
         where b.tenant_id = p_tenant
           and b.slug = substr(p_slug, length(p_seo->>'lang') + 2)
           and b.deleted_at is null and b.seo->>'lang' is null))
    ),
    false)
$$;

create or replace function public.enforce_page_limit()
returns trigger
language plpgsql
security definer
as $function$
declare
  lim int;
  cnt int;
begin
  -- Template source pages are catalogue content, not tenant site pages.
  if new.tenant_id is null or new.template_id is not null then
    return new;
  end if;

  if public.is_translated_page(new.tenant_id, new.slug, new.seo) then
    return new;
  end if;

  select t.pages_limit_override into lim from tenants t where t.id = new.tenant_id;

  if lim is null then
    select p.pages_limit into lim
      from subscriptions s
      join plans p on p.id = s.plan_id
     where s.tenant_id = new.tenant_id
     limit 1;
  end if;

  if lim is null or lim < 0 then
    return new;
  end if;

  select count(*) into cnt
    from pages pg
   where pg.tenant_id = new.tenant_id and pg.deleted_at is null
     and not public.is_translated_page(pg.tenant_id, pg.slug, pg.seo);

  if cnt >= lim then
    raise exception 'Page limit reached (% pages on this plan). Upgrade to add more.', lim
      using errcode = 'P0001';
  end if;

  return new;
end
$function$;

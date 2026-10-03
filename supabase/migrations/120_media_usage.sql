-- Where is a media file used on a site? Shown before deleting it, so owners
-- don't silently break pages, products or branding that still point at it.
create or replace function public.media_usage(p_tenant uuid, p_url text)
returns table(kind text, id uuid, title text)
language sql
stable
security definer
set search_path = public
as $$
  select 'page', p.id, p.title from pages p
   where p.tenant_id = p_tenant and p.deleted_at is null
     and (p.blocks::text like '%' || p_url || '%' or coalesce(p.draft_blocks::text, '') like '%' || p_url || '%'
          or coalesce(p.featured_image, '') = p_url or coalesce(p.seo::text, '') like '%' || p_url || '%')
  union all
  select 'product', pr.id, pr.name from products pr
   where pr.tenant_id = p_tenant and pr.images::text like '%' || p_url || '%'
  union all
  select 'branding', s.tenant_id, 'Logo, header or footer' from site_identity s
   where s.tenant_id = p_tenant
     and (coalesce(s.logo_url, '') = p_url or coalesce(s.logo_dark_url, '') = p_url
          or coalesce(s.global_header::text, '') like '%' || p_url || '%'
          or coalesce(s.global_footer::text, '') like '%' || p_url || '%')
  limit 50
$$;

revoke all on function public.media_usage(uuid, text) from public, anon, authenticated;
grant execute on function public.media_usage(uuid, text) to service_role;

-- 029_super_admin_rls_bypass.sql
-- 29 tables had membership-scoped RLS with no super-admin bypass, so SA users
-- (who hold no tenant_members rows) got silent RLS failures writing through
-- the dashboard on tenant subdomains (e.g. testimonials POST → data lost).
-- Rewrites every membership-scoped policy to prepend public.is_super_admin().

begin;

do $$
declare
  p record;
begin
  for p in
    select policyname, tablename, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        (qual is not null and qual like '%tenant_members%'
          and qual not like '%is_super_admin%')
        or
        (with_check is not null and with_check like '%tenant_members%'
          and with_check not like '%is_super_admin%')
      )
  loop
    if p.qual is not null and p.qual like '%tenant_members%'
       and p.qual not like '%is_super_admin%' then
      execute format(
        'alter policy %I on public.%I using (public.is_super_admin() or (%s))',
        p.policyname, p.tablename, p.qual
      );
    end if;

    if p.with_check is not null and p.with_check like '%tenant_members%'
       and p.with_check not like '%is_super_admin%' then
      execute format(
        'alter policy %I on public.%I with check (public.is_super_admin() or (%s))',
        p.policyname, p.tablename, p.with_check
      );
    end if;
  end loop;
end $$;

commit;

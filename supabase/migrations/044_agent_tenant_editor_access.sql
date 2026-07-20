-- Same blind spot as is_tenant_member() (fixed in 043): is_tenant_editor()
-- only checked tenant_members, so an active assigned agent could read tables
-- gated by is_tenant_member() but not write to tables gated by
-- is_tenant_editor() (CRM, invoices, accounting, staff/jobs, campaigns,
-- API keys, page_categories/page_tags via pages.tenant_id).
create or replace function public.is_tenant_editor(t uuid)
returns boolean
language sql
stable security definer
set search_path = 'public'
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = t and user_id = auth.uid()
      and role in ('owner','admin','editor')
  )
  or exists (
    select 1 from public.tenants tn
    join public.agents a on a.id = tn.assigned_agent_id
    where tn.id = t and a.user_id = auth.uid() and a.status = 'active'
  );
$$;

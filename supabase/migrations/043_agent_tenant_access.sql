-- Staff/referral agents assigned to a tenant (tenants.assigned_agent_id) had no
-- tenant_members row, so is_tenant_member() locked them out of every RLS-gated
-- table (pages, posts, media, etc) even though the dashboard let them in.
-- Extend the membership check to also recognize an active assigned agent.
create or replace function public.is_tenant_member(t uuid)
returns boolean
language sql
stable security definer
set search_path = 'public'
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = t and user_id = auth.uid()
  )
  or exists (
    select 1 from public.tenants tn
    join public.agents a on a.id = tn.assigned_agent_id
    where tn.id = t and a.user_id = auth.uid() and a.status = 'active'
  );
$$;

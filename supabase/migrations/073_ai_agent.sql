-- 073_ai_agent.sql
-- AI agent (admin-wide): persisted conversations, messages, and confirm-gated
-- pending write actions. Reuses is_tenant_member()/is_tenant_editor() from
-- 028_authz_helpers_api_keys.sql — reads gated on membership, writes
-- (confirm/cancel + conversation/message inserts) gated on editor role.

begin;

create table public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_conversations_tenant_idx on public.agent_conversations(tenant_id);
create index if not exists agent_conversations_user_idx on public.agent_conversations(user_id);

create table public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversations(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists agent_messages_conversation_idx on public.agent_messages(conversation_id);
create index if not exists agent_messages_tenant_idx on public.agent_messages(tenant_id);

create table public.agent_pending_actions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversations(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  tool_name text not null,
  args jsonb not null,
  human_description text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','expired')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id)
);

create index if not exists agent_pending_actions_conversation_idx on public.agent_pending_actions(conversation_id);
create index if not exists agent_pending_actions_tenant_idx on public.agent_pending_actions(tenant_id);

alter table public.agent_conversations enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_pending_actions enable row level security;

-- ── agent_conversations ──────────────────────────────────────────────────────
drop policy if exists "agent_conversations_tenant_read" on public.agent_conversations;
create policy "agent_conversations_tenant_read" on public.agent_conversations
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));

drop policy if exists "agent_conversations_tenant_write" on public.agent_conversations;
create policy "agent_conversations_tenant_write" on public.agent_conversations
  for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

-- ── agent_messages ────────────────────────────────────────────────────────────
drop policy if exists "agent_messages_tenant_read" on public.agent_messages;
create policy "agent_messages_tenant_read" on public.agent_messages
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));

drop policy if exists "agent_messages_tenant_write" on public.agent_messages;
create policy "agent_messages_tenant_write" on public.agent_messages
  for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

-- ── agent_pending_actions ─────────────────────────────────────────────────────
drop policy if exists "agent_pending_actions_tenant_read" on public.agent_pending_actions;
create policy "agent_pending_actions_tenant_read" on public.agent_pending_actions
  for select using (public.is_super_admin() or public.is_tenant_member(tenant_id));

drop policy if exists "agent_pending_actions_tenant_write" on public.agent_pending_actions;
create policy "agent_pending_actions_tenant_write" on public.agent_pending_actions
  for all
  using (public.is_super_admin() or public.is_tenant_editor(tenant_id))
  with check (public.is_super_admin() or public.is_tenant_editor(tenant_id));

commit;

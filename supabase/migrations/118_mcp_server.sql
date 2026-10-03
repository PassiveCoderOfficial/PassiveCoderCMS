-- MCP server: lets staff and site admins drive their dashboard from their own
-- AI agent (Claude, ChatGPT/Codex, Gemini, Cursor...). Two ways in:
--   * OAuth 2.1 (dynamic client registration + PKCE) for apps with a
--     "Sign in" connector flow (claude.ai, ChatGPT, Claude Desktop);
--   * personal access tokens created in the dashboard, for CLIs.
-- Every token is bound to one user + one site + a scope (read | write), and
-- the user's live role on that site is re-checked on every call.
-- Service-role only: no anon/authenticated access to any of these tables.

create table if not exists public.mcp_oauth_clients (
  client_id     text primary key,
  client_name   text,
  redirect_uris text[] not null,
  created_at    timestamptz not null default now()
);

create table if not exists public.mcp_oauth_codes (
  code_hash      text primary key,
  client_id      text not null references public.mcp_oauth_clients(client_id) on delete cascade,
  user_id        uuid not null,
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  scope          text not null check (scope in ('read', 'write')),
  redirect_uri   text not null,
  code_challenge text not null,
  expires_at     timestamptz not null,
  used_at        timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists public.mcp_tokens (
  id           uuid primary key default gen_random_uuid(),
  token_hash   text not null unique,
  kind         text not null check (kind in ('access', 'refresh', 'pat')),
  user_id      uuid not null,
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  scope        text not null check (scope in ('read', 'write')),
  client_id    text references public.mcp_oauth_clients(client_id) on delete cascade,
  name         text,
  prefix       text,
  expires_at   timestamptz,
  revoked_at   timestamptz,
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists mcp_tokens_user_tenant on public.mcp_tokens (user_id, tenant_id);

create table if not exists public.mcp_audit (
  id         bigint generated always as identity primary key,
  token_id   uuid,
  user_id    uuid,
  tenant_id  uuid,
  tool       text not null,
  args       jsonb,
  ok         boolean not null,
  error      text,
  created_at timestamptz not null default now()
);
create index if not exists mcp_audit_tenant_time on public.mcp_audit (tenant_id, created_at desc);

alter table public.mcp_oauth_clients enable row level security;
alter table public.mcp_oauth_codes   enable row level security;
alter table public.mcp_tokens        enable row level security;
alter table public.mcp_audit         enable row level security;
revoke all on public.mcp_oauth_clients, public.mcp_oauth_codes, public.mcp_tokens, public.mcp_audit from anon, authenticated;

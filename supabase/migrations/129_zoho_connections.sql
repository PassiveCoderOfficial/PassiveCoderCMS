-- "Connect Zoho" (Dashboard > Business Email): a site owner authorises
-- Passive Coder against their own Zoho Mail organisation (free or paid plan),
-- and the dashboard then adds/verifies the domain and manages mailboxes
-- through Zoho's API. One connection per site. Server-only: the refresh
-- token never leaves the service role.
create table if not exists public.email_zoho_connections (
  tenant_id       uuid primary key references public.tenants(id) on delete cascade,
  dc              text not null,           -- com | in | eu | com.au | jp | ca | sa
  accounts_server text not null,           -- e.g. https://accounts.zoho.in
  refresh_token   text not null,
  zoid            bigint,                  -- Zoho organisation id
  org_name        text,
  connected_by    uuid,
  connected_at    timestamptz not null default now()
);
alter table public.email_zoho_connections enable row level security;
revoke all on public.email_zoho_connections from anon, authenticated;

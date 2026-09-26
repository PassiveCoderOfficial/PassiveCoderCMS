-- Move third-party OAuth secrets out of site_settings.
--
-- site_settings has a public-read RLS policy (qual = true) because every
-- public page renders from it (site name, logo, theme, currency...). The
-- Google Analytics OAuth columns added later landed in the same table, so
-- anyone holding the public anon key could read every tenant's GA refresh
-- token, access token and connected Google email. Confirmed with a real
-- anonymous REST request on 2026-09-26.
--
-- New home: tenant_integrations, RLS enabled with NO policies — only the
-- service role (server-side admin client) can read or write it. Every code
-- path that touches these tokens already runs server-side on the admin
-- client, so no member/anon policy is needed.
--
-- ga_measurement_id and ga_property_id stay in site_settings: neither is a
-- secret, and the measurement id is emitted in the public tracking script.

create table if not exists tenant_integrations (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  ga_oauth_refresh_token text,
  ga_oauth_access_token text,
  ga_oauth_expires_at timestamptz,
  ga_oauth_connected_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tenant_integrations enable row level security;

-- Belt and braces: even with no policies, don't leave default grants on a
-- table whose whole purpose is holding secrets.
revoke all on tenant_integrations from anon, authenticated;

insert into tenant_integrations (tenant_id, ga_oauth_refresh_token, ga_oauth_access_token, ga_oauth_expires_at, ga_oauth_connected_email)
select tenant_id, ga_oauth_refresh_token, ga_oauth_access_token, ga_oauth_expires_at, ga_oauth_connected_email
from site_settings
where tenant_id is not null
  and (ga_oauth_refresh_token is not null or ga_oauth_connected_email is not null)
on conflict (tenant_id) do nothing;

-- Column drop is in 102, run only after the code reading tenant_integrations
-- is deployed — dropping first would break the live GA connection mid-deploy.

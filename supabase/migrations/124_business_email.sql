-- Business email (Dashboard > Business Email): which mailbox provider the
-- site's domain uses, free forwarding aliases, and the verified sending
-- domain for emails the site sends (bookings, invoices, campaigns).
create table if not exists public.tenant_email_settings (
  tenant_id        uuid primary key references public.tenants(id) on delete cascade,
  provider         text check (provider in ('google', 'microsoft', 'zoho', 'titan', 'forwarding', 'other')),
  dkim             jsonb not null default '[]'::jsonb,      -- provider DKIM records the owner pasted: [{name, value}]
  forwards         jsonb not null default '[]'::jsonb,      -- [{alias: "info", to: "me@gmail.com"}]
  sender_local     text not null default 'hello',           -- local part for site emails: hello@domain
  sender_name      text,
  resend_domain_id text,
  sender_status    text not null default 'none' check (sender_status in ('none', 'pending', 'verified', 'failed')),
  sender_records   jsonb not null default '[]'::jsonb,      -- DNS records Resend asked for
  updated_at       timestamptz not null default now()
);
alter table public.tenant_email_settings enable row level security;
drop policy if exists tenant_email_settings_read on public.tenant_email_settings;
create policy tenant_email_settings_read on public.tenant_email_settings for select using (is_tenant_member(tenant_id));
revoke insert, update, delete on public.tenant_email_settings from anon, authenticated;

-- Provider ownership check (zoho-verification=..., google-site-verification=..., MS=...)
-- and Zoho data-centre region (its mail servers differ per region).
alter table public.tenant_email_settings add column if not exists provider_verification text;
alter table public.tenant_email_settings add column if not exists zoho_region text not null default 'com'
  check (zoho_region in ('com', 'in', 'eu', 'com.au'));

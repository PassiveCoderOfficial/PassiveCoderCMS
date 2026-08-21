-- Audit trail for site handovers.
--
-- Staff build sites under their own account and later transfer them to the
-- client. That moment changes who controls a real business's website, billing
-- and customer data, so "who handed this over, to whom, when" needs to survive
-- long after the fact — it is exactly what gets asked in a dispute months later.
--
-- RLS is enabled with no policies: rows are written by the service-role client
-- from the transfer endpoint and are not readable by tenant users.

create table if not exists tenant_ownership_transfers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  -- Nullable: a site created directly by staff may have had no prior owner.
  from_user_id uuid,
  to_user_id uuid not null,
  -- Stored alongside the id because the address is the thing a human recognises
  -- when auditing, and it is what was actually typed at transfer time.
  to_email text not null,
  performed_by uuid not null,
  account_created boolean not null default false,
  previous_owner_action text not null default 'demote',
  created_at timestamptz not null default now()
);

create index if not exists tenant_ownership_transfers_tenant_idx
  on tenant_ownership_transfers(tenant_id, created_at desc);

alter table tenant_ownership_transfers enable row level security;

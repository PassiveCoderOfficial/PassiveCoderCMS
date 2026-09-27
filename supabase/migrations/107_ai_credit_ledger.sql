-- AiCoder generation credits: idempotent, atomic, audited.
--
-- The Dodo webhook credited top-ups with a read-then-write
-- (`select purchased` then `update purchased = old + n`) and no record of
-- which payment it had already credited. Dodo retries webhook deliveries
-- (timeouts, non-2xx), so a retried payment.succeeded credited the same
-- purchase twice — free generations — and two concurrent deliveries could
-- also race. There was also no way for a super admin to grant generations
-- for a manual payment (bKash / bank transfer), which many BD clients need.
-- Found 2026-09-27.
--
-- One ledger row per credit, keyed by an external reference (Dodo
-- payment_id, or "manual:<uuid>" for SA grants). The credit function
-- inserts the ledger row first; only if that insert actually happens does
-- it bump the balance — in one transaction, one atomic UPDATE.

create table if not exists ai_credit_ledger (
  reference text primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  generations integer not null check (generations > 0),
  source text not null check (source in ('dodo', 'manual')),
  amount_cents integer,
  currency text,
  note text,
  granted_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists ai_credit_ledger_tenant_idx on ai_credit_ledger (tenant_id, created_at desc);

-- Service-role only (webhook + SA API routes use the admin client).
alter table ai_credit_ledger enable row level security;
revoke all on ai_credit_ledger from anon, authenticated;

create or replace function credit_ai_generations(
  p_reference text,
  p_tenant uuid,
  p_generations integer,
  p_source text,
  p_amount_cents integer default null,
  p_currency text default null,
  p_note text default null,
  p_granted_by uuid default null
)
returns boolean  -- true = credited now, false = this reference was already credited
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  insert into ai_credit_ledger (reference, tenant_id, generations, source, amount_cents, currency, note, granted_by)
  values (p_reference, p_tenant, p_generations, p_source, p_amount_cents, p_currency, p_note, p_granted_by)
  on conflict (reference) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return false;
  end if;

  update tenants
     set ai_generations_purchased = ai_generations_purchased + p_generations
   where id = p_tenant;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'tenant_not_found';
  end if;
  return true;
end $$;

revoke execute on function credit_ai_generations(text, uuid, integer, text, integer, text, text, uuid) from public, anon, authenticated;
grant execute on function credit_ai_generations(text, uuid, integer, text, integer, text, text, uuid) to service_role;

-- Passive Coder CMS: database for a self-hosted install.
-- Load into an EMPTY Supabase project with selfhost/setup-db.mjs (or psql).
-- Built by open-source/build-schema.mjs from the hosted schema after
-- migration 241, plus: 242_selfhost_plan.sql, 244_site_chat_prompt.sql.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.12 (Debian 17.12-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--




--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--




--
-- Name: action_app_row(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.action_app_row(p_actor uuid, p_tenant uuid) RETURNS uuid
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  select id from admin_audit_log
  where actor_user_id = p_actor and via = 'app' and action like 'app.%'
    and action !~ '^app\.(get_|list_|find_|search_|platform_overview|billing_overview|generate_)'
    and created_at > now() - interval '5 seconds'
    and (tenant_id is null or p_tenant is null or tenant_id = p_tenant)
  order by created_at desc limit 1
$$;


--
-- Name: action_changed(jsonb, jsonb, text[], text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.action_changed(o jsonb, n jsonb, watch text[], skip text[]) RETURNS text[]
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  select coalesce(array_agg(k order by k), '{}')
  from jsonb_object_keys(n) k
  where (watch is null or k = any(watch))
    and (skip is null or not k = any(skip))
    and o->k is distinct from n->k
$$;


--
-- Name: action_values(jsonb, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.action_values(o jsonb, cols text[]) RETURNS jsonb
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  select coalesce(jsonb_object_agg(k, o->k), '{}'::jsonb) from unnest(cols) k
$$;


--
-- Name: ai_credit_usage(uuid, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ai_credit_usage(p_tenant uuid, p_since timestamp with time zone) RETURNS TABLE(use_type text, credits bigint, purchased_part bigint, free_part bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select s.use_type, sum(s.credits)::bigint, sum(s.purchased_part)::bigint, sum(s.free_part)::bigint
    from ai_credit_spends s
   where s.tenant_id = p_tenant and s.created_at >= p_since and s.refunded_at is null
   group by s.use_type
$$;


--
-- Name: apply_migration_009(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.apply_migration_009() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_tenant_id_unique'
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_tenant_id_unique UNIQUE (tenant_id);
  END IF;

  -- Status check
  ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
  ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('trial','active','past_due','cancelled','expired','suspended'));
END;
$$;


--
-- Name: apply_migration_010(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.apply_migration_010() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  ALTER TABLE homepage_settings
    ADD COLUMN IF NOT EXISTS cta_headline         text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS cta_subheadline      text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS features_headline    text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS features_subheadline text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS hiw_headline         text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS hiw_subheadline      text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS testimonials_headline text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS agent_headline       text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS agent_subheadline    text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS testimonials         jsonb NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS faq                  jsonb NOT NULL DEFAULT '[]';
END;
$$;


--
-- Name: apply_migration_011(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.apply_migration_011() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS referred_by_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'tenants' AND indexname = 'tenants_referred_by_agent_idx'
  ) THEN
    CREATE INDEX tenants_referred_by_agent_idx ON tenants(referred_by_agent_id);
  END IF;
END;
$$;


--
-- Name: audit_acting_as(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_acting_as() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
declare
  hdrs json;
  v text;
  target uuid;
  v_name text;
begin
  begin
    if new.actor_user_id is null or (new.args ? 'acting_as') then return new; end if;
    hdrs := nullif(current_setting('request.headers', true), '')::json;
    v := hdrs->>'x-pc-acting-as';
    if v is null or v !~* '^[0-9a-f-]{36}$' then return new; end if;
    target := v::uuid;
    if target = new.actor_user_id then return new; end if;
    if not exists (select 1 from super_admins where user_id = new.actor_user_id) then return new; end if;
    if exists (select 1 from super_admins where user_id = target) then return new; end if;
    select coalesce(nullif(trim(full_name), ''), email) into v_name from pc_staff where user_id = target and status = 'active';
    if v_name is null then return new; end if;
    new.args := coalesce(new.args, '{}'::jsonb) || jsonb_build_object('acting_as', target, 'acting_as_name', v_name);
  exception when others then
    null; -- logging never breaks the write
  end;
  return new;
end $_$;


--
-- Name: bump_page_view_stats(uuid, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bump_page_view_stats(t uuid, p_path text, p_referrer_domain text, p_device_type text, p_country text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.page_view_stats (tenant_id, day, path, referrer_domain, device_type, country, views)
  values (
    t, current_date, left(p_path, 500),
    coalesce(nullif(p_referrer_domain, ''), 'direct'),
    coalesce(p_device_type, 'unknown'),
    coalesce(nullif(p_country, ''), 'unknown'),
    1
  )
  on conflict (tenant_id, day, path, referrer_domain, device_type, country)
  do update set views = public.page_view_stats.views + 1;
end $$;


--
-- Name: bump_tenant_views(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bump_tenant_views(t uuid, n integer DEFAULT 1) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.tenant_visit_counters (tenant_id, day, views)
  values (t, current_date, n)
  on conflict (tenant_id, day)
  do update set views = public.tenant_visit_counters.views + excluded.views;
end $$;


--
-- Name: can_edit_content(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_edit_content(t uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    public.is_super_admin()
    or exists (
      select 1 from public.tenant_members
      where tenant_id = t and user_id = auth.uid() and role in ('owner','admin')
    )
    or exists (
      select 1 from public.content_module_grants
      where tenant_id = t and user_id = auth.uid()
        and access_level in ('editor','approver','admin')
    )
    or public.staff_can_edit_site(t);
$$;


--
-- Name: check_page_parent(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_page_parent() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_parent_tenant uuid;
begin
  if new.parent_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and new.parent_id is not distinct from old.parent_id
     and new.tenant_id is not distinct from old.tenant_id then
    return new;
  end if;
  if new.parent_id = new.id then
    raise exception 'A page cannot be its own parent.';
  end if;
  select tenant_id into v_parent_tenant from pages where id = new.parent_id;
  if not found or v_parent_tenant is distinct from new.tenant_id then
    raise exception 'Parent and child pages must be on the same site.';
  end if;
  if tg_op = 'UPDATE' and exists (
    with recursive anc as (
      select p.parent_id from pages p where p.id = new.parent_id
      union
      select p.parent_id from pages p join anc on p.id = anc.parent_id
    )
    select 1 from anc where anc.parent_id = new.id
  ) then
    raise exception 'A page cannot be placed under one of its own sub-pages.';
  end if;
  return new;
end $$;


--
-- Name: claim_flash_quantity(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.claim_flash_quantity(item uuid, qty integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare ok boolean;
begin
  update public.flash_sale_items
     set sold = sold + qty
   where id = item
     and (quantity_limit is null or sold + qty <= quantity_limit)
  returning true into ok;
  return coalesce(ok, false);
end $$;


--
-- Name: clear_page_redirect_on_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clear_page_redirect_on_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if new.tenant_id is not null then
    delete from page_redirects where tenant_id = new.tenant_id and from_path = new.slug;
  end if;
  return new;
end $$;


--
-- Name: consume_free_build_credit(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.consume_free_build_credit(t uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  ok boolean;
begin
  update public.tenants
     set ai_free_build_credits = ai_free_build_credits - 1
   where id = t
     and ai_free_build_credits > 0;
  get diagnostics ok = row_count;
  return ok;
end $$;


--
-- Name: current_tenant_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_tenant_id() RETURNS uuid
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN nullif(current_setting('app.tenant_id', true), '')::uuid;
END;
$$;


--
-- Name: current_vendor_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_vendor_id(t uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select id from public.vendors
   where tenant_id = t and user_id = auth.uid() and status = 'approved'
   limit 1;
$$;


--
-- Name: db_audit_value(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.db_audit_value(k text, v jsonb) RETURNS jsonb
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $_$
  select case
    when v is null or v = 'null'::jsonb then null
    when k ~* '(pass|secret|token|api_?key|private|_key$|^key$|salt|hash)' then '"[redacted]"'::jsonb
    when jsonb_typeof(v) in ('object', 'array') then '"[data]"'::jsonb
    when jsonb_typeof(v) = 'string' and length(v #>> '{}') > 120 then to_jsonb(left(v #>> '{}', 120) || '...')
    else v
  end
$_$;


--
-- Name: discard_page_draft(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.discard_page_draft(p_id uuid) RETURNS TABLE(rev integer, blocks jsonb)
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
declare
  v_rows integer;
begin
  update pages set draft_blocks = null where id = p_id;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'page_not_writable';
  end if;
  return query select p.draft_rev, p.blocks from pages p where p.id = p_id;
end $$;


--
-- Name: ecommerce_on_with_products(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ecommerce_on_with_products() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  update tenants t
     set enabled_modules = coalesce(t.enabled_modules, '{}'::jsonb) || '{"ecommerce": true}'::jsonb
   where t.id = new.tenant_id
     and not (coalesce(t.enabled_modules, '{}'::jsonb) ? 'ecommerce')
     and exists (select 1 from plans p where p.id = t.plan and coalesce((p.modules->'ecommerce'->>'included')::boolean, false));
  return new;
end $$;


--
-- Name: enforce_page_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_page_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  lim int;
  cnt int;
begin
  -- Template source pages are catalogue content, not tenant site pages.
  if new.tenant_id is null or new.template_id is not null then
    return new;
  end if;

  if public.is_translated_page(new.tenant_id, new.slug, new.seo) then
    return new;
  end if;

  select t.pages_limit_override into lim from tenants t where t.id = new.tenant_id;

  if lim is null then
    select p.pages_limit into lim
      from subscriptions s
      join plans p on p.id = s.plan_id
     where s.tenant_id = new.tenant_id
     limit 1;
  end if;

  if lim is null or lim < 0 then
    return new;
  end if;

  select count(*) into cnt
    from pages pg
   where pg.tenant_id = new.tenant_id and pg.deleted_at is null
     and not public.is_translated_page(pg.tenant_id, pg.slug, pg.seo);

  if cnt >= lim then
    raise exception 'Page limit reached (% pages on this plan). Upgrade to add more.', lim
      using errcode = 'P0001';
  end if;

  return new;
end
$$;


--
-- Name: ensure_booking_defaults(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_booking_defaults(p_tenant uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  tz text;
  closed_day int;
  owner_email text;
begin
  select timezone into tz from site_settings where tenant_id = p_tenant limit 1;
  closed_day := case when tz in ('Asia/Dhaka','Asia/Dubai','Asia/Riyadh','Asia/Qatar','Asia/Kuwait','Asia/Bahrain','Asia/Muscat') then 5 else 0 end;
  select p.email into owner_email from tenants t join profiles p on p.id = t.owner_id where t.id = p_tenant;

  insert into booking_settings (tenant_id, enabled, service_name, slot_duration_mins, buffer_mins, advance_days, min_notice_hours, confirmation_mode, notify_email)
  values (p_tenant, true, 'Appointment', 60, 0, 30, 4, 'manual', owner_email)
  on conflict (tenant_id) do nothing;

  if not exists (select 1 from booking_availability where tenant_id = p_tenant) then
    insert into booking_availability (tenant_id, day_of_week, open_time, close_time, is_open)
    select p_tenant, d, '09:00', '18:00', d <> closed_day from generate_series(0, 6) d;
  end if;
end $$;


--
-- Name: experts_assign_founding(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.experts_assign_founding() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  spots int;
  taken int;
begin
  if new.founding_since is not null then return new; end if;
  select coalesce((select experts_founding_spots from public.platform_settings where id = 1), 500) into spots;
  select count(*) into taken from public.experts where founding_since is not null;
  if taken < spots then new.founding_since := now(); end if;
  return new;
end;
$$;


--
-- Name: guard_tenant_columns(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.guard_tenant_columns() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
declare
  refused text[];
begin
  if current_user not in ('anon', 'authenticated') or public.is_super_admin() then
    return new;
  end if;
  select array_agg(e.key order by e.key) into refused
    from jsonb_each(to_jsonb(new)) e
    where e.value is distinct from to_jsonb(old) -> e.key
      and e.key not in ('name', 'updated_at');
  if refused is not null then
    raise exception 'Only Passive Coder can change these site details: %', array_to_string(refused, ', ') using errcode = '42501';
  end if;
  return new;
end $$;


--
-- Name: guard_tenant_owner(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.guard_tenant_owner() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  if new.owner_id is distinct from old.owner_id and current_user in ('anon', 'authenticated') then
    raise exception 'A site''s owner only changes through a transfer' using errcode = '42501';
  end if;
  return new;
end $$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;


--
-- Name: has_content_access(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_content_access(t uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    public.is_super_admin()
    or exists (
      select 1 from public.tenant_members
      where tenant_id = t and user_id = auth.uid() and role in ('owner','admin')
    )
    or exists (
      select 1 from public.content_module_grants
      where tenant_id = t and user_id = auth.uid()
    )
    or public.staff_can_edit_site(t);
$$;


--
-- Name: import_job_list(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.import_job_list(p_tenant uuid) RETURNS TABLE(id uuid, source text, source_label text, status text, cursor integer, total integer, results jsonb, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select j.id, j.source, j.source_label, j.status, j.cursor, jsonb_array_length(j.items), j.results, j.created_at, j.updated_at
  from import_jobs j where j.tenant_id = p_tenant order by j.created_at desc limit 20;
$$;


--
-- Name: is_super_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (select 1 from public.super_admins where user_id = auth.uid());
$$;


--
-- Name: is_tenant_editor(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_tenant_editor(t uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = t and user_id = auth.uid()
      and role in ('owner','admin','editor')
  )
  or exists (
    select 1 from public.tenants tn
    join public.agents a on a.id = tn.assigned_agent_id
    where tn.id = t and a.user_id = auth.uid() and a.status = 'active'
  )
  or public.staff_can_edit_site(t);
$$;


--
-- Name: is_tenant_member(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_tenant_member(t uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = t and user_id = auth.uid()
  )
  or exists (
    select 1 from public.tenants tn
    join public.agents a on a.id = tn.assigned_agent_id
    where tn.id = t and a.user_id = auth.uid() and a.status = 'active'
  )
  or public.staff_can_edit_site(t);
$$;


--
-- Name: is_translated_page(uuid, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_translated_page(p_tenant uuid, p_slug text, p_seo jsonb) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  select coalesce(
    (p_seo->>'lang') is not null and length(p_seo->>'lang') between 2 and 5 and (
      (p_slug = p_seo->>'lang' and exists (
        select 1 from pages b
         where b.tenant_id = p_tenant and b.slug = 'home'
           and b.deleted_at is null and b.seo->>'lang' is null))
      or (p_slug like (p_seo->>'lang') || '/%' and exists (
        select 1 from pages b
         where b.tenant_id = p_tenant
           and b.slug = substr(p_slug, length(p_seo->>'lang') + 2)
           and b.deleted_at is null and b.seo->>'lang' is null))
    ),
    false)
$$;


--
-- Name: layout_writable(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.layout_writable(t uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select t is null
      or public.is_super_admin()
      or not coalesce((select layout_locked from public.tenants where id = t), false)
      or exists (select 1 from public.pc_staff where user_id = auth.uid() and status = 'active');
$$;


--
-- Name: log_db_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_db_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
declare
  watch text[] := case when tg_nargs > 0 and tg_argv[0] <> '' then string_to_array(tg_argv[0], ',') end;
  uuid_re constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  hdrs json;
  o jsonb := '{}';
  n jsonb := '{}';
  r jsonb;
  k text;
  b jsonb := '{}';
  a jsonb := '{}';
  changed text[] := '{}';
  label text;
  client text;
  why text;
  t uuid;
  target uuid;
  seen int;
  last_id uuid;
  new_id uuid;
begin
  begin
    -- Rows changed by a cascade or by another trigger belong to the change that caused them.
    if pg_trigger_depth() > 1 then return null; end if;
    -- Signed-in requests and visitors: logged by migrations 209/211, or not team actions.
    if auth.uid() is not null then return null; end if;
    if coalesce(auth.role(), '') in ('anon', 'authenticated') then return null; end if;
    hdrs := nullif(current_setting('request.headers', true), '')::json;
    if hdrs is not null and (coalesce(hdrs->>'x-pc-origin', '') <> '' or coalesce(hdrs->>'x-pc-actor', '') <> '') then
      return null;
    end if;

    if tg_op <> 'INSERT' then o := to_jsonb(old); end if;
    if tg_op <> 'DELETE' then n := to_jsonb(new); end if;
    r := case when tg_op = 'DELETE' then o else n end;

    for k in select jsonb_object_keys(r) loop
      continue when watch is not null and not (k = any(watch));
      continue when k ~ '^(id|created_at|updated_at|updated_by|last_[a-z_]*|[a-z_]*_seen[a-z_]*|ai_[a-z_]*_used[a-z_]*|ai_chat_[a-z_]*|[a-z_]*_reset_at|total_sites|total_earnings)$';
      if tg_op = 'UPDATE' then
        continue when o->k is not distinct from n->k;
        b := b || jsonb_build_object(k, db_audit_value(k, o->k));
        a := a || jsonb_build_object(k, db_audit_value(k, n->k));
      else
        continue when r->k is null or r->k = 'null'::jsonb;
        if tg_op = 'INSERT' then a := a || jsonb_build_object(k, db_audit_value(k, r->k));
        else b := b || jsonb_build_object(k, db_audit_value(k, r->k));
        end if;
      end if;
      changed := changed || k;
    end loop;
    if tg_op = 'UPDATE' and cardinality(changed) = 0 then return null; end if;

    -- A bulk change: the first 20 rows, then a count on the 20th.
    seen := coalesce(nullif(current_setting('pc.db_audit_rows', true), '')::int, 0) + 1;
    perform set_config('pc.db_audit_rows', seen::text, true);
    if seen > 20 then
      last_id := nullif(current_setting('pc.db_audit_last', true), '')::uuid;
      if last_id is not null then
        update admin_audit_log set args = jsonb_set(coalesce(args, '{}'), '{moreRows}', to_jsonb(seen - 20)) where id = last_id;
      end if;
      return null;
    end if;

    if hdrs is not null then
      label := 'Script (service key)';
      client := left(coalesce(hdrs->>'x-client-info', hdrs->>'user-agent', ''), 80);
    elsif current_setting('application_name', true) = 'pg_cron' then
      label := 'Database job (pg_cron)';
    else
      label := 'SQL (direct)';
      client := left(nullif(current_setting('application_name', true), ''), 80);
    end if;
    why := coalesce(nullif(current_setting('pc.reason', true), ''), nullif(hdrs->>'x-pc-reason', ''));

    if tg_table_name = 'tenants' then
      if (r->>'id') ~ uuid_re then t := (r->>'id')::uuid; end if;
    elsif (r->>'tenant_id') ~ uuid_re then
      t := (r->>'tenant_id')::uuid;
    end if;
    if tg_table_name = 'profiles' then
      if (r->>'id') ~ uuid_re then target := (r->>'id')::uuid; end if;
    elsif (r->>'user_id') ~ uuid_re then
      target := (r->>'user_id')::uuid;
    end if;

    insert into admin_audit_log (actor_user_id, actor_label, action, tenant_id, target_user_id, args, before, after, reason, ok, via)
    values (
      null, label, 'db.' || tg_table_name || '.' || lower(tg_op), t, target,
      jsonb_strip_nulls(jsonb_build_object(
        'table', tg_table_name, 'op', lower(tg_op),
        'id', coalesce(r->>'id', r->>'user_id', r->>'tenant_id'),
        'name', case when tg_table_name <> 'tenants' then left(coalesce(r->>'full_name', r->>'name', r->>'email', r->>'label'), 80) end,
        'changed', to_jsonb(changed),
        'client', nullif(client, '')
      )),
      nullif(b, '{}'::jsonb), nullif(a, '{}'::jsonb), left(why, 300), true, 'database'
    )
    returning id into new_id;
    perform set_config('pc.db_audit_last', new_id::text, true);
  exception when others then
    null; -- never break the write
  end;
  return null;
end $_$;


--
-- Name: log_team_action(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_team_action() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  kind text := tg_argv[0];
  label text := tg_argv[1];
  caller text;
  actor uuid;
  visitor boolean := false;
  via text := 'web';
  hdrs json;
  o jsonb := '{}';
  n jsonb := '{}';
  r jsonb;
  act text;
  t uuid;
  target uuid;
  row_id text;
  changed text[] := '{}';
  shown text[] := '{}';
  value_cols text[] := '{}';
  watch text[];
  extra jsonb := '{}';
  wait interval := interval '1 minute';
  prefix text;
  title text;
  found_id uuid;
  found_after jsonb;
  rows_recently int;
begin
  begin
    -- Rows removed by a cascade belong to the delete that caused them.
    if pg_trigger_depth() > 1 then return null; end if;

    actor := auth.uid();
    hdrs := nullif(current_setting('request.headers', true), '')::json;
    if actor is not null then
      -- The phone app writes as the user too. This only ever changes the label on their own row.
      if hdrs->>'x-pc-actor-via' = 'app' then via := 'app'; end if;
    else
      caller := coalesce(auth.role(), '');
      if caller = 'service_role' then
        actor := (hdrs->>'x-pc-actor')::uuid;
        via := coalesce(nullif(hdrs->>'x-pc-actor-via', ''), 'web');
      end if;
      if actor is null then
        if kind = 'intake' and tg_op = 'INSERT' and caller in ('service_role', 'anon') then
          visitor := true;
        else
          return null;
        end if;
      end if;
    end if;
    if not visitor
       and not exists (select 1 from super_admins where user_id = actor)
       and not exists (select 1 from pc_staff where user_id = actor) then
      return null;
    end if;

    if tg_op <> 'INSERT' then o := to_jsonb(old); end if;
    if tg_op <> 'DELETE' then n := to_jsonb(new); end if;
    r := case when tg_op = 'DELETE' then o else n end;

    if visitor then
      t := (r->>'tenant_id')::uuid;
      act := label || '.public';
      select id into found_id from admin_audit_log
        where actor_user_id is null and action = act and tenant_id is not distinct from t and created_at > now() - interval '15 minutes'
        order by created_at desc limit 1;
      if found_id is not null then
        update admin_audit_log set args = jsonb_set(coalesce(args, '{}'), '{count}', to_jsonb(coalesce((args->>'count')::int, 1) + 1)) where id = found_id;
      else
        insert into admin_audit_log (actor_user_id, action, tenant_id, args, ok, via)
        values (null, act, t, jsonb_strip_nulls(jsonb_build_object('count', 1, 'source', case when tg_table_name = 'contacts' then r->>'source' end)), true, 'visitor');
      end if;
      return null;
    end if;

    if kind = 'page' then
      prefix := case when r->>'type' = 'post' then 'post' else 'page' end;
      t := (r->>'tenant_id')::uuid;
      row_id := r->>'id';
      extra := jsonb_build_object('title', r->>'title', 'slug', r->>'slug', 'type', r->>'type');
      value_cols := array['status'];
      if tg_op = 'INSERT' then act := prefix || '.create';
      elsif tg_op = 'DELETE' then act := prefix || '.delete'; row_id := null; -- a site delete removes every page: one row a minute is enough
      else
        changed := action_changed(o, n, null, array['id','tenant_id','created_at','updated_at','draft_rev','has_draft','created_by','order_index','published_at']);
        if o->>'deleted_at' is null and n->>'deleted_at' is not null then act := prefix || '.trash';
        elsif o->>'deleted_at' is not null and n->>'deleted_at' is null then act := prefix || '.restore';
        elsif o->>'status' is distinct from n->>'status' and n->>'status' = 'published' then act := prefix || '.publish';
        elsif o->>'status' is distinct from n->>'status' and o->>'status' = 'published' then act := prefix || '.unpublish';
        elsif o->>'status' is distinct from n->>'status' then act := prefix || '.status';
        elsif (o->>'has_draft')::boolean is true and (n->>'has_draft')::boolean is false and n->>'status' = 'published' then act := prefix || '.publish_changes';
        elsif cardinality(changed) = 0 then return null;
        else act := prefix || '.edit'; wait := interval '15 minutes'; -- autosave: one row per person, page and quarter hour
        end if;
      end if;

    elsif kind = 'site' then
      t := (r->>'id')::uuid;
      extra := jsonb_build_object('siteName', r->>'name', 'site', r->>'slug');
      value_cols := array['plan','status','owner_id','slug','name','custom_domain','layout_locked','delete_scheduled_for','deletion_requested_at','demo_expires_at','trial_ends_at','assigned_staff_id','assigned_admin_id','pages_limit_override','ai_credits_purchased','client_price','reseller_partner_id','site_chat_enabled'];
      if tg_op = 'INSERT' then act := 'site.create';
      elsif tg_op = 'DELETE' then act := 'site.delete';
      else
        watch := value_cols || array['enabled_modules','site_chat_greeting','site_chat_widget','site_chat_reply_minutes','site_chat_hours','site_chat_intake','mail_host_type','mail_shortcuts_enabled','mail_shortcut_targets','support_ai_autopublish','staff_commission_override'];
        changed := action_changed(o, n, watch, null);
        if cardinality(changed) = 0 then return null; end if;
        if 'owner_id' = any(changed) then
          -- A transfer already wrote its own row with the full story.
          if exists (select 1 from admin_audit_log where actor_user_id = actor and tenant_id = t and action = 'site.transfer_ownership' and created_at > now() - interval '1 minute') then return null; end if;
          act := 'site.owner';
        elsif 'delete_scheduled_for' = any(changed) then act := case when n->>'delete_scheduled_for' is null then 'site.cancel_delete' else 'site.schedule_delete' end;
        elsif 'plan' = any(changed) then act := 'site.plan';
        elsif 'status' = any(changed) then act := 'site.status';
        elsif 'assigned_staff_id' = any(changed) or 'assigned_admin_id' = any(changed) then act := 'site.assign';
        elsif 'custom_domain' = any(changed) then act := 'site.domain';
        elsif 'layout_locked' = any(changed) then act := 'site.layout_lock';
        else act := 'site.edit';
        end if;
      end if;

    elsif kind = 'billing' then
      t := (r->>'tenant_id')::uuid;
      value_cols := array['plan_id','status','billing_cycle','amount_cents','custom_amount_cents','discount_pct','currency','payment_method','next_payment_due','current_period_end','trial_ends_at','platform_paid_until','care_plan_id','care_paid_until','care_is_free','balance_due_cents','total_paid_cents'];
      if tg_op = 'INSERT' then act := 'billing.create';
      elsif tg_op = 'DELETE' then act := 'billing.delete';
      else
        changed := action_changed(o, n, value_cols || array['notes'], null);
        if cardinality(changed) = 0 then return null; end if;
        act := case when 'plan_id' = any(changed) then 'billing.plan' when 'status' = any(changed) then 'billing.status' else 'billing.edit' end;
      end if;

    elsif kind = 'payment' then
      t := (r->>'tenant_id')::uuid;
      row_id := r->>'id';
      extra := jsonb_strip_nulls(jsonb_build_object('amountCents', r->'amount_cents', 'currency', r->>'currency', 'method', r->>'method', 'kind', r->>'kind', 'receipt', r->>'receipt_number'));
      act := case tg_table_name when 'subscription_adjustments' then 'billing.adjustment' else 'billing.payment' end || case tg_op when 'INSERT' then '' when 'DELETE' then '_delete' else '_edit' end;

    elsif kind = 'member' then
      t := (r->>'tenant_id')::uuid;
      target := (r->>'user_id')::uuid;
      row_id := r->>'user_id';
      -- Ownership moves show once, as the site's owner change.
      if o->>'role' = 'owner' or n->>'role' = 'owner' then return null; end if;
      extra := jsonb_build_object('role', r->>'role');
      if tg_op = 'INSERT' then act := 'member.add';
      elsif tg_op = 'DELETE' then act := 'member.remove';
      elsif o->>'role' is distinct from n->>'role' then act := 'member.role'; value_cols := array['role']; changed := array['role'];
      else return null;
      end if;

    elsif kind = 'staff' then
      target := (r->>'user_id')::uuid;
      row_id := r->>'user_id';
      extra := jsonb_build_object('name', r->>'full_name');
      value_cols := array['status','is_manager','display_title','commission_rate','staff_recurring_pct','one_time_pct_override','commission_type'];
      if tg_op = 'INSERT' then act := 'staff.add';
      elsif tg_op = 'DELETE' then act := 'staff.remove';
      else
        changed := action_changed(o, n, null, array['id','user_id','created_at','updated_at','total_sites','total_earnings']);
        if cardinality(changed) = 0 then return null; end if;
        act := case when 'is_manager' = any(changed) then 'staff.manager' when 'status' = any(changed) then 'staff.status' else 'staff.edit' end;
      end if;

    elsif kind = 'super_admin' then
      target := (r->>'user_id')::uuid;
      row_id := r->>'user_id';
      act := case tg_op when 'INSERT' then 'sa.add' else 'sa.remove' end;

    elsif kind = 'profile' then
      if tg_op <> 'UPDATE' or (r->>'id')::uuid = actor then return null; end if;
      target := (r->>'id')::uuid;
      row_id := r->>'id';
      extra := jsonb_build_object('email', r->>'email');
      value_cols := array['is_active','role','email_verified_at'];
      changed := action_changed(o, n, value_cols, null);
      if cardinality(changed) = 0 then return null; end if;
      act := case when 'is_active' = any(changed) then 'user.active' when 'role' = any(changed) then 'user.role' else 'user.verify' end;

    elsif kind = 'ticket' then
      t := (r->>'tenant_id')::uuid;
      row_id := r->>'id';
      extra := jsonb_build_object('subject', r->>'subject');
      value_cols := array['status','priority','assigned_to','department'];
      if tg_op = 'INSERT' then act := 'ticket.create';
      elsif tg_op = 'DELETE' then act := 'ticket.delete'; row_id := null;
      else
        changed := action_changed(o, n, value_cols, null);
        if cardinality(changed) = 0 then return null; end if;
        act := case when 'status' = any(changed) then 'ticket.status' when 'assigned_to' = any(changed) then 'ticket.assign' else 'ticket.edit' end;
      end if;

    elsif kind = 'ticket_message' then
      if tg_op <> 'INSERT' then return null; end if;
      row_id := r->>'id';
      select tenant_id, jsonb_build_object('subject', subject) into t, extra from support_tickets where id = (r->>'ticket_id')::uuid;
      act := case when (r->>'is_internal')::boolean is true then 'ticket.note' else 'ticket.reply' end;

    elsif kind = 'settings' or kind = 'platform' then
      if tg_op = 'INSERT' then return null; end if; -- created with the site
      if kind = 'settings' then t := (r->>'tenant_id')::uuid; end if;
      row_id := coalesce(r->>'id', r->>'tenant_id');
      act := kind || '.' || tg_table_name;
      if tg_op = 'DELETE' then act := act || '.delete';
      else
        -- Names only: these rows can hold keys and payment details.
        changed := action_changed(o, n, null, array['id','tenant_id','created_at','updated_at']);
        if cardinality(changed) = 0 then return null; end if;
        wait := interval '15 minutes';
      end if;

    elsif kind = 'content' or kind = 'intake' then
      t := (r->>'tenant_id')::uuid;
      row_id := r->>'id';
      -- Only a person-made connection key, a typed note or a person's reply. The rest is machinery.
      if label = 'token' and r->>'kind' is distinct from 'pat' then return null; end if;
      if label = 'lead_note' and r->>'type' is distinct from 'note' then return null; end if;
      if label = 'chat_reply' and (tg_op <> 'INSERT' or r->>'author_user_id' is null) then return null; end if;

      title := left(coalesce(r->>'title', r->>'name', r->>'display_name', r->>'customer_name', r->>'reviewer_name', r->>'product_name', r->>'original_name', r->>'order_number', r->>'code', r->>'invoice_number', r->>'domain', r->>'from_path', r->>'label', r->>'student_name', nullif(trim(concat_ws(' ', r->>'first_name', r->>'last_name')), '')), 120);
      value_cols := array['status','payment_status','delivery_status','kitchen_status','approval_status','published','listed','verification_status','price','compare_price'];

      if label = 'product_variant' then
        -- Saving a product replaces its variants: one row a quarter hour for the product.
        row_id := r->>'product_id';
        select tenant_id, name into t, title from products where id = (r->>'product_id')::uuid;
        act := 'product.variants'; wait := interval '15 minutes'; value_cols := '{}';
      elsif label = 'booking_hours' then
        -- One row per weekday on every save.
        row_id := null; title := null;
        act := 'booking_hours.edit'; wait := interval '15 minutes'; value_cols := '{}';
      elsif label = 'chat_reply' then
        row_id := r->>'conversation_id'; title := null;
        act := 'chat_reply.create'; wait := interval '15 minutes'; value_cols := '{}';
      elsif label = 'media' and tg_op = 'INSERT' then
        row_id := null; -- a batch of uploads
        act := 'media.upload'; wait := interval '5 minutes';
      elsif tg_op = 'INSERT' then act := label || '.create';
      elsif tg_op = 'DELETE' then act := label || '.delete';
      else
        changed := action_changed(o, n, null, array['id','tenant_id','created_at','updated_at','hits','last_hit_at','last_used_at','last_activity_at','sold_count','rating_avg','rating_count','used_count','reminder_sent_at','reminded_at','read','sort_order','order_index','token_hash']);
        if cardinality(changed) = 0 then return null; end if;
        if changed && array['status','payment_status','delivery_status','kitchen_status','approval_status','published','listed','verification_status'] then
          act := label || '.status';
        else
          act := label || '.edit'; wait := interval '15 minutes';
        end if;
      end if;
      extra := jsonb_strip_nulls(jsonb_build_object('title', title));

    else
      return null;
    end if;

    shown := array(select unnest(changed) intersect select unnest(value_cols));

    -- Phone app, panel route: the route already wrote this request's row. Add what
    -- changed to it, once, and write nothing more.
    if via = 'app' then
      found_id := action_app_row(actor, t);
      if found_id is not null then
        select after into found_after from admin_audit_log where id = found_id;
        if found_after is null and cardinality(shown) > 0 then
          update admin_audit_log set before = action_values(o, shown), after = action_values(n, shown), tenant_id = coalesce(tenant_id, t) where id = found_id;
        end if;
        return null;
      end if;
    end if;

    -- Skip a row that says nothing new: autosaves of one page (15 minutes), or a
    -- matching row the route wrote itself just before this change (1 minute). A
    -- recorded change with before/after never hides the next one: a plan changed
    -- twice in a minute shows twice.
    if exists (
      select 1 from admin_audit_log
      where actor_user_id = actor and action in (act, 'app.' || act) and created_at > now() - wait
        and tenant_id is not distinct from t
        and case
          when wait > interval '1 minute' then args->>'id' is not distinct from row_id
          else after is null and (args->>'id' is null or args->>'id' = row_id)
        end
    ) then
      return null;
    end if;

    -- A bulk import or a mass delete by one person doesn't fill the list.
    if kind = 'content' or kind = 'intake' then
      select count(*) into rows_recently from admin_audit_log
        where actor_user_id = actor and action = act and tenant_id is not distinct from t and created_at > now() - interval '10 minutes';
      if rows_recently >= 30 then return null; end if;
      if rows_recently = 29 then extra := extra || '{"capped": true}'::jsonb; end if;
    end if;

    insert into admin_audit_log (actor_user_id, action, tenant_id, target_user_id, args, before, after, ok, via)
    values (
      actor, act, t, target,
      jsonb_strip_nulls(extra || jsonb_build_object('id', row_id, 'changed', case when cardinality(changed) > 0 then to_jsonb(changed) end)),
      case when cardinality(shown) > 0 then action_values(o, shown) end,
      case when cardinality(shown) > 0 then action_values(n, shown) end,
      true, via
    );
  exception when others then
    null; -- never break the write
  end;
  return null;
end $$;


--
-- Name: log_team_auth_action(uuid, text, uuid, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_team_auth_action(p_actor uuid, p_action text, p_target uuid, p_args jsonb, p_via text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if not exists (select 1 from super_admins where user_id = p_actor)
     and not exists (select 1 from pc_staff where user_id = p_actor) then
    return;
  end if;
  if p_via = 'app' and action_app_row(p_actor, null) is not null then return; end if;
  insert into admin_audit_log (actor_user_id, action, target_user_id, args, ok, via)
  values (p_actor, p_action, p_target, p_args, true, coalesce(p_via, 'web'));
end $$;


--
-- Name: log_team_sign_in(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_team_sign_in() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  begin
    if (exists (select 1 from super_admins where user_id = new.user_id) or exists (select 1 from pc_staff where user_id = new.user_id))
       and not exists (select 1 from admin_audit_log where actor_user_id = new.user_id and action = 'auth.sign_in' and created_at > now() - interval '1 minute') then
      insert into admin_audit_log (actor_user_id, action, ok, via)
      values (new.user_id, 'auth.sign_in', true, case when coalesce(new.user_agent, '') ~* '(okhttp|expo|cfnetwork|reactnative)' then 'app' else 'web' end);
    end if;
  exception when others then
    null; -- never break a sign-in
  end;
  return null;
end $$;


--
-- Name: media_usage(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.media_usage(p_tenant uuid, p_url text) RETURNS TABLE(kind text, id uuid, title text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select 'page', p.id, p.title from pages p
   where p.tenant_id = p_tenant and p.deleted_at is null
     and (p.blocks::text like '%' || p_url || '%' or coalesce(p.draft_blocks::text, '') like '%' || p_url || '%'
          or coalesce(p.featured_image, '') = p_url or coalesce(p.seo::text, '') like '%' || p_url || '%')
  union all
  select 'product', pr.id, pr.name from products pr
   where pr.tenant_id = p_tenant and pr.images::text like '%' || p_url || '%'
  union all
  select 'branding', s.tenant_id, 'Logo, header or footer' from site_identity s
   where s.tenant_id = p_tenant
     and (coalesce(s.logo_url, '') = p_url or coalesce(s.logo_dark_url, '') = p_url
          or coalesce(s.global_header::text, '') like '%' || p_url || '%'
          or coalesce(s.global_footer::text, '') like '%' || p_url || '%')
  limit 50
$$;


--
-- Name: new_partner_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.new_partner_code() RETURNS text
    LANGUAGE plpgsql
    AS $$
declare c text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  loop
    c := '';
    for i in 1..7 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    exit when not exists (select 1 from partners where referral_code = c or custom_code = c);
  end loop;
  return c;
end $$;


--
-- Name: next_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.next_invoice_number() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare y int := extract(year from now())::int; seq int;
begin
  insert into public.invoice_counters(year, last_seq) values (y, 1)
    on conflict (year) do update set last_seq = public.invoice_counters.last_seq + 1
    returning last_seq into seq;
  return 'INV-' || y || '-' || lpad(seq::text, 4, '0');
end $$;


--
-- Name: next_receipt_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.next_receipt_number() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare y int := extract(year from now())::int; seq int;
begin
  insert into public.receipt_counters(year, last_seq) values (y, 1)
    on conflict (year) do update set last_seq = public.receipt_counters.last_seq + 1
    returning last_seq into seq;
  return 'R-' || y || '-' || lpad(seq::text, 4, '0');
end $$;


--
-- Name: next_sub_order_number(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.next_sub_order_number(prefix text DEFAULT 'SO'::text) RETURNS text
    LANGUAGE sql
    SET search_path TO 'public'
    AS $$
  select prefix || '-' || to_char(now(), 'YYMM') || '-' || nextval('public.sub_order_seq');
$$;


--
-- Name: owns_vendor(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.owns_vendor(v uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.vendors
     where id = v and user_id = auth.uid() and status = 'approved'
  );
$$;


--
-- Name: pages_bump_draft_rev(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pages_bump_draft_rev() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if new.blocks is distinct from old.blocks
     or new.draft_blocks is distinct from old.draft_blocks then
    if new.blocks is distinct from old.blocks
       and new.draft_blocks is not distinct from old.draft_blocks then
      new.draft_blocks := null;
    end if;
    new.draft_rev := old.draft_rev + 1;
  end if;
  return new;
end $$;


--
-- Name: prune_old_page_snapshots(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prune_old_page_snapshots() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  delete from page_snapshots
   where page_id = new.page_id
     and kind = new.kind
     and id not in (
       select id from page_snapshots
        where page_id = new.page_id and kind = new.kind
        order by created_at desc
        limit 20
     );
  return new;
end $$;


--
-- Name: prune_page_view_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prune_page_view_stats() RETURNS void
    LANGUAGE sql
    AS $$
  delete from public.page_view_stats where day < current_date - interval '400 days';
$$;


--
-- Name: publish_due_scheduled(uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.publish_due_scheduled(p_tenant uuid DEFAULT NULL::uuid, p_all boolean DEFAULT false) RETURNS TABLE(tenant_id uuid, published integer)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  with flipped as (
    update pages p
       set status = 'published',
           published_at = coalesce(p.scheduled_at, now())
     where p.status = 'scheduled'
       and p.scheduled_at is not null
       and p.scheduled_at <= now()
       and p.deleted_at is null
       and (p_all or p.tenant_id is not distinct from p_tenant)
    returning p.tenant_id
  )
  select f.tenant_id, count(*)::int from flipped f group by f.tenant_id;
$$;


--
-- Name: publish_page(uuid, jsonb, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.publish_page(p_id uuid, p_blocks jsonb, p_expected_rev integer DEFAULT NULL::integer) RETURNS TABLE(rev integer, has_draft boolean)
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
declare
  v_rev integer;
  v_rows integer;
begin
  select p.draft_rev into v_rev
    from pages p where p.id = p_id for update;
  if not found then
    raise exception 'page_not_found';
  end if;
  if p_expected_rev is not null and v_rev <> p_expected_rev then
    raise exception 'page_conflict';
  end if;

  -- Tell the (SECURITY DEFINER) snapshot trigger to capture the outgoing
  -- live version even inside its 10-minute dedup window. Transaction-local,
  -- and it only affects rows this caller could update anyway (RLS gates the
  -- UPDATE below), so there's nothing to abuse.
  perform set_config('app.force_page_snapshot', 'on', true);

  update pages
     set blocks = p_blocks,
         draft_blocks = null,
         status = 'published',
         published_at = coalesce(published_at, now())
   where id = p_id;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'page_not_writable';
  end if;

  return query select p.draft_rev, false from pages p where p.id = p_id;
end $$;


--
-- Name: record_page_redirect(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_page_redirect() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if new.tenant_id is null or new.slug is not distinct from old.slug or old.slug is null then
    return new;
  end if;
  -- Point existing redirects at the new address (no chains).
  update page_redirects set to_path = new.slug where tenant_id = new.tenant_id and to_path = old.slug;
  -- The new address is a real page again: drop any redirect away from it.
  delete from page_redirects where tenant_id = new.tenant_id and from_path = new.slug;
  insert into page_redirects (tenant_id, from_path, to_path)
  values (new.tenant_id, old.slug, new.slug)
  on conflict (tenant_id, from_path) do update set to_path = excluded.to_path;
  return new;
end $$;


--
-- Name: refresh_review_aggregates(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_review_aggregates() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  p uuid := coalesce(new.product_id, old.product_id);
  v uuid := coalesce(new.vendor_id, old.vendor_id);
begin
  update public.products pr set
    rating_avg   = coalesce(s.avg, 0),
    rating_count = coalesce(s.cnt, 0)
  from (select round(avg(rating)::numeric, 2) as avg, count(*) as cnt
          from public.product_reviews
         where product_id = p and status = 'published') s
  where pr.id = p;

  if v is not null then
    update public.vendors vd set
      rating       = coalesce(s.avg, 0),
      rating_count = coalesce(s.cnt, 0)
    from (select round(avg(rating)::numeric, 2) as avg, count(*) as cnt
            from public.product_reviews
           where vendor_id = v and status = 'published') s
    where vd.id = v;
  end if;
  return null;
end $$;


--
-- Name: save_page_blocks(uuid, jsonb, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_page_blocks(p_id uuid, p_blocks jsonb, p_expected_rev integer DEFAULT NULL::integer) RETURNS TABLE(rev integer, has_draft boolean)
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
declare
  v_status text;
  v_template uuid;
  v_rev integer;
  v_live jsonb;
  v_rows integer;
begin
  select p.status, p.template_id, p.draft_rev, p.blocks
    into v_status, v_template, v_rev, v_live
    from pages p where p.id = p_id for update;
  if not found then
    raise exception 'page_not_found';
  end if;
  if p_expected_rev is not null and v_rev <> p_expected_rev then
    raise exception 'page_conflict';
  end if;

  if v_status = 'published' and v_template is null then
    -- Editing back to exactly the live content (e.g. undo) is "no draft",
    -- not a draft identical to live.
    update pages
       set draft_blocks = case when p_blocks = v_live then null else p_blocks end
     where id = p_id;
  else
    update pages set blocks = p_blocks, draft_blocks = null where id = p_id;
  end if;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'page_not_writable';
  end if;

  return query select p.draft_rev, p.draft_blocks is not null from pages p where p.id = p_id;
end $$;


--
-- Name: search_tenant_users(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_tenant_users(t uuid, q text) RETURNS TABLE(user_id uuid, full_name text, email text, role text, has_access boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select p.id, p.full_name, p.email, tm.role,
         exists (select 1 from public.content_module_grants g
                 where g.tenant_id = t and g.user_id = p.id)
  from public.tenant_members tm
  join public.profiles p on p.id = tm.user_id
  where tm.tenant_id = t
    and public.has_content_access(t)
    and (
      q is null or q = ''
      or p.email ilike '%' || q || '%'
      or coalesce(p.full_name,'') ilike '%' || q || '%'
    )
  order by p.full_name nulls last
  limit 20;
$$;


--
-- Name: set_page_parent(uuid[], uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_page_parent(p_page_ids uuid[], p_parent_id uuid DEFAULT NULL::uuid, p_own_slug text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
declare
  v_service boolean := coalesce(auth.role(), '') = 'service_role';
  v_parent pages%rowtype;
  v_page pages%rowtype;
  v_cur_parent_slug text;
  v_tenant uuid;
  v_id uuid;
  v_own text;
  v_new text;
  v_clash record;
  v_dupe text;
  v_changed jsonb := '[]'::jsonb;
begin
  if p_page_ids is null or cardinality(p_page_ids) = 0 then
    raise exception 'Choose at least one page.';
  end if;
  if p_own_slug is not null and cardinality(p_page_ids) > 1 then
    raise exception 'A new slug can only be given for one page at a time.';
  end if;

  if p_parent_id is not null then
    select * into v_parent from pages where id = p_parent_id;
    if not found or v_parent.deleted_at is not null then
      raise exception 'The parent page was not found (it may be in the trash).';
    end if;
    if v_parent.tenant_id is null then
      raise exception 'Only site pages can have a parent.';
    end if;
    if v_parent.type = 'post' then
      raise exception 'A blog post cannot be a parent page.';
    end if;
    v_tenant := v_parent.tenant_id;
  end if;

  create temp table if not exists _page_parent_tree (
    id uuid primary key, old_slug text, new_slug text
  ) on commit drop;

  foreach v_id in array p_page_ids loop
    select * into v_page from pages where id = v_id for update;
    if not found or v_page.tenant_id is null then
      raise exception 'Page not found.';
    end if;
    if v_tenant is null then
      v_tenant := v_page.tenant_id;
    elsif v_page.tenant_id <> v_tenant then
      raise exception 'Parent and child pages must be on the same site.';
    end if;
    if not v_service and not (public.can_edit_content(v_tenant) and public.layout_writable(v_tenant)) then
      raise exception 'You do not have permission to edit pages on this site.' using errcode = '42501';
    end if;
    if v_page.type = 'post' then
      raise exception 'Blog posts cannot have a parent page.';
    end if;

    if p_parent_id is not null then
      if v_page.slug = 'home' then
        raise exception 'The home page cannot be a child of another page.';
      end if;
      if v_page.id = p_parent_id or exists (
        with recursive d as (
          select c.id from pages c where c.parent_id = v_page.id
          union
          select c.id from pages c join d on c.parent_id = d.id
        )
        select 1 from d where d.id = p_parent_id
      ) then
        raise exception '"%" cannot be placed under itself or one of its own sub-pages.', v_page.title;
      end if;
    end if;

    -- Nothing to do: already at the top and no new slug.
    if p_parent_id is null and v_page.parent_id is null and p_own_slug is null then
      continue;
    end if;

    -- The page's own slug: given, or the part after its current parent's path,
    -- or the last segment.
    if p_own_slug is not null then
      v_own := lower(btrim(p_own_slug, '/ '));
      if v_own !~ '^[a-z0-9-]+(/[a-z0-9-]+)*$' then
        raise exception 'Slugs may only use lowercase letters, numbers, hyphens and "/".';
      end if;
    else
      v_cur_parent_slug := null;
      if v_page.parent_id is not null then
        select slug into v_cur_parent_slug from pages where id = v_page.parent_id;
      end if;
      if v_cur_parent_slug is not null and v_page.slug like v_cur_parent_slug || '/%' then
        v_own := substr(v_page.slug, length(v_cur_parent_slug) + 2);
      else
        v_own := regexp_replace(v_page.slug, '^.*/', '');
      end if;
    end if;
    v_new := case when p_parent_id is null then v_own else v_parent.slug || '/' || v_own end;

    -- The page and all its descendants, with their new slugs.
    truncate _page_parent_tree;
    insert into _page_parent_tree (id, old_slug, new_slug)
    with recursive tree as (
      select v_page.id as id, v_page.slug as old_slug, v_new as new_slug, 0 as depth
      union all
      select c.id, c.slug,
             t.new_slug || '/' || case when c.slug like t.old_slug || '/%'
                                       then substr(c.slug, length(t.old_slug) + 2)
                                       else regexp_replace(c.slug, '^.*/', '') end,
             t.depth + 1
      from pages c join tree t on c.parent_id = t.id
      where t.depth < 30 and c.id <> v_page.id
    )
    select distinct on (id) id, old_slug, new_slug from tree order by id, depth;

    select new_slug into v_dupe from _page_parent_tree group by new_slug having count(*) > 1 limit 1;
    if v_dupe is not null then
      raise exception 'Two pages would end up at /%. Rename one of them first.', v_dupe;
    end if;

    select t.new_slug, x.title into v_clash
      from _page_parent_tree t
      join pages x on x.tenant_id = v_tenant and x.slug = t.new_slug
     where x.id not in (select id from _page_parent_tree)
       and x.deleted_at is null and x.status <> 'archived'
     limit 1;
    if found then
      raise exception 'The address /% is already used by "%". Rename one of them first.', v_clash.new_slug, v_clash.title;
    end if;

    v_changed := v_changed || coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'old_slug', old_slug, 'new_slug', new_slug))
      from _page_parent_tree where old_slug is distinct from new_slug
    ), '[]'::jsonb);

    update pages p
       set slug = t.new_slug,
           parent_id = case when p.id = v_page.id then p_parent_id else p.parent_id end
      from _page_parent_tree t
     where p.id = t.id
       and (p.slug is distinct from t.new_slug or p.id = v_page.id);
  end loop;

  return v_changed;
end $_$;


--
-- Name: set_tenant_context(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_tenant_context(p_tenant_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM set_config('app.tenant_id', p_tenant_id::text, true);
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin new.updated_at = now(); return new; end;
$$;


--
-- Name: snapshot_page_before_blocks_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.snapshot_page_before_blocks_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  last_snapshot_at timestamptz;
begin
  -- Live content about to change.
  if new.blocks is distinct from old.blocks then
    select created_at into last_snapshot_at
      from page_snapshots
     where page_id = old.id and kind = 'live'
     order by created_at desc
     limit 1;

    if last_snapshot_at is null
       or last_snapshot_at < now() - interval '10 minutes'
       or current_setting('app.force_page_snapshot', true) = 'on' then
      insert into page_snapshots (tenant_id, page_id, blocks, title, reason, created_by, kind)
      values (old.tenant_id, old.id, old.blocks, old.title, 'edit', auth.uid(), 'live');
    end if;
  end if;

  -- Unpublished draft about to change or be thrown away. Runs after
  -- trg_pages_draft_rev (BEFORE triggers fire in name order), so a direct
  -- write to blocks that cleared the draft is visible here as new = null.
  if old.draft_blocks is not null
     and new.draft_blocks is distinct from old.draft_blocks
     -- Publish: the draft becomes the live content, nothing is lost.
     and new.blocks is distinct from old.draft_blocks then
    last_snapshot_at := null;
    select created_at into last_snapshot_at
      from page_snapshots
     where page_id = old.id and kind = 'draft'
     order by created_at desc
     limit 1;

    if new.draft_blocks is null
       or last_snapshot_at is null
       or last_snapshot_at < now() - interval '10 minutes' then
      insert into page_snapshots (tenant_id, page_id, blocks, title, reason, created_by, kind)
      values (old.tenant_id, old.id, old.draft_blocks, old.title, 'edit', auth.uid(), 'draft');
    end if;
  end if;

  return new;
end $$;


--
-- Name: staff_can_edit_site(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.staff_can_edit_site(t uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.pc_staff s
    where s.user_id = auth.uid() and s.status = 'active'
      and (s.is_manager or not exists (select 1 from public.tenants where id = t and slug = 'beta'))
  );
$$;


--
-- Name: sub_orders_vendor_guard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sub_orders_vendor_guard() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if auth.uid() is null
     or public.is_super_admin()
     or public.is_tenant_member(new.tenant_id) then
    new.updated_at := now();
    return new;
  end if;

  if public.owns_vendor(new.vendor_id) then
    if new.subtotal          is distinct from old.subtotal
    or new.shipping_cost     is distinct from old.shipping_cost
    or new.discount          is distinct from old.discount
    or new.total             is distinct from old.total
    or new.commission_rate   is distinct from old.commission_rate
    or new.commission_amount is distinct from old.commission_amount
    or new.vendor_earning    is distinct from old.vendor_earning
    or new.cod_amount        is distinct from old.cod_amount
    or new.cod_collected     is distinct from old.cod_collected
    or new.payout_id         is distinct from old.payout_id
    or new.items             is distinct from old.items
    or new.vendor_id         is distinct from old.vendor_id
    or new.order_id          is distinct from old.order_id
    then
      raise exception 'Vendors cannot modify order financials';
    end if;
    new.updated_at := now();
    return new;
  end if;

  raise exception 'Not authorised';
end;
$$;


--
-- Name: support_tickets_owner_update_guard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.support_tickets_owner_update_guard() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if is_super_admin() or coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if new.subject is distinct from old.subject
     or new.body is distinct from old.body
     or new.department is distinct from old.department
     or new.priority is distinct from old.priority
     or new.tenant_id is distinct from old.tenant_id
     or new.user_id is distinct from old.user_id
     or new.attachments is distinct from old.attachments
  then
    raise exception 'Only status may be changed by a ticket owner';
  end if;
  if new.status not in ('open', 'in_progress', 'waiting', 'resolved', 'closed') then
    raise exception 'Invalid status';
  end if;
  return new;
end;
$$;


--
-- Name: sync_subscription_demo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_subscription_demo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  -- An unpaid subscription on a demo site shows as demo.
  if new.status in ('onboarded','pending') and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    if exists (select 1 from tenants where id = new.tenant_id and demo_expires_at is not null) then
      new.status := 'demo';
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'demo' then
      update tenants set demo_expires_at = now() + interval '72 hours'
        where id = new.tenant_id and demo_expires_at is null;
    elsif new.status = 'active' then
      update tenants set demo_expires_at = null where id = new.tenant_id and demo_expires_at is not null;
    end if;
  end if;
  return new;
end $$;


--
-- Name: sync_tenant_demo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_tenant_demo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if new.demo_expires_at is not null and old.demo_expires_at is null then
    update subscriptions set status = 'demo' where tenant_id = new.id and status in ('onboarded','pending');
  elsif new.demo_expires_at is null and old.demo_expires_at is not null then
    update subscriptions set status = 'onboarded' where tenant_id = new.id and status = 'demo';
  end if;
  return new;
end $$;


--
-- Name: tenant_page_usage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tenant_page_usage(p_tenant uuid) RETURNS TABLE(page_count integer, page_limit integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare lim int;
begin
  select t.pages_limit_override into lim from tenants t where t.id = p_tenant;
  if lim is null then
    select p.pages_limit into lim from subscriptions s join plans p on p.id = s.plan_id where s.tenant_id = p_tenant limit 1;
  end if;
  return query
    select count(*)::int, lim
      from pages pg
     where pg.tenant_id = p_tenant and pg.deleted_at is null and pg.template_id is null
       and not public.is_translated_page(pg.tenant_id, pg.slug, pg.seo);
end $$;


--
-- Name: tenant_views_this_month(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tenant_views_this_month(t uuid) RETURNS integer
    LANGUAGE sql STABLE
    AS $$
  select coalesce(sum(views), 0)::int
    from public.tenant_visit_counters
   where tenant_id = t
     and day >= date_trunc('month', current_date)::date
$$;


--
-- Name: tenants_booking_defaults(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tenants_booking_defaults() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  perform ensure_booking_defaults(new.id);
  return new;
end $$;


--
-- Name: touch_contact_activity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_contact_activity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  update public.contacts
     set last_activity_at = new.created_at, updated_at = now()
   where id = new.contact_id;
  return new;
end $$;


--
-- Name: touch_subscription_dunning(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_subscription_dunning() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at := now();
  return new;
end $$;


--
-- Name: touch_tenant_business_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_tenant_business_profile() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at := now();
  return new;
end $$;


--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin new.updated_at = now(); return new; end $$;


--
-- Name: account_deletion_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_deletion_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text,
    source text DEFAULT 'web'::text NOT NULL,
    reason text,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    cancelled_at timestamp with time zone,
    completed_at timestamp with time zone,
    error text
);


--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_user_id uuid,
    action text NOT NULL,
    tenant_id uuid,
    before jsonb,
    after jsonb,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    args jsonb,
    ok boolean,
    error text,
    target_user_id uuid,
    token_id uuid,
    via text,
    actor_label text
);


--
-- Name: pc_staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pc_staff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    company text,
    website text,
    bio text,
    status text DEFAULT 'active'::text NOT NULL,
    commission_rate numeric(5,2) DEFAULT 20.00 NOT NULL,
    total_sites integer DEFAULT 0 NOT NULL,
    total_earnings numeric(10,2) DEFAULT 0.00 NOT NULL,
    referral_code text DEFAULT substr(md5((random())::text), 1, 8) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    commission_type text DEFAULT 'recurring'::text NOT NULL,
    is_staff boolean DEFAULT false NOT NULL,
    one_time_pct_override numeric(5,2),
    staff_recurring_pct numeric(5,2),
    is_manager boolean DEFAULT false NOT NULL,
    display_title text,
    CONSTRAINT agents_commission_type_check CHECK ((commission_type = ANY (ARRAY['recurring'::text, 'one_time'::text]))),
    CONSTRAINT agents_status_check CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text, 'pending'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    role text DEFAULT 'subscriber'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    bio text,
    website text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    email_verified_at timestamp with time zone,
    whatsapp_verified_at timestamp with time zone,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'editor'::text, 'author'::text, 'contributor'::text, 'subscriber'::text, 'customer'::text, 'pc_staff'::text])))
);


--
-- Name: super_admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.super_admins (
    user_id uuid NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    granted_by uuid
);


--
-- Name: tenant_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_number_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    owner_id uuid,
    plan text DEFAULT 'free'::text NOT NULL,
    status text DEFAULT 'trial'::text NOT NULL,
    custom_domain text,
    domain_status text DEFAULT 'none'::text NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    onboarding_completed boolean DEFAULT false NOT NULL,
    trial_ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    referred_by_staff_id uuid,
    assigned_staff_id uuid,
    enm_user_id integer,
    enm_tier text DEFAULT 'free'::text NOT NULL,
    tenant_number integer DEFAULT nextval('public.tenant_number_seq'::regclass),
    staff_commission_override numeric(5,2),
    staff_id uuid,
    deletion_requested_at timestamp with time zone,
    deletion_requested_by uuid,
    enabled_modules jsonb DEFAULT '{}'::jsonb NOT NULL,
    setup_wizard_completed_at timestamp with time zone,
    referred_by_agent_id uuid,
    assigned_agent_id uuid,
    ai_generations_used_this_month integer DEFAULT 0 NOT NULL,
    ai_generations_reset_at timestamp with time zone DEFAULT (date_trunc('month'::text, now()) + '1 mon'::interval) NOT NULL,
    ai_generations_purchased integer DEFAULT 0 NOT NULL,
    ai_chat_milli_used integer DEFAULT 0 NOT NULL,
    ai_chat_day_count integer DEFAULT 0 NOT NULL,
    ai_chat_day_start date,
    pages_limit_override integer,
    ai_free_build_credits integer DEFAULT 0 NOT NULL,
    ai_onboarding_build_at timestamp with time zone,
    demo_expires_at timestamp with time zone,
    demo_created_by uuid,
    demo_whatsapp text,
    ai_seo_free_used_at timestamp with time zone,
    referred_by_partner_id uuid,
    referred_at timestamp with time zone,
    reseller_partner_id uuid,
    client_price jsonb,
    trial_delete_after timestamp with time zone,
    trial_notice_stage smallint DEFAULT 0 NOT NULL,
    layout_locked boolean DEFAULT false NOT NULL,
    support_ai_autopublish boolean DEFAULT false NOT NULL,
    mail_host_type text,
    mail_shortcuts_enabled boolean DEFAULT false NOT NULL,
    mail_shortcut_targets jsonb,
    site_chat_enabled boolean DEFAULT true NOT NULL,
    site_chat_greeting text,
    site_chat_widget boolean DEFAULT false NOT NULL,
    site_chat_reply_minutes integer DEFAULT 3 NOT NULL,
    site_chat_hours jsonb,
    assigned_admin_id uuid,
    delete_scheduled_for timestamp with time zone,
    ai_credits_used_this_month integer DEFAULT 0 NOT NULL,
    ai_credits_purchased integer DEFAULT 0 NOT NULL,
    ai_credits_reset_at timestamp with time zone DEFAULT (date_trunc('month'::text, now()) + '1 mon'::interval) NOT NULL,
    site_chat_intake jsonb,
    CONSTRAINT tenants_ai_credits_purchased_check CHECK ((ai_credits_purchased >= 0)),
    CONSTRAINT tenants_ai_credits_used_this_month_check CHECK ((ai_credits_used_this_month >= 0)),
    CONSTRAINT tenants_domain_status_check CHECK ((domain_status = ANY (ARRAY['none'::text, 'pending'::text, 'active'::text, 'failed'::text]))),
    CONSTRAINT tenants_mail_host_type_check CHECK ((mail_host_type = ANY (ARRAY['cpanel'::text, 'google'::text, 'microsoft'::text]))),
    CONSTRAINT tenants_status_check CHECK ((status = ANY (ARRAY['onboarded'::text, 'active'::text, 'suspended'::text, 'cancelled'::text, 'enm_pending'::text])))
);


--
-- Name: COLUMN tenants.ai_chat_milli_used; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.ai_chat_milli_used IS 'Fractional agent-chat usage in milli-generations (1000 = one generation). Rolls into ai_generations_used_this_month when it crosses 1000.';


--
-- Name: COLUMN tenants.ai_chat_day_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.ai_chat_day_count IS 'Agent calls made during the day starting at ai_chat_day_start. Reset lazily.';


--
-- Name: COLUMN tenants.pages_limit_override; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.pages_limit_override IS 'Overrides plans.pages_limit for this tenant. NULL = use plan limit, -1 = unlimited.';


--
-- Name: COLUMN tenants.ai_free_build_credits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.ai_free_build_credits IS 'One-time signup build grant, counted in AiCoder sections (1 = 10 credits). Never refilled.';


--
-- Name: COLUMN tenants.ai_onboarding_build_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.ai_onboarding_build_at IS 'When the automatic signup build ran. Null means it has not run.';


--
-- Name: COLUMN tenants.ai_credits_used_this_month; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.ai_credits_used_this_month IS 'AI Credits drawn from the plan allowance this period. Reset lazily by lib/ai/credits.ts.';


--
-- Name: COLUMN tenants.ai_credits_purchased; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.ai_credits_purchased IS 'Top-up AI Credits. Never expire; spent after the monthly allowance.';


--
-- Name: admin_app_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_app_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    expo_token text NOT NULL,
    platform text,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    app_version text,
    device_name text,
    locale text,
    CONSTRAINT admin_app_devices_platform_check CHECK ((platform = ANY (ARRAY['android'::text, 'ios'::text])))
);


--
-- Name: admin_notification_prefs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_notification_prefs (
    user_id uuid NOT NULL,
    disabled jsonb DEFAULT '{}'::jsonb NOT NULL,
    quiet_hours jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    paused boolean DEFAULT false NOT NULL,
    site_mode text,
    selected_sites uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    human_chat_owned boolean,
    CONSTRAINT admin_notification_prefs_site_mode_check CHECK (((site_mode IS NULL) OR (site_mode = ANY (ARRAY['all'::text, 'selected'::text]))))
);


--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    dedupe_key text,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_push_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_push_tickets (
    ticket_id text NOT NULL,
    expo_token text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agent_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agent_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agent_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])))
);


--
-- Name: agent_pending_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_pending_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    tool_name text NOT NULL,
    args jsonb NOT NULL,
    human_description text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by uuid,
    CONSTRAINT agent_pending_actions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'expired'::text])))
);


--
-- Name: agents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    company text,
    website text,
    bio text,
    status text DEFAULT 'active'::text NOT NULL,
    commission_rate numeric(5,2) DEFAULT 20.00 NOT NULL,
    total_sites integer DEFAULT 0 NOT NULL,
    total_earnings numeric(10,2) DEFAULT 0.00 NOT NULL,
    referral_code text DEFAULT substr(md5((random())::text), 1, 8) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agents_status_check1 CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text, 'pending'::text])))
);


--
-- Name: ai_credit_spends; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_credit_spends (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    use_type text NOT NULL,
    credits integer NOT NULL,
    monthly_part integer DEFAULT 0 NOT NULL,
    purchased_part integer DEFAULT 0 NOT NULL,
    free_part integer DEFAULT 0 NOT NULL,
    ref text,
    detail text,
    refunded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_credit_spends_credits_check CHECK ((credits >= 0))
);


--
-- Name: ai_generation_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_generation_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    block_type text NOT NULL,
    source text DEFAULT 'quota'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_generation_log_source_check CHECK ((source = ANY (ARRAY['quota'::text, 'purchased'::text])))
);


--
-- Name: ai_generation_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_generation_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    generations integer NOT NULL,
    price_usd_cents integer NOT NULL,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    dodo_product_id text,
    dodo_product_id_sandbox text,
    credits integer,
    CONSTRAINT ai_generation_packages_credits_check CHECK ((credits > 0)),
    CONSTRAINT ai_generation_packages_generations_check CHECK ((generations > 0)),
    CONSTRAINT ai_generation_packages_price_usd_cents_check CHECK ((price_usd_cents > 0))
);


--
-- Name: backup_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    status text DEFAULT 'running'::text NOT NULL,
    storage_path text,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    backup_type text DEFAULT 'full'::text NOT NULL,
    size_bytes bigint,
    CONSTRAINT backup_runs_backup_type_check CHECK ((backup_type = ANY (ARRAY['db'::text, 'files'::text, 'full'::text]))),
    CONSTRAINT backup_runs_status_check CHECK ((status = ANY (ARRAY['running'::text, 'complete'::text, 'failed'::text])))
);


--
-- Name: backup_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_settings (
    tenant_id uuid NOT NULL,
    db_enabled boolean DEFAULT true NOT NULL,
    db_frequency text DEFAULT 'daily'::text NOT NULL,
    db_retention_count integer DEFAULT 7 NOT NULL,
    files_enabled boolean DEFAULT true NOT NULL,
    files_frequency text DEFAULT 'weekly'::text NOT NULL,
    files_retention_count integer DEFAULT 2 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT backup_settings_db_frequency_check CHECK ((db_frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text]))),
    CONSTRAINT backup_settings_db_retention_count_check CHECK (((db_retention_count >= 1) AND (db_retention_count <= 90))),
    CONSTRAINT backup_settings_files_frequency_check CHECK ((files_frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text]))),
    CONSTRAINT backup_settings_files_retention_count_check CHECK (((files_retention_count >= 1) AND (files_retention_count <= 90)))
);


--
-- Name: booking_appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    customer_name text NOT NULL,
    customer_email text,
    customer_phone text,
    message text,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    reminder_sent_at timestamp with time zone,
    manage_token text DEFAULT encode(extensions.gen_random_bytes(16), 'hex'::text) NOT NULL,
    payment_reference text,
    deposit_status text DEFAULT 'none'::text NOT NULL,
    assigned_to uuid,
    visit_label text,
    chat_conversation_id uuid,
    CONSTRAINT booking_appointments_contact_check CHECK ((COALESCE(NULLIF(TRIM(BOTH FROM customer_email), ''::text), NULLIF(TRIM(BOTH FROM customer_phone), ''::text)) IS NOT NULL)),
    CONSTRAINT booking_appointments_deposit_status_check CHECK ((deposit_status = ANY (ARRAY['none'::text, 'due'::text, 'reported'::text, 'received'::text]))),
    CONSTRAINT booking_appointments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'no_show'::text])))
);


--
-- Name: booking_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    open_time time without time zone NOT NULL,
    close_time time without time zone NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    CONSTRAINT booking_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: booking_blocked_dates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_blocked_dates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    blocked_date date NOT NULL,
    reason text
);


--
-- Name: booking_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    service_name text DEFAULT 'Appointment'::text NOT NULL,
    slot_duration_mins integer DEFAULT 60 NOT NULL,
    buffer_mins integer DEFAULT 15 NOT NULL,
    advance_days integer DEFAULT 30 NOT NULL,
    min_notice_hours integer DEFAULT 2 NOT NULL,
    confirmation_mode text DEFAULT 'manual'::text NOT NULL,
    success_message text DEFAULT 'Your appointment request has been received!'::text NOT NULL,
    notify_email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    contact_requirement text DEFAULT 'either'::text NOT NULL,
    deposit_required boolean DEFAULT false NOT NULL,
    deposit_amount numeric(12,2),
    deposit_currency text,
    deposit_note text,
    CONSTRAINT booking_settings_confirmation_mode_check CHECK ((confirmation_mode = ANY (ARRAY['auto'::text, 'manual'::text]))),
    CONSTRAINT booking_settings_contact_requirement_check CHECK ((contact_requirement = ANY (ARRAY['either'::text, 'both'::text])))
);


--
-- Name: branch_product_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branch_product_availability (
    branch_id uuid NOT NULL,
    product_id uuid NOT NULL,
    in_stock boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: campaign_recipients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_recipients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    error text,
    sent_at timestamp with time zone,
    CONSTRAINT campaign_recipients_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'skipped'::text])))
);


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    channel text DEFAULT 'email'::text NOT NULL,
    subject text,
    body text DEFAULT ''::text NOT NULL,
    audience jsonb DEFAULT '{"all": true}'::jsonb NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    recipient_count integer DEFAULT 0 NOT NULL,
    sent_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT campaigns_channel_check CHECK ((channel = ANY (ARRAY['email'::text, 'whatsapp'::text]))),
    CONSTRAINT campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sending'::text, 'sent'::text, 'failed'::text, 'cancelled'::text])))
);


--
-- Name: care_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.care_plans (
    id text NOT NULL,
    name text NOT NULL,
    monthly_usd_cents integer NOT NULL,
    yearly_usd_cents integer NOT NULL,
    monthly_bdt integer NOT NULL,
    yearly_bdt integer NOT NULL,
    changes_per_month integer,
    pages_per_month integer DEFAULT 0 NOT NULL,
    response_hours integer NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    dodo_monthly_product_id text,
    dodo_monthly_product_id_sandbox text,
    dodo_yearly_product_id text,
    dodo_yearly_product_id_sandbox text,
    partner_monthly_bdt integer,
    partner_yearly_bdt integer,
    partner_monthly_usd_cents integer,
    partner_yearly_usd_cents integer
);


--
-- Name: care_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.care_prices (
    care_id text NOT NULL,
    currency text NOT NULL,
    monthly integer NOT NULL,
    yearly integer NOT NULL,
    partner_monthly integer,
    partner_yearly integer
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    parent_id uuid,
    type text DEFAULT 'post'::text NOT NULL,
    image_url text,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid,
    translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT categories_type_check CHECK ((type = ANY (ARRAY['post'::text, 'product'::text])))
);


--
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    product_id uuid,
    last_message text,
    last_message_at timestamp with time zone DEFAULT now() NOT NULL,
    buyer_unread integer DEFAULT 0 NOT NULL,
    vendor_unread integer DEFAULT 0 NOT NULL,
    buyer_emailed_at timestamp with time zone,
    vendor_emailed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    sender_role text NOT NULL,
    sender_id uuid,
    body text,
    image_url text,
    product_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_check CHECK (((COALESCE(length(body), 0) > 0) OR (image_url IS NOT NULL) OR (product_id IS NOT NULL))),
    CONSTRAINT chat_messages_sender_role_check CHECK ((sender_role = ANY (ARRAY['buyer'::text, 'vendor'::text])))
);


--
-- Name: collection_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collection_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    type_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    image_url text,
    parent_id uuid,
    translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: collection_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collection_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    type_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text DEFAULT ''::text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    image_url text,
    gallery jsonb DEFAULT '[]'::jsonb NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    category_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    status text DEFAULT 'published'::text NOT NULL,
    translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    seo jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT collection_entries_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);


--
-- Name: collection_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collection_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    singular text DEFAULT ''::text NOT NULL,
    icon text DEFAULT 'Layers'::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    has_detail_page boolean DEFAULT false NOT NULL,
    url_prefix text,
    template_page_id uuid,
    visibility text DEFAULT 'public'::text NOT NULL,
    sort_mode text DEFAULT 'manual'::text NOT NULL,
    show_in_sidebar boolean DEFAULT true NOT NULL,
    translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT collection_types_sort_mode_check CHECK ((sort_mode = ANY (ARRAY['manual'::text, 'newest'::text, 'title'::text]))),
    CONSTRAINT collection_types_visibility_check CHECK ((visibility = ANY (ARRAY['public'::text, 'private'::text])))
);


--
-- Name: contact_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    kind text NOT NULL,
    value text NOT NULL,
    effect text DEFAULT 'block'::text NOT NULL,
    reason text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    hits integer DEFAULT 0 NOT NULL,
    last_hit_at timestamp with time zone,
    CONSTRAINT contact_blocks_effect_check CHECK ((effect = ANY (ARRAY['block'::text, 'allow'::text]))),
    CONSTRAINT contact_blocks_kind_check CHECK ((kind = ANY (ARRAY['email'::text, 'phone'::text, 'ip'::text, 'visitor'::text])))
);


--
-- Name: contact_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    label text DEFAULT 'Main'::text NOT NULL,
    address text,
    phone text,
    whatsapp text,
    email text,
    maps_embed_url text,
    floating_whatsapp boolean DEFAULT false NOT NULL,
    floating_call boolean DEFAULT false NOT NULL,
    floating_email boolean DEFAULT false NOT NULL,
    floating_position text DEFAULT 'bottom-right'::text NOT NULL,
    floating_color text DEFAULT '#25D366'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contact_details_floating_position_check CHECK ((floating_position = ANY (ARRAY['bottom-right'::text, 'bottom-left'::text, 'top-right'::text, 'top-left'::text])))
);


--
-- Name: contact_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    actor_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contact_events_type_check CHECK ((type = ANY (ARRAY['note'::text, 'form_submission'::text, 'booking'::text, 'order'::text, 'invoice'::text, 'email'::text, 'whatsapp'::text, 'call'::text, 'stage_change'::text, 'task'::text, 'system'::text])))
);


--
-- Name: contact_form_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_form_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip text,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sender_email text,
    sender_phone text
);


--
-- Name: contact_forms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_forms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    recipient_email text,
    success_message text DEFAULT 'Thank you! We will be in touch soon.'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    first_name text,
    last_name text,
    email text,
    phone text,
    whatsapp text,
    company text,
    source text DEFAULT 'manual'::text NOT NULL,
    stage_id uuid,
    owner_user_id uuid,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    custom jsonb DEFAULT '{}'::jsonb NOT NULL,
    notes text,
    consent_email boolean DEFAULT false NOT NULL,
    consent_whatsapp boolean DEFAULT false NOT NULL,
    last_activity_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contacts_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'form'::text, 'booking'::text, 'order'::text, 'enm'::text, 'import'::text, 'api'::text, 'ai_chat'::text])))
);


--
-- Name: content_module_grants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_module_grants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    access_level text DEFAULT 'editor'::text NOT NULL,
    brand_scope uuid[],
    granted_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_module_grants_access_level_check CHECK ((access_level = ANY (ARRAY['viewer'::text, 'editor'::text, 'approver'::text, 'admin'::text])))
);


--
-- Name: courier_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courier_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    sub_order_id uuid NOT NULL,
    provider text NOT NULL,
    consignment_id text,
    status text,
    mapped_status text,
    message text,
    source text DEFAULT 'webhook'::text NOT NULL,
    event_key text,
    raw jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT courier_events_source_check CHECK ((source = ANY (ARRAY['webhook'::text, 'poll'::text, 'booking'::text, 'manual'::text])))
);


--
-- Name: crm_sequence_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_sequence_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    sequence_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    source text DEFAULT 'any'::text NOT NULL,
    vars jsonb DEFAULT '{}'::jsonb NOT NULL,
    next_step integer DEFAULT 0 NOT NULL,
    next_run_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    stop_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_sequence_runs_status_check CHECK ((status = ANY (ARRAY['active'::text, 'done'::text, 'stopped'::text])))
);


--
-- Name: crm_sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_sequences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    trigger text DEFAULT 'any'::text NOT NULL,
    steps jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_sequences_trigger_check CHECK ((trigger = ANY (ARRAY['booking'::text, 'enquiry'::text, 'order'::text, 'experts_enquiry'::text, 'any'::text])))
);


--
-- Name: crm_stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6366f1'::text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    is_won boolean DEFAULT false NOT NULL,
    is_lost boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crm_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    contact_id uuid,
    title text NOT NULL,
    due_at timestamp with time zone NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    assignee_user_id uuid,
    remind_via text DEFAULT 'email'::text NOT NULL,
    reminded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    link text,
    CONSTRAINT crm_tasks_remind_via_check CHECK ((remind_via = ANY (ARRAY['none'::text, 'email'::text, 'whatsapp'::text]))),
    CONSTRAINT crm_tasks_status_check CHECK ((status = ANY (ARRAY['open'::text, 'done'::text, 'cancelled'::text])))
);


--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    label text DEFAULT 'Home'::text NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    address_line1 text NOT NULL,
    area text,
    city text,
    postal_code text,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    lat double precision,
    lng double precision,
    district text,
    thana text
);


--
-- Name: customer_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_profiles (
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    full_name text,
    phone text,
    address_line1 text,
    address_line2 text,
    city text,
    area text,
    postal_code text,
    country text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: delivery_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_options (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(8,2) DEFAULT 0 NOT NULL,
    estimated_days text,
    is_enabled boolean DEFAULT true NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: domain_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.domain_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    domain text NOT NULL,
    logicbox_order_id bigint,
    status text DEFAULT 'pending_dns'::text NOT NULL,
    dns_type text DEFAULT 'arecord'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT domain_orders_dns_type_check CHECK ((dns_type = ANY (ARRAY['automatic'::text, 'nameserver'::text, 'arecord'::text]))),
    CONSTRAINT domain_orders_status_check CHECK ((status = ANY (ARRAY['pending_dns'::text, 'active'::text, 'failed'::text, 'expired'::text])))
);


--
-- Name: ecommerce_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecommerce_settings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    currency_symbol text DEFAULT '$'::text NOT NULL,
    currency_position text DEFAULT 'before'::text NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
    tax_inclusive boolean DEFAULT false NOT NULL,
    stock_management boolean DEFAULT true NOT NULL,
    guest_checkout boolean DEFAULT true NOT NULL,
    terms_page_id uuid,
    privacy_page_id uuid,
    success_page_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ecommerce_settings_currency_position_check CHECK ((currency_position = ANY (ARRAY['before'::text, 'after'::text])))
);


--
-- Name: email_zoho_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_zoho_connections (
    tenant_id uuid NOT NULL,
    dc text NOT NULL,
    accounts_server text NOT NULL,
    refresh_token text NOT NULL,
    zoid bigint,
    org_name text,
    connected_by uuid,
    connected_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: experts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.experts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    owner_user_id uuid,
    slug text NOT NULL,
    display_name text NOT NULL,
    headline text,
    about text,
    translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    country_code text NOT NULL,
    city_id uuid,
    phone text,
    whatsapp text,
    email text,
    website text,
    logo_url text,
    cover_url text,
    listed boolean DEFAULT false NOT NULL,
    verification_status text DEFAULT 'none'::text NOT NULL,
    verification_requested_at timestamp with time zone,
    verified_at timestamp with time zone,
    verified_by uuid,
    verification_notes text,
    docs jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    verified_paid_until timestamp with time zone,
    contact_lang text,
    lat double precision,
    lng double precision,
    source text DEFAULT 'site'::text NOT NULL,
    source_ref text,
    video_url text,
    socials jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_business boolean DEFAULT true NOT NULL,
    contact_person text,
    address text,
    years_experience integer,
    response_time text,
    starting_rate_cents integer,
    rate_unit text,
    rate_currency text DEFAULT 'USD'::text NOT NULL,
    project_minimum_cents integer,
    clients_served integer,
    availability_status text,
    cta_label text,
    cta_url text,
    skills text[] DEFAULT '{}'::text[] NOT NULL,
    industries text[] DEFAULT '{}'::text[] NOT NULL,
    certifications jsonb DEFAULT '[]'::jsonb NOT NULL,
    awards jsonb DEFAULT '[]'::jsonb NOT NULL,
    rating_avg numeric(3,2),
    rating_count integer DEFAULT 0 NOT NULL,
    founding_since timestamp with time zone,
    CONSTRAINT experts_availability_status_check CHECK (((availability_status IS NULL) OR (availability_status = ANY (ARRAY['available'::text, 'away'::text, 'busy'::text, 'vacation'::text])))),
    CONSTRAINT experts_clients_served_check CHECK (((clients_served IS NULL) OR (clients_served >= 0))),
    CONSTRAINT experts_contact_lang_check CHECK ((contact_lang = ANY (ARRAY['en'::text, 'bn'::text]))),
    CONSTRAINT experts_project_minimum_cents_check CHECK (((project_minimum_cents IS NULL) OR (project_minimum_cents >= 0))),
    CONSTRAINT experts_starting_rate_cents_check CHECK (((starting_rate_cents IS NULL) OR (starting_rate_cents >= 0))),
    CONSTRAINT experts_verification_status_check CHECK ((verification_status = ANY (ARRAY['none'::text, 'pending'::text, 'approved'::text, 'verified'::text, 'rejected'::text]))),
    CONSTRAINT experts_years_experience_check CHECK (((years_experience IS NULL) OR ((years_experience >= 0) AND (years_experience <= 80))))
);


--
-- Name: feature_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: feature_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    icon_type text DEFAULT 'lucide'::text NOT NULL,
    icon text,
    image_url text,
    link text,
    link_label text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feature_items_icon_type_check CHECK ((icon_type = ANY (ARRAY['lucide'::text, 'image'::text, 'emoji'::text])))
);


--
-- Name: flash_sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flash_sale_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    flash_sale_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    product_id uuid NOT NULL,
    sale_price numeric(12,2) NOT NULL,
    quantity_limit integer,
    sold integer DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT flash_sale_items_sale_price_check CHECK ((sale_price >= (0)::numeric))
);


--
-- Name: flash_sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flash_sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    title text DEFAULT 'Flash Sale'::text NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT flash_sales_check CHECK ((ends_at > starts_at)),
    CONSTRAINT flash_sales_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'ended'::text])))
);


--
-- Name: form_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_submissions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    form_id uuid,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: forms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forms (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: guide_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guide_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid,
    guide text NOT NULL,
    event text NOT NULL,
    step integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT guide_events_event_check CHECK ((event = ANY (ARRAY['prompt_seen'::text, 'started'::text, 'finished'::text, 'closed'::text])))
);


--
-- Name: homepage_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.homepage_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hero_headline text DEFAULT 'Beautiful Websites for Local Businesses'::text NOT NULL,
    hero_subheadline text DEFAULT 'Launch your professional website in minutes. No technical skills needed.'::text NOT NULL,
    hero_cta_text text DEFAULT 'Start Free Trial'::text NOT NULL,
    hero_cta_url text DEFAULT '/onboarding'::text NOT NULL,
    hero_secondary_cta text DEFAULT 'See Pricing'::text NOT NULL,
    stat_sites text DEFAULT '500+'::text NOT NULL,
    stat_businesses text DEFAULT '12'::text NOT NULL,
    stat_uptime text DEFAULT '99.9%'::text NOT NULL,
    testimonials jsonb DEFAULT '[]'::jsonb NOT NULL,
    faq jsonb DEFAULT '[]'::jsonb NOT NULL,
    announcement_enabled boolean DEFAULT false NOT NULL,
    announcement_text text DEFAULT ''::text NOT NULL,
    announcement_url text DEFAULT ''::text NOT NULL,
    meta_title text DEFAULT 'CMS Studio — Website Builder for Local Businesses'::text NOT NULL,
    meta_description text DEFAULT 'Professional websites for local service businesses. Easy to use, affordable, and powerful.'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cta_headline text DEFAULT ''::text NOT NULL,
    cta_subheadline text DEFAULT ''::text NOT NULL,
    features_headline text DEFAULT ''::text NOT NULL,
    features_subheadline text DEFAULT ''::text NOT NULL,
    hiw_headline text DEFAULT ''::text NOT NULL,
    hiw_subheadline text DEFAULT ''::text NOT NULL,
    testimonials_headline text DEFAULT ''::text NOT NULL,
    staff_headline text DEFAULT ''::text NOT NULL,
    staff_subheadline text DEFAULT ''::text NOT NULL,
    agent_headline text DEFAULT ''::text NOT NULL,
    agent_subheadline text DEFAULT ''::text NOT NULL,
    use_builder_pages boolean DEFAULT false NOT NULL,
    live_root_slug text
);


--
-- Name: import_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    created_by uuid,
    source text NOT NULL,
    source_label text,
    status text DEFAULT 'ready'::text NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    cursor integer DEFAULT 0 NOT NULL,
    options jsonb DEFAULT '{}'::jsonb NOT NULL,
    results jsonb DEFAULT '{"media": 0, "errors": [], "failed": 0, "created": 0, "skipped": 0}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT import_jobs_status_check CHECK ((status = ANY (ARRAY['ready'::text, 'running'::text, 'done'::text, 'failed'::text])))
);


--
-- Name: invoice_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_counters (
    year integer NOT NULL,
    last_seq integer DEFAULT 0 NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    contact_id uuid,
    invoice_number text NOT NULL,
    public_token text DEFAULT encode(extensions.gen_random_bytes(16), 'hex'::text) NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    customer_name text NOT NULL,
    customer_email text,
    customer_phone text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    tax numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    notes text,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date,
    sent_at timestamp with time zone,
    paid_at timestamp with time zone,
    payment_method text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_reference text,
    payment_reported_method text,
    payment_reported_at timestamp with time zone,
    project_id uuid,
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])))
);


--
-- Name: mcp_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcp_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_hash text NOT NULL,
    kind text NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    scope text NOT NULL,
    client_id text,
    name text,
    prefix text,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mcp_tokens_kind_check CHECK ((kind = ANY (ARRAY['access'::text, 'refresh'::text, 'pat'::text]))),
    CONSTRAINT mcp_tokens_scope_check CHECK ((scope = ANY (ARRAY['read'::text, 'write'::text])))
);


--
-- Name: media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    original_name text NOT NULL,
    url text NOT NULL,
    thumbnail_url text,
    mime_type text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    width integer,
    height integer,
    alt text,
    caption text,
    folder text DEFAULT '/'::text,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    storage_path text,
    tenant_id uuid
);


--
-- Name: media_upload_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_upload_links (
    token text NOT NULL,
    tenant_id uuid NOT NULL,
    created_by uuid,
    expires_at timestamp with time zone NOT NULL,
    uploads integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menus (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: nav_menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nav_menus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    slug text NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    location text DEFAULT 'none'::text NOT NULL,
    template_id uuid,
    CONSTRAINT nav_menus_location_check CHECK ((location = ANY (ARRAY['none'::text, 'header'::text, 'footer'::text, 'footer_secondary'::text, 'mobile'::text, 'sidebar'::text, 'legal'::text]))),
    CONSTRAINT nav_menus_owner_exclusive CHECK ((((tenant_id IS NOT NULL) AND (template_id IS NULL)) OR ((tenant_id IS NULL) AND (template_id IS NOT NULL))))
);


--
-- Name: notification_prefs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_prefs (
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    events jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: onboarding_build_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_build_jobs (
    tenant_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    total_pages integer DEFAULT 0 NOT NULL,
    pages_done integer DEFAULT 0 NOT NULL,
    current_page text,
    error text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    plan jsonb,
    facts jsonb,
    next_page_index integer DEFAULT 0 NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    locked_at timestamp with time zone,
    CONSTRAINT onboarding_build_jobs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'planning'::text, 'building'::text, 'done'::text, 'failed'::text])))
);


--
-- Name: TABLE onboarding_build_jobs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.onboarding_build_jobs IS 'Progress of the automatic AI site build kicked off at signup. One row per tenant.';


--
-- Name: COLUMN onboarding_build_jobs.plan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.onboarding_build_jobs.plan IS 'The site plan from planSite(), so a later invocation can resume without re-planning (which would also re-spend generations).';


--
-- Name: COLUMN onboarding_build_jobs.facts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.onboarding_build_jobs.facts IS 'Extracted BusinessFacts, needed by every page build and expensive to redo.';


--
-- Name: COLUMN onboarding_build_jobs.next_page_index; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.onboarding_build_jobs.next_page_index IS 'Index of the next page to build. The resume cursor.';


--
-- Name: COLUMN onboarding_build_jobs.attempts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.onboarding_build_jobs.attempts IS 'Incremented per page attempt. Caps retries so a permanently failing job cannot loop forever.';


--
-- Name: COLUMN onboarding_build_jobs.locked_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.onboarding_build_jobs.locked_at IS 'Set while a worker holds this job. A lock older than the function timeout is treated as abandoned and may be retaken.';


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    order_number text NOT NULL,
    customer_id uuid,
    customer_email text NOT NULL,
    customer_name text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    payment_method text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    billing_address jsonb DEFAULT '{}'::jsonb NOT NULL,
    shipping_address jsonb,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    shipping_cost numeric(12,2) DEFAULT 0 NOT NULL,
    tax numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    notes text,
    transaction_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid,
    vendor_id uuid,
    fulfillment_type text DEFAULT 'delivery'::text NOT NULL,
    pickup_time timestamp with time zone,
    branch_id uuid,
    table_id uuid,
    kitchen_status text,
    rider_id uuid,
    delivery_status text,
    split_group_id uuid,
    split_label text,
    voucher_codes text[] DEFAULT '{}'::text[] NOT NULL,
    payment_proof jsonb,
    flagged_reason text,
    delivery_lat double precision,
    delivery_lng double precision,
    source text,
    hub_commission_pct numeric(5,2),
    CONSTRAINT orders_delivery_status_check CHECK (((delivery_status = ANY (ARRAY['assigned'::text, 'picked_up'::text, 'delivered'::text])) OR (delivery_status IS NULL))),
    CONSTRAINT orders_fulfillment_type_check CHECK ((fulfillment_type = ANY (ARRAY['delivery'::text, 'pickup'::text, 'dine_in'::text]))),
    CONSTRAINT orders_kitchen_status_check CHECK (((kitchen_status = ANY (ARRAY['pending'::text, 'cooking'::text, 'ready'::text, 'served'::text, 'ready_to_pick'::text, 'picked_up'::text, 'completed'::text])) OR (kitchen_status IS NULL))),
    CONSTRAINT orders_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text, 'partially_refunded'::text]))),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'on_hold'::text, 'completed'::text, 'cancelled'::text, 'refunded'::text, 'failed'::text])))
);


--
-- Name: COLUMN orders.kitchen_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.kitchen_status IS 'Fulfillment-aware kitchen pipeline. Dine-in: pending->cooking->ready->served. Pickup: pending->cooking->ready_to_pick->picked_up. Delivery: pending->cooking->ready_to_pick, then delivery_status (assigned/picked_up/delivered) takes over; kitchen_status is set to completed once delivery_status reaches delivered. Null for non-restaurant orders.';


--
-- Name: COLUMN orders.delivery_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.delivery_status IS 'Delivery trip status, independent of kitchen_status. Null unless fulfillment_type=''delivery'' and a rider has been assigned.';


--
-- Name: COLUMN orders.split_group_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.split_group_id IS 'Shared id across every sub-bill produced by splitting one table''s cart (Tier 3 restaurant vertical). Null for a normal, unsplit order.';


--
-- Name: COLUMN orders.split_label; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.split_label IS 'Human label for this piece of a split bill, e.g. "Seat 1" or "Split 2 of 3". Null for a normal, unsplit order.';


--
-- Name: COLUMN orders.delivery_lat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.delivery_lat IS 'Customer map pin for a delivery order (checkout "Use my location" or dragged pin). Null when none was given.';


--
-- Name: COLUMN orders.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.source IS 'Where the order came from: food_hub = via restaurant.passivecoder.com (commission applies). Null = the store''s own customers.';


--
-- Name: page_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_categories (
    page_id uuid NOT NULL,
    category_id uuid NOT NULL
);


--
-- Name: page_redirects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_redirects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    from_path text NOT NULL,
    to_path text NOT NULL,
    hits integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    to_url text,
    status_code integer DEFAULT 301 NOT NULL,
    page_id uuid,
    note text
);


--
-- Name: page_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    page_id uuid NOT NULL,
    blocks jsonb NOT NULL,
    title text,
    reason text DEFAULT 'edit'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    kind text DEFAULT 'live'::text NOT NULL,
    CONSTRAINT page_snapshots_kind_check CHECK ((kind = ANY (ARRAY['live'::text, 'draft'::text]))),
    CONSTRAINT page_snapshots_reason_check CHECK ((reason = ANY (ARRAY['edit'::text, 'ai_edit'::text, 'restore'::text])))
);


--
-- Name: page_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_tags (
    page_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: page_view_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_view_stats (
    tenant_id uuid NOT NULL,
    day date NOT NULL,
    path text NOT NULL,
    referrer_domain text NOT NULL,
    device_type text DEFAULT 'unknown'::text NOT NULL,
    country text NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    CONSTRAINT page_view_stats_device_type_check CHECK ((device_type = ANY (ARRAY['desktop'::text, 'mobile'::text, 'tablet'::text, 'unknown'::text])))
);


--
-- Name: TABLE page_view_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.page_view_stats IS 'Own-data pageview aggregates for the dashboard analytics panel. Aggregate-only by design — no visitor id, no IP, no per-view row.';


--
-- Name: pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    type text DEFAULT 'page'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    blocks jsonb DEFAULT '[]'::jsonb NOT NULL,
    template_id uuid,
    parent_id uuid,
    featured_image text,
    excerpt text,
    seo jsonb DEFAULT '{}'::jsonb NOT NULL,
    settings jsonb DEFAULT '{"show_footer": true, "show_header": true}'::jsonb NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    published_at timestamp with time zone,
    scheduled_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid,
    deleted_at timestamp with time zone,
    draft_blocks jsonb,
    draft_rev integer DEFAULT 0 NOT NULL,
    has_draft boolean GENERATED ALWAYS AS ((draft_blocks IS NOT NULL)) STORED,
    CONSTRAINT pages_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'scheduled'::text, 'archived'::text]))),
    CONSTRAINT pages_tenant_or_template_exclusive CHECK ((NOT ((tenant_id IS NOT NULL) AND (template_id IS NOT NULL)))),
    CONSTRAINT pages_type_check CHECK ((type = ANY (ARRAY['page'::text, 'post'::text, 'landing'::text, 'portfolio'::text])))
);


--
-- Name: partner_credit_moves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_credit_moves (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_id uuid NOT NULL,
    lot_id uuid,
    kind text NOT NULL,
    currency text NOT NULL,
    amount_minor bigint NOT NULL,
    tenant_id uuid,
    subscription_id uuid,
    status text DEFAULT 'done'::text NOT NULL,
    hold_until timestamp with time zone,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT partner_credit_moves_currency_check CHECK ((currency = ANY (ARRAY['BDT'::text, 'USD'::text]))),
    CONSTRAINT partner_credit_moves_kind_check CHECK ((kind = ANY (ARRAY['reserve'::text, 'spend'::text, 'expire'::text, 'reverse'::text]))),
    CONSTRAINT partner_credit_moves_status_check CHECK ((status = ANY (ARRAY['done'::text, 'held'::text, 'released'::text])))
);


--
-- Name: partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    profession text,
    full_name text,
    company text,
    website text,
    country text,
    phone text,
    whatsapp text,
    clients_per_year text,
    message text,
    referral_code text DEFAULT public.new_partner_code() NOT NULL,
    approved_at timestamp with time zone,
    approved_by uuid,
    review_note text,
    white_label_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    billing_details text,
    contact_email text,
    brand_name text,
    brand_logo_url text,
    brand_color text,
    brand_support_email text,
    brand_support_whatsapp text,
    dashboard_domain text,
    dashboard_domain_status text DEFAULT 'none'::text NOT NULL,
    custom_code text,
    custom_code_set_at timestamp with time zone,
    CONSTRAINT partners_custom_code_format CHECK (((custom_code IS NULL) OR (custom_code ~ '^[A-Z0-9][A-Z0-9-]{2,18}[A-Z0-9]$'::text))),
    CONSTRAINT partners_dashboard_domain_status_check CHECK ((dashboard_domain_status = ANY (ARRAY['none'::text, 'pending'::text, 'active'::text]))),
    CONSTRAINT partners_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'suspended'::text]))),
    CONSTRAINT partners_type_check CHECK ((type = ANY (ARRAY['referral'::text, 'reseller'::text, 'white_label'::text])))
);


--
-- Name: payment_gateways; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_gateways (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    is_enabled boolean DEFAULT false NOT NULL,
    is_test_mode boolean DEFAULT true NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    icon text,
    supported_currencies jsonb DEFAULT '["USD"]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: plan_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_prices (
    plan_id text NOT NULL,
    currency text NOT NULL,
    dev integer NOT NULL,
    renewal integer NOT NULL,
    extra_page integer DEFAULT 0 NOT NULL,
    partner_dev integer,
    partner_renewal integer
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id text NOT NULL,
    name text NOT NULL,
    price_yearly integer NOT NULL,
    storage_gb integer NOT NULL,
    domains integer DEFAULT 1 NOT NULL,
    pages_limit integer DEFAULT '-1'::integer NOT NULL,
    support_tier text DEFAULT 'standard'::text NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    price_monthly integer DEFAULT 0 NOT NULL,
    price_lifetime integer DEFAULT 0 NOT NULL,
    visitor_limit_monthly integer DEFAULT 0 NOT NULL,
    overage_cents_per_1k integer DEFAULT 0 NOT NULL,
    price_monthly_bdt integer,
    price_yearly_bdt integer,
    modules jsonb DEFAULT '{}'::jsonb NOT NULL,
    price_yearly_bdt_regular integer,
    promo_label text,
    promo_ends_at timestamp with time zone,
    dev_price_usd_cents integer,
    dev_price_bdt integer,
    renewal_yearly_usd_cents integer,
    renewal_yearly_bdt integer,
    pages_built integer,
    extra_page_usd_cents integer,
    extra_page_bdt integer,
    free_care_plan_id text,
    free_care_months integer,
    dodo_dev_product_id text,
    dodo_dev_product_id_sandbox text,
    dodo_renewal_product_id text,
    dodo_renewal_product_id_sandbox text,
    partner_dev_price_bdt integer,
    partner_dev_price_usd_cents integer,
    partner_renewal_yearly_bdt integer,
    partner_renewal_yearly_usd_cents integer,
    partner_extra_page_bdt integer,
    partner_extra_page_usd_cents integer
);


--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_settings (
    id integer DEFAULT 1 NOT NULL,
    default_commission_rate numeric(5,2) DEFAULT 20.00 NOT NULL,
    default_commission_type text DEFAULT 'recurring'::text NOT NULL,
    staff_signup_enabled boolean DEFAULT true NOT NULL,
    staff_auto_approve boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    bkash_number text,
    nagad_number text,
    bank_details text,
    manual_payment_instructions text,
    default_staff_recurring_pct numeric(5,2) DEFAULT 10.00 NOT NULL,
    usd_to_bdt_rate numeric DEFAULT 125 NOT NULL,
    shurjopay_mode text DEFAULT 'sandbox'::text NOT NULL,
    dodo_mode text DEFAULT 'live'::text NOT NULL,
    whatsapp_number text,
    dodo_live_api_key text,
    dodo_live_webhook_secret text,
    dodo_live_product_basic_yearly text,
    dodo_live_product_pro_yearly text,
    dodo_live_product_basic_monthly text,
    dodo_live_product_pro_monthly text,
    dodo_sandbox_api_key text,
    dodo_sandbox_webhook_secret text,
    dodo_sandbox_product_basic_yearly text,
    dodo_sandbox_product_pro_yearly text,
    dodo_sandbox_product_basic_monthly text,
    dodo_sandbox_product_pro_monthly text,
    shurjopay_live_base_url text,
    shurjopay_live_username text,
    shurjopay_live_password text,
    shurjopay_live_prefix text,
    shurjopay_sandbox_username text,
    shurjopay_sandbox_password text,
    shurjopay_sandbox_prefix text,
    staff_commission_enabled boolean DEFAULT false NOT NULL,
    dodo_live_product_biz_monthly text,
    dodo_live_product_biz_yearly text,
    dodo_sandbox_product_biz_monthly text,
    dodo_sandbox_product_biz_yearly text,
    dodo_live_product_custom text,
    dodo_sandbox_product_custom text,
    experts_verified_yearly_usd_cents integer DEFAULT 4900 NOT NULL,
    experts_founding_spots integer DEFAULT 500 NOT NULL,
    manager_discount_limit_pct numeric DEFAULT 10 NOT NULL,
    panel_timezone text DEFAULT 'Asia/Dhaka'::text NOT NULL,
    CONSTRAINT dodo_mode_check CHECK ((dodo_mode = ANY (ARRAY['sandbox'::text, 'live'::text]))),
    CONSTRAINT platform_settings_default_commission_type_check CHECK ((default_commission_type = ANY (ARRAY['recurring'::text, 'one_time'::text]))),
    CONSTRAINT platform_settings_id_check CHECK ((id = 1)),
    CONSTRAINT shurjopay_mode_check CHECK ((shurjopay_mode = ANY (ARRAY['sandbox'::text, 'live'::text])))
);


--
-- Name: plugins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plugins (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    version text DEFAULT '1.0.0'::text NOT NULL,
    author text,
    is_active boolean DEFAULT false NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: portfolio_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: portfolio_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    link text,
    tags text[] DEFAULT '{}'::text[],
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: price_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    product_id uuid,
    product_name text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    quantity text,
    message text,
    status text DEFAULT 'open'::text NOT NULL,
    quoted_price numeric(12,2),
    thread jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT price_requests_status_check CHECK ((status = ANY (ARRAY['open'::text, 'quoted'::text, 'closed'::text])))
);


--
-- Name: pricing_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pricing_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price text NOT NULL,
    price_suffix text DEFAULT '/month'::text,
    is_featured boolean DEFAULT false NOT NULL,
    badge text,
    cta_label text DEFAULT 'Get Started'::text,
    cta_url text,
    features text[] DEFAULT '{}'::text[],
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pricing_tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pricing_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_option_presets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_option_presets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    option jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    product_id uuid NOT NULL,
    vendor_id uuid,
    sub_order_id uuid,
    user_id uuid,
    reviewer_name text NOT NULL,
    rating smallint NOT NULL,
    body text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    images text[] DEFAULT '{}'::text[] NOT NULL,
    seller_reply text,
    seller_replied_at timestamp with time zone,
    status text DEFAULT 'published'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewer_email text,
    verified boolean DEFAULT false NOT NULL,
    testimonial_id uuid,
    CONSTRAINT product_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT product_reviews_status_check CHECK ((status = ANY (ARRAY['published'::text, 'hidden'::text])))
);


--
-- Name: product_stock_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_stock_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    notified_at timestamp with time zone
);


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    name text NOT NULL,
    sku text,
    price numeric(12,2) NOT NULL,
    compare_price numeric(12,2),
    stock_quantity integer,
    attributes jsonb DEFAULT '{}'::jsonb NOT NULL,
    image text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    weight numeric,
    barcode text,
    images jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    short_description text,
    type text DEFAULT 'simple'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    price numeric(12,2) DEFAULT 0,
    compare_price numeric(12,2),
    cost_price numeric(12,2),
    sku text,
    barcode text,
    track_inventory boolean DEFAULT true NOT NULL,
    stock_quantity integer DEFAULT 0 NOT NULL,
    low_stock_threshold integer DEFAULT 5 NOT NULL,
    weight numeric(8,3),
    images jsonb DEFAULT '[]'::jsonb NOT NULL,
    category_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    tag_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    attributes jsonb DEFAULT '[]'::jsonb NOT NULL,
    seo jsonb DEFAULT '{}'::jsonb NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid,
    vendor_id uuid,
    approval_status text DEFAULT 'approved'::text NOT NULL,
    rejection_reason text,
    approved_at timestamp with time zone,
    brand text,
    dietary_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    rating_avg numeric(3,2) DEFAULT 0 NOT NULL,
    rating_count integer DEFAULT 0 NOT NULL,
    sold_count integer DEFAULT 0 NOT NULL,
    translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT products_approval_status_check CHECK ((approval_status = ANY (ARRAY['draft'::text, 'pending'::text, 'approved'::text, 'rejected'::text]))),
    CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['active'::text, 'draft'::text, 'archived'::text]))),
    CONSTRAINT products_type_check CHECK ((type = ANY (ARRAY['simple'::text, 'variable'::text, 'digital'::text])))
);


--
-- Name: COLUMN products.dietary_info; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.products.dietary_info IS 'Restaurant menu metadata: { spice_level?: 0-3, diet?: "veg"|"non_veg"|"vegan", tags?: string[] }';


--
-- Name: re_communities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.re_communities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    city text,
    country text,
    image_url text,
    summary text,
    description text,
    highlights text[] DEFAULT '{}'::text[] NOT NULL,
    avg_price numeric,
    currency text,
    rental_yield numeric,
    lat double precision,
    lng double precision,
    featured boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: re_developers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.re_developers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo_url text,
    description text,
    website text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: re_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.re_properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    listing_type text DEFAULT 'sale'::text NOT NULL,
    property_type text DEFAULT 'apartment'::text NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    price numeric,
    price_max numeric,
    price_period text,
    price_on_request boolean DEFAULT false NOT NULL,
    currency text DEFAULT 'SAR'::text NOT NULL,
    beds integer,
    beds_max integer,
    baths integer,
    area numeric,
    area_unit text DEFAULT 'sqm'::text NOT NULL,
    community_id uuid,
    developer_id uuid,
    city text,
    country text,
    address text,
    lat double precision,
    lng double precision,
    furnishing text,
    handover text,
    payment_plan jsonb DEFAULT '[]'::jsonb NOT NULL,
    amenities text[] DEFAULT '{}'::text[] NOT NULL,
    highlights text[] DEFAULT '{}'::text[] NOT NULL,
    images text[] DEFAULT '{}'::text[] NOT NULL,
    floor_plans text[] DEFAULT '{}'::text[] NOT NULL,
    brochure_url text,
    video_url text,
    tour_url text,
    summary text,
    description text,
    permit_number text,
    reference text,
    featured boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    seo_title text,
    seo_description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT re_properties_area_unit_check CHECK ((area_unit = ANY (ARRAY['sqm'::text, 'sqft'::text]))),
    CONSTRAINT re_properties_listing_type_check CHECK ((listing_type = ANY (ARRAY['sale'::text, 'rent'::text, 'offplan'::text]))),
    CONSTRAINT re_properties_price_period_check CHECK ((price_period = ANY (ARRAY['year'::text, 'month'::text, 'week'::text, 'day'::text]))),
    CONSTRAINT re_properties_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'available'::text, 'reserved'::text, 'sold'::text, 'rented'::text])))
);


--
-- Name: receipt_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipt_counters (
    year integer NOT NULL,
    last_seq integer DEFAULT 0 NOT NULL
);


--
-- Name: restaurant_branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restaurant_branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    kitchen_screen_enabled boolean DEFAULT true NOT NULL,
    monitor_screen_enabled boolean DEFAULT false NOT NULL,
    table_screen_enabled boolean DEFAULT false NOT NULL,
    lat double precision,
    lng double precision
);


--
-- Name: COLUMN restaurant_branches.kitchen_screen_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.restaurant_branches.kitchen_screen_enabled IS 'Staff-facing kitchen board (/dashboard/kitchen). On by default -- this is the core ops screen.';


--
-- Name: COLUMN restaurant_branches.monitor_screen_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.restaurant_branches.monitor_screen_enabled IS 'Public-facing order-number/queue display, meant for a TV/screen visible to waiting customers. Off by default -- not every restaurant has a screen to put it on.';


--
-- Name: COLUMN restaurant_branches.table_screen_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.restaurant_branches.table_screen_enabled IS 'Per-table tablet ordering, PIN-gated per table. Off by default -- requires physical tablets the restaurant may not have yet.';


--
-- Name: COLUMN restaurant_branches.lat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.restaurant_branches.lat IS 'Branch pin: rider pickup point and nearest-branch routing for web delivery orders.';


--
-- Name: restaurant_reservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restaurant_reservations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    party_size integer NOT NULL,
    reserved_at timestamp with time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT restaurant_reservations_party_size_check CHECK ((party_size > 0)),
    CONSTRAINT restaurant_reservations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'no_show'::text])))
);


--
-- Name: TABLE restaurant_reservations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.restaurant_reservations IS 'Table-ahead bookings, Tier 2 restaurant vertical. Time slot + party size only, no specific-table assignment or availability engine — staff manage by eye, same as most small restaurants do today.';


--
-- Name: restaurant_riders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restaurant_riders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    name text NOT NULL,
    phone text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    rider_token uuid DEFAULT gen_random_uuid() NOT NULL,
    last_lat double precision,
    last_lng double precision,
    last_location_at timestamp with time zone
);


--
-- Name: COLUMN restaurant_riders.rider_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.restaurant_riders.rider_token IS 'Unguessable per-rider link token for the rider PWA (/rider/[token]) — the entire access control, matching restaurant_tables.qr_token. No login: whoever holds the link can see and advance that rider''s currently-assigned deliveries.';


--
-- Name: COLUMN restaurant_riders.last_lat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.restaurant_riders.last_lat IS 'Rider''s last-known latitude, posted by the rider PWA while it has an active delivery. Null until the rider has ever shared a location.';


--
-- Name: COLUMN restaurant_riders.last_lng; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.restaurant_riders.last_lng IS 'Rider''s last-known longitude — see last_lat.';


--
-- Name: COLUMN restaurant_riders.last_location_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.restaurant_riders.last_location_at IS 'When last_lat/last_lng were captured. Staff should treat a stale timestamp (the rider''s phone went to sleep, lost signal, or closed the tab) as "unknown" rather than trusting an old pin.';


--
-- Name: restaurant_tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restaurant_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    table_number text NOT NULL,
    qr_token uuid DEFAULT gen_random_uuid() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    table_pin text
);


--
-- Name: TABLE restaurant_tables; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.restaurant_tables IS 'No public SELECT policy by design. Every legitimate read is either tenant-scoped (restaurant_tables_tenant_manage) or resolves a qr_token via the service-role client after validating it at the application layer (see /table/[qrToken] and api/ecommerce/orders) -- never expose a table row to an anonymous caller without that check.';


--
-- Name: COLUMN restaurant_tables.table_pin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.restaurant_tables.table_pin IS 'Short numeric PIN scoping a table-side tablet to this table for the TABLE screen. Null = TABLE screen not set up for this table yet. Persistent until staff changes it, not per-seating.';


--
-- Name: section_preset_saves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.section_preset_saves (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    blocks jsonb NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: service_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    icon_type text DEFAULT 'lucide'::text NOT NULL,
    icon text,
    image_url text,
    description text
);


--
-- Name: service_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: service_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    icon_type text DEFAULT 'lucide'::text NOT NULL,
    icon text,
    image_url text,
    link text,
    link_label text DEFAULT 'Learn More'::text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT service_items_icon_type_check CHECK ((icon_type = ANY (ARRAY['lucide'::text, 'image'::text, 'emoji'::text])))
);


--
-- Name: shipping_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipping_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    name_bn text,
    areas text[] DEFAULT '{}'::text[] NOT NULL,
    rate numeric(10,2) DEFAULT 0 NOT NULL,
    free_above numeric(12,2),
    cod_fee_pct numeric(5,2) DEFAULT 1.00 NOT NULL,
    eta_days text,
    is_default boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    weight_included_kg numeric(8,2) DEFAULT 1 NOT NULL,
    extra_per_kg numeric(10,2) DEFAULT 0 NOT NULL,
    zone text,
    CONSTRAINT shipping_rates_zone_chk CHECK (((zone IS NULL) OR (zone = ANY (ARRAY['same_district'::text, 'same_division'::text, 'other'::text]))))
);


--
-- Name: site_chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_chat_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    session_id text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    last_at timestamp with time zone DEFAULT now() NOT NULL,
    message_count integer DEFAULT 0 NOT NULL,
    input_tokens integer DEFAULT 0 NOT NULL,
    output_tokens integer DEFAULT 0 NOT NULL,
    cached_tokens integer DEFAULT 0 NOT NULL,
    cost_usd numeric(12,6) DEFAULT 0 NOT NULL,
    lead_contact_id uuid,
    transcript jsonb DEFAULT '[]'::jsonb NOT NULL,
    ip text,
    ai_answered boolean DEFAULT false NOT NULL,
    ai_paused boolean DEFAULT false NOT NULL,
    human_requested_at timestamp with time zone,
    agent_user_id uuid,
    agent_name text,
    status text DEFAULT 'open'::text NOT NULL,
    unread_owner integer DEFAULT 0 NOT NULL,
    last_message text,
    visitor_page text,
    visitor_country text,
    visitor_lang text,
    visitor_name text,
    chat_lang text,
    blocked_at timestamp with time zone,
    intake jsonb,
    CONSTRAINT site_chat_conversations_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);


--
-- Name: site_chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    body text NOT NULL,
    author_user_id uuid,
    author_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    meta jsonb,
    CONSTRAINT site_chat_messages_role_check CHECK ((role = ANY (ARRAY['visitor'::text, 'ai'::text, 'agent'::text, 'system'::text])))
);


--
-- Name: site_chat_monthly; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.site_chat_monthly WITH (security_invoker='true') AS
 SELECT tenant_id,
    (date_trunc('month'::text, started_at))::date AS month,
    (count(*) FILTER (WHERE ai_answered))::integer AS conversations,
    (count(*))::integer AS all_conversations,
    (COALESCE(sum(cost_usd), (0)::numeric))::numeric(12,6) AS cost_usd,
    (count(lead_contact_id))::integer AS leads
   FROM public.site_chat_conversations
  GROUP BY tenant_id, (date_trunc('month'::text, started_at));


--
-- Name: site_chat_training; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_chat_training (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    kind text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    pages integer,
    truncated boolean DEFAULT false NOT NULL,
    created_by uuid,
    source text DEFAULT 'dashboard'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT site_chat_training_kind_check CHECK ((kind = ANY (ARRAY['rule'::text, 'qa'::text, 'file'::text])))
);


--
-- Name: site_identity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_identity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    logo_url text,
    logo_dark_url text,
    logo_width integer DEFAULT 160,
    logo_alt text,
    favicon_url text,
    site_name text,
    tagline text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    active_template_slug text,
    global_header jsonb,
    global_footer jsonb,
    primary_color text,
    secondary_color text,
    logo_type text,
    global_prefooter jsonb,
    color_overrides jsonb,
    template_id uuid,
    design_overrides jsonb,
    header_studio jsonb,
    footer_studio jsonb
);


--
-- Name: COLUMN site_identity.header_studio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.site_identity.header_studio IS 'Header Studio (draft, published, history). NULL = classic global_header.';


--
-- Name: COLUMN site_identity.footer_studio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.site_identity.footer_studio IS 'Footer Studio (draft, published, history). NULL = classic global_footer.';


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    site_name text DEFAULT 'My CMS Site'::text NOT NULL,
    site_description text DEFAULT ''::text,
    site_url text DEFAULT ''::text,
    logo_url text,
    favicon_url text,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    maintenance_mode boolean DEFAULT false NOT NULL,
    meta_title text,
    meta_description text,
    analytics_code text,
    custom_css text,
    custom_js text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    site_theme text DEFAULT 'system'::text,
    tenant_id uuid,
    currency text DEFAULT 'USD'::text NOT NULL,
    currency_symbol text DEFAULT '$'::text NOT NULL,
    currency_position text DEFAULT 'before'::text NOT NULL,
    maintenance_title text,
    maintenance_message text,
    auto_translate_enabled boolean DEFAULT false NOT NULL,
    ga_measurement_id text,
    ga_property_id text,
    google_site_verification text,
    allow_ai_training boolean DEFAULT true NOT NULL,
    bing_site_verification text,
    gtm_container_id text,
    product_defaults jsonb DEFAULT '{}'::jsonb NOT NULL,
    site_languages text[] DEFAULT '{}'::text[] NOT NULL,
    meta_pixel_id text
);


--
-- Name: COLUMN site_settings.ga_measurement_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.site_settings.ga_measurement_id IS 'Tenant-owned GA4 Measurement ID (G-XXXXXXX). We inject gtag.js with this; we never read GA data back.';


--
-- Name: COLUMN site_settings.ga_property_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.site_settings.ga_property_id IS 'GA4 property id (numeric, e.g. "properties/123456789") the tenant selected after connecting — required before any report can be pulled.';


--
-- Name: site_visitor_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_visitor_pages (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    session_id text NOT NULL,
    path text NOT NULL,
    title text,
    entered_at timestamp with time zone DEFAULT now() NOT NULL,
    seconds integer DEFAULT 0 NOT NULL
);


--
-- Name: site_visitors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_visitors (
    tenant_id uuid NOT NULL,
    session_id text NOT NULL,
    first_seen timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen timestamp with time zone DEFAULT now() NOT NULL,
    visits_count integer DEFAULT 1 NOT NULL,
    country text,
    referrer text,
    current_path text,
    current_title text,
    pages_count integer DEFAULT 0 NOT NULL,
    seconds integer DEFAULT 0 NOT NULL,
    conversation_id uuid
);


--
-- Name: slider_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slider_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    auto_play boolean DEFAULT true NOT NULL,
    interval_ms integer DEFAULT 5000 NOT NULL,
    show_arrows boolean DEFAULT true NOT NULL,
    show_dots boolean DEFAULT true NOT NULL,
    height text DEFAULT '500px'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: slider_slides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slider_slides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    title text,
    subtitle text,
    description text,
    image_url text,
    button_label text,
    button_url text,
    text_color text DEFAULT '#ffffff'::text,
    "overlay" boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: spam_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spam_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    source text NOT NULL,
    reason text NOT NULL,
    sender_email text,
    sender_phone text,
    ip text,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sub_order_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sub_order_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sub_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sub_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    order_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    sub_order_number text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    shipping_cost numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    commission_rate numeric(5,2) NOT NULL,
    commission_amount numeric(12,2) DEFAULT 0 NOT NULL,
    vendor_earning numeric(12,2) DEFAULT 0 NOT NULL,
    courier text,
    tracking_number text,
    cod_amount numeric(12,2) DEFAULT 0 NOT NULL,
    cod_collected boolean DEFAULT false NOT NULL,
    payout_id uuid,
    cancel_reason text,
    accepted_at timestamp with time zone,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    platform_discount numeric(12,2) DEFAULT 0 NOT NULL,
    money_holder text,
    shipping_zone text,
    consignment_id text,
    courier_status text,
    courier_tracking_url text,
    courier_booked_at timestamp with time zone,
    courier_account_id uuid,
    courier_synced_at timestamp with time zone,
    awaiting_payment boolean DEFAULT false NOT NULL,
    courier_booking_started_at timestamp with time zone,
    CONSTRAINT sub_orders_money_holder_chk CHECK (((money_holder IS NULL) OR (money_holder = ANY (ARRAY['platform'::text, 'vendor'::text])))),
    CONSTRAINT sub_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'packed'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text, 'returned'::text])))
);


--
-- Name: subscription_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    subscription_id uuid NOT NULL,
    receipt_number text NOT NULL,
    amount_cents integer NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    orig_amount_minor bigint NOT NULL,
    fx_rate numeric(10,4),
    method text,
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    is_advance boolean DEFAULT false NOT NULL,
    note text,
    recorded_by uuid,
    emailed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    invoice_id uuid,
    CONSTRAINT subscription_payments_amount_cents_check CHECK ((amount_cents > 0)),
    CONSTRAINT subscription_payments_currency_check CHECK ((currency = ANY (ARRAY['USD'::text, 'BDT'::text])))
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    plan_id text NOT NULL,
    status text DEFAULT 'trial'::text NOT NULL,
    payment_provider text,
    trial_ends_at timestamp with time zone,
    trial_converted boolean DEFAULT false NOT NULL,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancelled_at timestamp with time zone,
    paddle_subscription_id text,
    shurjopay_order_id text,
    manual_ticket_id uuid,
    amount_cents integer,
    currency text DEFAULT 'USD'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    billing_cycle text DEFAULT 'yearly'::text NOT NULL,
    custom_amount_cents integer,
    discount_pct numeric(5,2),
    notes text,
    next_payment_due date,
    last_paid_at timestamp with time zone,
    payment_method text,
    total_billed_cents integer,
    total_paid_cents integer DEFAULT 0 NOT NULL,
    balance_due_cents integer GENERATED ALWAYS AS (GREATEST((COALESCE(total_billed_cents, 0) - total_paid_cents), 0)) STORED,
    dodo_subscription_id text,
    pending_plan_id text,
    pending_billing_cycle text,
    pending_amount_cents integer,
    pending_currency text,
    development_paid_at timestamp with time zone,
    platform_paid_until timestamp with time zone,
    care_plan_id text,
    care_cycle text,
    care_paid_until timestamp with time zone,
    care_is_free boolean DEFAULT false NOT NULL,
    pending_kind text,
    pending_care_plan_id text,
    pending_care_cycle text,
    CONSTRAINT subscriptions_care_cycle_check CHECK ((care_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text]))),
    CONSTRAINT subscriptions_payment_provider_check CHECK ((payment_provider = ANY (ARRAY['paddle'::text, 'shurjopay'::text, 'dodo'::text, 'manual'::text, 'trial'::text, 'credit'::text]))),
    CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['demo'::text, 'onboarded'::text, 'pending'::text, 'active'::text, 'past_due'::text, 'suspended'::text, 'cancelled'::text, 'expired'::text])))
);


--
-- Name: support_ticket_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_ticket_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid,
    author_name text,
    body text NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    shots jsonb DEFAULT '[]'::jsonb NOT NULL,
    media jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    user_id uuid,
    guest_name text,
    guest_email text,
    subject text NOT NULL,
    body text NOT NULL,
    department text DEFAULT 'support'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    assigned_to uuid,
    source text DEFAULT 'site_admin'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    attachments text[] DEFAULT '{}'::text[] NOT NULL,
    kind text,
    context jsonb,
    shots jsonb DEFAULT '[]'::jsonb NOT NULL,
    visibility text DEFAULT 'client'::text NOT NULL,
    media jsonb DEFAULT '[]'::jsonb NOT NULL,
    ai_state text DEFAULT 'new'::text,
    ai_category text,
    ai_note text,
    ai_attempts integer DEFAULT 0 NOT NULL,
    ai_last_run_at timestamp with time zone,
    CONSTRAINT support_tickets_department_check CHECK ((department = ANY (ARRAY['support'::text, 'sales'::text, 'billing'::text, 'general'::text]))),
    CONSTRAINT support_tickets_kind_check CHECK (((kind IS NULL) OR (kind = ANY (ARRAY['bug'::text, 'change'::text, 'question'::text])))),
    CONSTRAINT support_tickets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT support_tickets_source_check CHECK ((source = ANY (ARRAY['contact_form'::text, 'site_admin'::text, 'onboarding'::text, 'system'::text, 'capture'::text]))),
    CONSTRAINT support_tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'waiting'::text, 'resolved'::text, 'closed'::text]))),
    CONSTRAINT support_tickets_visibility_check CHECK ((visibility = ANY (ARRAY['client'::text, 'internal'::text])))
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    type text DEFAULT 'post'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tags_type_check CHECK ((type = ANY (ARRAY['post'::text, 'product'::text])))
);


--
-- Name: template_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.template_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    requested_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT template_categories_status_check CHECK ((status = ANY (ARRAY['active'::text, 'pending'::text])))
);


--
-- Name: templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    category text NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    gradient text DEFAULT ''::text NOT NULL,
    thumb_from text DEFAULT '#6366f1'::text NOT NULL,
    thumb_to text DEFAULT '#a855f7'::text NOT NULL,
    accent_color text DEFAULT '#f97316'::text NOT NULL,
    pages integer DEFAULT 4 NOT NULL,
    has_demo boolean DEFAULT false NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    badge text,
    hero_headline text DEFAULT ''::text NOT NULL,
    hero_subline text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    category_id uuid,
    owner_id uuid,
    status text DEFAULT 'draft'::text NOT NULL,
    palette jsonb,
    typography jsonb,
    custom_css text,
    logo_url text,
    favicon_url text,
    global_header jsonb,
    global_footer jsonb,
    nav_items jsonb,
    screenshot_url text,
    source_tenant_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    CONSTRAINT templates_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: tenant_alias_domains; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_alias_domains (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    domain text NOT NULL,
    tenant_id uuid NOT NULL,
    path_prefix text DEFAULT ''::text NOT NULL,
    mode text DEFAULT 'redirect'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tenant_alias_domains_mode_check CHECK ((mode = 'redirect'::text))
);


--
-- Name: tenant_api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    key_prefix text NOT NULL,
    key_hash text NOT NULL,
    scopes text[] DEFAULT '{contacts:read,contacts:write}'::text[] NOT NULL,
    last_used_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_business_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_business_profiles (
    tenant_id uuid NOT NULL,
    business_name text,
    primary_service text,
    services jsonb DEFAULT '[]'::jsonb NOT NULL,
    owner_name text,
    years_operating integer,
    customers_served integer,
    projects_completed integer,
    service_areas jsonb DEFAULT '[]'::jsonb NOT NULL,
    phone text,
    whatsapp text,
    email text,
    office_address text,
    country_code text,
    about text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    enm_profile_link text,
    city text,
    opening_hours text,
    social_links jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: TABLE tenant_business_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tenant_business_profiles IS 'One row per tenant. Feeds AiCoder generation, site contact/service blocks, and the ENM expert listing.';


--
-- Name: COLUMN tenant_business_profiles.completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant_business_profiles.completed_at IS 'Null until the wizard is finished. ENM provisioning is gated on this.';


--
-- Name: COLUMN tenant_business_profiles.social_links; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenant_business_profiles.social_links IS 'Site social profiles [{platform,url,show}] read by the top bar, footer and Social Links block.';


--
-- Name: tenant_email_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_email_settings (
    tenant_id uuid NOT NULL,
    provider text,
    dkim jsonb DEFAULT '[]'::jsonb NOT NULL,
    forwards jsonb DEFAULT '[]'::jsonb NOT NULL,
    sender_local text DEFAULT 'hello'::text NOT NULL,
    sender_name text,
    resend_domain_id text,
    sender_status text DEFAULT 'none'::text NOT NULL,
    sender_records jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    provider_verification text,
    zoho_region text DEFAULT 'com'::text NOT NULL,
    CONSTRAINT tenant_email_settings_provider_check CHECK ((provider = ANY (ARRAY['google'::text, 'microsoft'::text, 'zoho'::text, 'titan'::text, 'forwarding'::text, 'other'::text]))),
    CONSTRAINT tenant_email_settings_sender_status_check CHECK ((sender_status = ANY (ARRAY['none'::text, 'pending'::text, 'verified'::text, 'failed'::text]))),
    CONSTRAINT tenant_email_settings_zoho_region_check CHECK ((zoho_region = ANY (ARRAY['com'::text, 'in'::text, 'eu'::text, 'com.au'::text])))
);


--
-- Name: tenant_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_integrations (
    tenant_id uuid NOT NULL,
    ga_oauth_refresh_token text,
    ga_oauth_access_token text,
    ga_oauth_expires_at timestamp with time zone,
    ga_oauth_connected_email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    google_scopes text,
    gsc_site_url text,
    gsc_verified_at timestamp with time zone,
    gsc_sitemap_at timestamp with time zone,
    gsc_error text,
    gsc_index jsonb,
    bing_refresh_token text,
    bing_access_token text,
    bing_expires_at timestamp with time zone,
    bing_site_url text,
    bing_verified_at timestamp with time zone,
    bing_sitemap_at timestamp with time zone,
    bing_error text
);


--
-- Name: tenant_low_stock_notices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_low_stock_notices (
    tenant_id uuid NOT NULL,
    signature text NOT NULL,
    notified_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE tenant_low_stock_notices; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tenant_low_stock_notices IS 'Tracks the last low-stock product set an owner was emailed about, so the cron only re-notifies when the set of low items actually changes.';


--
-- Name: tenant_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_members (
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'editor'::text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    CONSTRAINT tenant_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text, 'viewer'::text])))
);


--
-- Name: tenant_ownership_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_ownership_transfers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    from_user_id uuid,
    to_user_id uuid NOT NULL,
    to_email text NOT NULL,
    performed_by uuid NOT NULL,
    account_created boolean DEFAULT false NOT NULL,
    previous_owner_action text DEFAULT 'demote'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    gateway_slug text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_template_imports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_template_imports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    template_id uuid,
    template_slug text NOT NULL,
    mode text DEFAULT 'full'::text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tenant_template_imports_mode_check CHECK ((mode = ANY (ARRAY['theme'::text, 'full'::text])))
);


--
-- Name: tenant_visit_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_visit_counters (
    tenant_id uuid NOT NULL,
    day date NOT NULL,
    views integer DEFAULT 0 NOT NULL
);


--
-- Name: TABLE tenant_visit_counters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tenant_visit_counters IS 'Daily pageview counts per tenant. Feeds the soft plan allowance; never billed.';


--
-- Name: testimonial_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonial_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    show_custom boolean DEFAULT true NOT NULL,
    show_google boolean DEFAULT false NOT NULL,
    show_trustpilot boolean DEFAULT false NOT NULL,
    show_facebook boolean DEFAULT false NOT NULL,
    google_place_id text,
    trustpilot_domain text,
    facebook_page_id text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    source text DEFAULT 'custom'::text NOT NULL,
    name text NOT NULL,
    role text,
    company text,
    avatar text,
    content text NOT NULL,
    rating integer,
    external_id text,
    published boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    avatar_url text,
    title text,
    image_url text,
    product_name text,
    product_url text,
    verified boolean DEFAULT false NOT NULL,
    source_review_id uuid,
    photos text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT testimonials_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT testimonials_source_check CHECK ((source = ANY (ARRAY['custom'::text, 'google'::text, 'trustpilot'::text, 'facebook'::text])))
);


--
-- Name: themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.themes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    author text,
    version text DEFAULT '1.0.0'::text NOT NULL,
    preview_url text,
    thumbnail text,
    is_active boolean DEFAULT false NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    description text NOT NULL,
    reference text,
    category text,
    account_id uuid,
    order_id uuid,
    customer_name text,
    customer_email text,
    message text,
    is_public boolean DEFAULT false NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid,
    CONSTRAINT transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text, 'reconciled'::text]))),
    CONSTRAINT transactions_type_check CHECK ((type = ANY (ARRAY['income'::text, 'expense'::text, 'transfer'::text, 'donation'::text, 'refund'::text])))
);


--
-- Name: vendor_courier_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_courier_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    vendor_id uuid,
    provider text NOT NULL,
    mode text DEFAULT 'live'::text NOT NULL,
    credentials jsonb DEFAULT '{}'::jsonb NOT NULL,
    store_id text,
    store_name text,
    default_delivery_type integer DEFAULT 48 NOT NULL,
    default_item_weight numeric(6,2) DEFAULT 0.5 NOT NULL,
    webhook_token text DEFAULT (replace((gen_random_uuid())::text, '-'::text, ''::text) || replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    integration_secret text,
    allow_sellers boolean DEFAULT true NOT NULL,
    active boolean DEFAULT true NOT NULL,
    access_token text,
    refresh_token text,
    token_expires_at timestamp with time zone,
    last_tested_at timestamp with time zone,
    last_test_ok boolean,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vendor_courier_accounts_mode_check CHECK ((mode = ANY (ARRAY['live'::text, 'sandbox'::text]))),
    CONSTRAINT vendor_courier_accounts_provider_check CHECK ((provider = ANY (ARRAY['steadfast'::text, 'pathao'::text])))
);


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    contact_name text,
    phone text,
    email text,
    address text,
    lat numeric(9,6),
    lng numeric(9,6),
    status text DEFAULT 'pending'::text NOT NULL,
    commission_rate numeric(5,2) DEFAULT 15.00 NOT NULL,
    user_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    capabilities text[] DEFAULT '{}'::text[] NOT NULL,
    slug text,
    logo text,
    banner text,
    description text,
    trade_license text,
    nid_number text,
    bank_account jsonb DEFAULT '{}'::jsonb NOT NULL,
    bkash_number text,
    payout_hold_days integer DEFAULT 7 NOT NULL,
    rating numeric(3,2) DEFAULT 0 NOT NULL,
    rating_count integer DEFAULT 0 NOT NULL,
    pickup_address text,
    pickup_area text,
    district text,
    thana text,
    onboarded_at timestamp with time zone,
    documents jsonb DEFAULT '{}'::jsonb NOT NULL,
    last_seen_at timestamp with time zone,
    payout_changed_at timestamp with time zone,
    CONSTRAINT vendors_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'suspended'::text, 'rejected'::text])))
);


--
-- Name: vendor_public_profiles; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vendor_public_profiles WITH (security_invoker=off) AS
 SELECT id,
    tenant_id,
    name,
    slug,
    logo,
    banner,
    description,
    rating,
    rating_count,
    pickup_area,
    created_at
   FROM public.vendors
  WHERE ((status = 'approved'::text) AND ('ecommerce'::text = ANY (capabilities)));


--
-- Name: VIEW vendor_public_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vendor_public_profiles IS 'Storefront-safe seller identity. Excludes phone, email, NID, trade licence, bank/bKash details and commission_rate.';


--
-- Name: voucher_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voucher_redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voucher_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    order_id uuid,
    customer_id uuid,
    phone text,
    amount numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vouchers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vouchers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    vendor_id uuid,
    code text NOT NULL,
    title text NOT NULL,
    kind text NOT NULL,
    value numeric(12,2) DEFAULT 0 NOT NULL,
    max_discount numeric(12,2),
    min_spend numeric(12,2) DEFAULT 0 NOT NULL,
    starts_at timestamp with time zone DEFAULT now() NOT NULL,
    ends_at timestamp with time zone,
    usage_limit integer,
    per_user_limit integer DEFAULT 1 NOT NULL,
    used_count integer DEFAULT 0 NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vouchers_kind_check CHECK ((kind = ANY (ARRAY['percent'::text, 'fixed'::text, 'free_shipping'::text]))),
    CONSTRAINT vouchers_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text])))
);


--
-- Name: web_push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.web_push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: account_deletion_requests account_deletion_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_deletion_requests
    ADD CONSTRAINT account_deletion_requests_pkey PRIMARY KEY (id);


--
-- Name: admin_app_devices admin_app_devices_expo_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_app_devices
    ADD CONSTRAINT admin_app_devices_expo_token_key UNIQUE (expo_token);


--
-- Name: admin_app_devices admin_app_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_app_devices
    ADD CONSTRAINT admin_app_devices_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: admin_notification_prefs admin_notification_prefs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notification_prefs
    ADD CONSTRAINT admin_notification_prefs_pkey PRIMARY KEY (user_id);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: admin_push_tickets admin_push_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_push_tickets
    ADD CONSTRAINT admin_push_tickets_pkey PRIMARY KEY (ticket_id);


--
-- Name: agent_conversations agent_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_conversations
    ADD CONSTRAINT agent_conversations_pkey PRIMARY KEY (id);


--
-- Name: agent_messages agent_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_messages
    ADD CONSTRAINT agent_messages_pkey PRIMARY KEY (id);


--
-- Name: agent_pending_actions agent_pending_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_pending_actions
    ADD CONSTRAINT agent_pending_actions_pkey PRIMARY KEY (id);


--
-- Name: pc_staff agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pc_staff
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: agents agents_pkey1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey1 PRIMARY KEY (id);


--
-- Name: pc_staff agents_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pc_staff
    ADD CONSTRAINT agents_referral_code_key UNIQUE (referral_code);


--
-- Name: agents agents_referral_code_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_referral_code_key1 UNIQUE (referral_code);


--
-- Name: pc_staff agents_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pc_staff
    ADD CONSTRAINT agents_user_id_key UNIQUE (user_id);


--
-- Name: agents agents_user_id_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_user_id_key1 UNIQUE (user_id);


--
-- Name: ai_credit_spends ai_credit_spends_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_credit_spends
    ADD CONSTRAINT ai_credit_spends_pkey PRIMARY KEY (id);


--
-- Name: ai_generation_log ai_generation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generation_log
    ADD CONSTRAINT ai_generation_log_pkey PRIMARY KEY (id);


--
-- Name: ai_generation_packages ai_generation_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generation_packages
    ADD CONSTRAINT ai_generation_packages_pkey PRIMARY KEY (id);


--
-- Name: backup_runs backup_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_runs
    ADD CONSTRAINT backup_runs_pkey PRIMARY KEY (id);


--
-- Name: backup_settings backup_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_settings
    ADD CONSTRAINT backup_settings_pkey PRIMARY KEY (tenant_id);


--
-- Name: booking_appointments booking_appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_appointments
    ADD CONSTRAINT booking_appointments_pkey PRIMARY KEY (id);


--
-- Name: booking_availability booking_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_availability
    ADD CONSTRAINT booking_availability_pkey PRIMARY KEY (id);


--
-- Name: booking_availability booking_availability_tenant_id_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_availability
    ADD CONSTRAINT booking_availability_tenant_id_day_of_week_key UNIQUE (tenant_id, day_of_week);


--
-- Name: booking_blocked_dates booking_blocked_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_blocked_dates
    ADD CONSTRAINT booking_blocked_dates_pkey PRIMARY KEY (id);


--
-- Name: booking_blocked_dates booking_blocked_dates_tenant_id_blocked_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_blocked_dates
    ADD CONSTRAINT booking_blocked_dates_tenant_id_blocked_date_key UNIQUE (tenant_id, blocked_date);


--
-- Name: booking_settings booking_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_settings
    ADD CONSTRAINT booking_settings_pkey PRIMARY KEY (id);


--
-- Name: booking_settings booking_settings_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_settings
    ADD CONSTRAINT booking_settings_tenant_id_key UNIQUE (tenant_id);


--
-- Name: branch_product_availability branch_product_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_product_availability
    ADD CONSTRAINT branch_product_availability_pkey PRIMARY KEY (branch_id, product_id);


--
-- Name: campaign_recipients campaign_recipients_campaign_id_contact_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_campaign_id_contact_id_key UNIQUE (campaign_id, contact_id);


--
-- Name: campaign_recipients campaign_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: care_plans care_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_pkey PRIMARY KEY (id);


--
-- Name: care_prices care_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_prices
    ADD CONSTRAINT care_prices_pkey PRIMARY KEY (care_id, currency);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: chat_conversations chat_conversations_tenant_id_vendor_id_buyer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_tenant_id_vendor_id_buyer_id_key UNIQUE (tenant_id, vendor_id, buyer_id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: collection_categories collection_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_categories
    ADD CONSTRAINT collection_categories_pkey PRIMARY KEY (id);


--
-- Name: collection_categories collection_categories_type_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_categories
    ADD CONSTRAINT collection_categories_type_id_slug_key UNIQUE (type_id, slug);


--
-- Name: collection_entries collection_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_entries
    ADD CONSTRAINT collection_entries_pkey PRIMARY KEY (id);


--
-- Name: collection_entries collection_entries_type_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_entries
    ADD CONSTRAINT collection_entries_type_id_slug_key UNIQUE (type_id, slug);


--
-- Name: collection_types collection_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_types
    ADD CONSTRAINT collection_types_pkey PRIMARY KEY (id);


--
-- Name: collection_types collection_types_tenant_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_types
    ADD CONSTRAINT collection_types_tenant_id_slug_key UNIQUE (tenant_id, slug);


--
-- Name: contact_blocks contact_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_blocks
    ADD CONSTRAINT contact_blocks_pkey PRIMARY KEY (id);


--
-- Name: contact_details contact_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_details
    ADD CONSTRAINT contact_details_pkey PRIMARY KEY (id);


--
-- Name: contact_events contact_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_events
    ADD CONSTRAINT contact_events_pkey PRIMARY KEY (id);


--
-- Name: contact_form_submissions contact_form_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_form_submissions
    ADD CONSTRAINT contact_form_submissions_pkey PRIMARY KEY (id);


--
-- Name: contact_forms contact_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_forms
    ADD CONSTRAINT contact_forms_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: content_module_grants content_module_grants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_module_grants
    ADD CONSTRAINT content_module_grants_pkey PRIMARY KEY (id);


--
-- Name: courier_events courier_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courier_events
    ADD CONSTRAINT courier_events_pkey PRIMARY KEY (id);


--
-- Name: crm_sequence_runs crm_sequence_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_sequence_runs
    ADD CONSTRAINT crm_sequence_runs_pkey PRIMARY KEY (id);


--
-- Name: crm_sequences crm_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_sequences
    ADD CONSTRAINT crm_sequences_pkey PRIMARY KEY (id);


--
-- Name: crm_stages crm_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_stages
    ADD CONSTRAINT crm_stages_pkey PRIMARY KEY (id);


--
-- Name: crm_tasks crm_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_tasks
    ADD CONSTRAINT crm_tasks_pkey PRIMARY KEY (id);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customer_profiles customer_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_profiles
    ADD CONSTRAINT customer_profiles_pkey PRIMARY KEY (tenant_id, customer_id);


--
-- Name: delivery_options delivery_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_options
    ADD CONSTRAINT delivery_options_pkey PRIMARY KEY (id);


--
-- Name: domain_orders domain_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.domain_orders
    ADD CONSTRAINT domain_orders_pkey PRIMARY KEY (id);


--
-- Name: ecommerce_settings ecommerce_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecommerce_settings
    ADD CONSTRAINT ecommerce_settings_pkey PRIMARY KEY (id);


--
-- Name: email_zoho_connections email_zoho_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_zoho_connections
    ADD CONSTRAINT email_zoho_connections_pkey PRIMARY KEY (tenant_id);


--
-- Name: experts experts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experts
    ADD CONSTRAINT experts_pkey PRIMARY KEY (id);


--
-- Name: experts experts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experts
    ADD CONSTRAINT experts_slug_key UNIQUE (slug);


--
-- Name: experts experts_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experts
    ADD CONSTRAINT experts_tenant_id_key UNIQUE (tenant_id);


--
-- Name: feature_groups feature_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_groups
    ADD CONSTRAINT feature_groups_pkey PRIMARY KEY (id);


--
-- Name: feature_items feature_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_items
    ADD CONSTRAINT feature_items_pkey PRIMARY KEY (id);


--
-- Name: flash_sale_items flash_sale_items_flash_sale_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flash_sale_items
    ADD CONSTRAINT flash_sale_items_flash_sale_id_product_id_key UNIQUE (flash_sale_id, product_id);


--
-- Name: flash_sale_items flash_sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flash_sale_items
    ADD CONSTRAINT flash_sale_items_pkey PRIMARY KEY (id);


--
-- Name: flash_sales flash_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flash_sales
    ADD CONSTRAINT flash_sales_pkey PRIMARY KEY (id);


--
-- Name: form_submissions form_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_pkey PRIMARY KEY (id);


--
-- Name: forms forms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forms
    ADD CONSTRAINT forms_pkey PRIMARY KEY (id);


--
-- Name: guide_events guide_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_events
    ADD CONSTRAINT guide_events_pkey PRIMARY KEY (id);


--
-- Name: homepage_settings homepage_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homepage_settings
    ADD CONSTRAINT homepage_settings_pkey PRIMARY KEY (id);


--
-- Name: import_jobs import_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_jobs
    ADD CONSTRAINT import_jobs_pkey PRIMARY KEY (id);


--
-- Name: invoice_counters invoice_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_counters
    ADD CONSTRAINT invoice_counters_pkey PRIMARY KEY (year);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_public_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_public_token_key UNIQUE (public_token);


--
-- Name: invoices invoices_tenant_id_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_invoice_number_key UNIQUE (tenant_id, invoice_number);


--
-- Name: mcp_tokens mcp_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_tokens
    ADD CONSTRAINT mcp_tokens_pkey PRIMARY KEY (id);


--
-- Name: mcp_tokens mcp_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_tokens
    ADD CONSTRAINT mcp_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: media_upload_links media_upload_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_upload_links
    ADD CONSTRAINT media_upload_links_pkey PRIMARY KEY (token);


--
-- Name: menus menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_pkey PRIMARY KEY (id);


--
-- Name: menus menus_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_slug_key UNIQUE (slug);


--
-- Name: nav_menus nav_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nav_menus
    ADD CONSTRAINT nav_menus_pkey PRIMARY KEY (id);


--
-- Name: notification_prefs notification_prefs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_prefs
    ADD CONSTRAINT notification_prefs_pkey PRIMARY KEY (tenant_id, user_id);


--
-- Name: onboarding_build_jobs onboarding_build_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_build_jobs
    ADD CONSTRAINT onboarding_build_jobs_pkey PRIMARY KEY (tenant_id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: page_categories page_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_categories
    ADD CONSTRAINT page_categories_pkey PRIMARY KEY (page_id, category_id);


--
-- Name: page_redirects page_redirects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_redirects
    ADD CONSTRAINT page_redirects_pkey PRIMARY KEY (id);


--
-- Name: page_redirects page_redirects_tenant_id_from_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_redirects
    ADD CONSTRAINT page_redirects_tenant_id_from_path_key UNIQUE (tenant_id, from_path);


--
-- Name: page_snapshots page_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_snapshots
    ADD CONSTRAINT page_snapshots_pkey PRIMARY KEY (id);


--
-- Name: page_tags page_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_tags
    ADD CONSTRAINT page_tags_pkey PRIMARY KEY (page_id, tag_id);


--
-- Name: page_view_stats page_view_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_view_stats
    ADD CONSTRAINT page_view_stats_pkey PRIMARY KEY (tenant_id, day, path, referrer_domain, device_type, country);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: partner_credit_moves partner_credit_moves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_credit_moves
    ADD CONSTRAINT partner_credit_moves_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: partners partners_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_referral_code_key UNIQUE (referral_code);


--
-- Name: partners partners_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_user_id_key UNIQUE (user_id);


--
-- Name: payment_gateways payment_gateways_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_gateways
    ADD CONSTRAINT payment_gateways_pkey PRIMARY KEY (id);


--
-- Name: payment_gateways payment_gateways_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_gateways
    ADD CONSTRAINT payment_gateways_slug_key UNIQUE (slug);


--
-- Name: plan_prices plan_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_prices
    ADD CONSTRAINT plan_prices_pkey PRIMARY KEY (plan_id, currency);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: plugins plugins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT plugins_pkey PRIMARY KEY (id);


--
-- Name: plugins plugins_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT plugins_slug_key UNIQUE (slug);


--
-- Name: portfolio_groups portfolio_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_groups
    ADD CONSTRAINT portfolio_groups_pkey PRIMARY KEY (id);


--
-- Name: portfolio_items portfolio_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_pkey PRIMARY KEY (id);


--
-- Name: price_requests price_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_requests
    ADD CONSTRAINT price_requests_pkey PRIMARY KEY (id);


--
-- Name: pricing_packages pricing_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_packages
    ADD CONSTRAINT pricing_packages_pkey PRIMARY KEY (id);


--
-- Name: pricing_tables pricing_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_tables
    ADD CONSTRAINT pricing_tables_pkey PRIMARY KEY (id);


--
-- Name: product_option_presets product_option_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_option_presets
    ADD CONSTRAINT product_option_presets_pkey PRIMARY KEY (id);


--
-- Name: product_reviews product_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_pkey PRIMARY KEY (id);


--
-- Name: product_reviews product_reviews_sub_order_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_sub_order_id_product_id_key UNIQUE (sub_order_id, product_id);


--
-- Name: product_stock_alerts product_stock_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_stock_alerts
    ADD CONSTRAINT product_stock_alerts_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: re_communities re_communities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.re_communities
    ADD CONSTRAINT re_communities_pkey PRIMARY KEY (id);


--
-- Name: re_communities re_communities_tenant_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.re_communities
    ADD CONSTRAINT re_communities_tenant_id_slug_key UNIQUE (tenant_id, slug);


--
-- Name: re_developers re_developers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.re_developers
    ADD CONSTRAINT re_developers_pkey PRIMARY KEY (id);


--
-- Name: re_developers re_developers_tenant_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.re_developers
    ADD CONSTRAINT re_developers_tenant_id_slug_key UNIQUE (tenant_id, slug);


--
-- Name: re_properties re_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.re_properties
    ADD CONSTRAINT re_properties_pkey PRIMARY KEY (id);


--
-- Name: re_properties re_properties_tenant_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.re_properties
    ADD CONSTRAINT re_properties_tenant_id_slug_key UNIQUE (tenant_id, slug);


--
-- Name: receipt_counters receipt_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_counters
    ADD CONSTRAINT receipt_counters_pkey PRIMARY KEY (year);


--
-- Name: restaurant_branches restaurant_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_branches
    ADD CONSTRAINT restaurant_branches_pkey PRIMARY KEY (id);


--
-- Name: restaurant_reservations restaurant_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_reservations
    ADD CONSTRAINT restaurant_reservations_pkey PRIMARY KEY (id);


--
-- Name: restaurant_riders restaurant_riders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_riders
    ADD CONSTRAINT restaurant_riders_pkey PRIMARY KEY (id);


--
-- Name: restaurant_tables restaurant_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_pkey PRIMARY KEY (id);


--
-- Name: section_preset_saves section_preset_saves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.section_preset_saves
    ADD CONSTRAINT section_preset_saves_pkey PRIMARY KEY (id);


--
-- Name: service_categories service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_pkey PRIMARY KEY (id);


--
-- Name: service_groups service_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_groups
    ADD CONSTRAINT service_groups_pkey PRIMARY KEY (id);


--
-- Name: service_items service_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_pkey PRIMARY KEY (id);


--
-- Name: shipping_rates shipping_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipping_rates
    ADD CONSTRAINT shipping_rates_pkey PRIMARY KEY (id);


--
-- Name: site_chat_conversations site_chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_chat_conversations
    ADD CONSTRAINT site_chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: site_chat_conversations site_chat_conversations_tenant_id_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_chat_conversations
    ADD CONSTRAINT site_chat_conversations_tenant_id_session_id_key UNIQUE (tenant_id, session_id);


--
-- Name: site_chat_messages site_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_chat_messages
    ADD CONSTRAINT site_chat_messages_pkey PRIMARY KEY (id);


--
-- Name: site_chat_training site_chat_training_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_chat_training
    ADD CONSTRAINT site_chat_training_pkey PRIMARY KEY (id);


--
-- Name: site_identity site_identity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_identity
    ADD CONSTRAINT site_identity_pkey PRIMARY KEY (id);


--
-- Name: site_identity site_identity_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_identity
    ADD CONSTRAINT site_identity_tenant_id_key UNIQUE (tenant_id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_tenant_id_key UNIQUE (tenant_id);


--
-- Name: site_visitor_pages site_visitor_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_visitor_pages
    ADD CONSTRAINT site_visitor_pages_pkey PRIMARY KEY (id);


--
-- Name: site_visitors site_visitors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_visitors
    ADD CONSTRAINT site_visitors_pkey PRIMARY KEY (tenant_id, session_id);


--
-- Name: slider_groups slider_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slider_groups
    ADD CONSTRAINT slider_groups_pkey PRIMARY KEY (id);


--
-- Name: slider_slides slider_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slider_slides
    ADD CONSTRAINT slider_slides_pkey PRIMARY KEY (id);


--
-- Name: spam_entries spam_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spam_entries
    ADD CONSTRAINT spam_entries_pkey PRIMARY KEY (id);


--
-- Name: sub_orders sub_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_orders
    ADD CONSTRAINT sub_orders_pkey PRIMARY KEY (id);


--
-- Name: sub_orders sub_orders_sub_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_orders
    ADD CONSTRAINT sub_orders_sub_order_number_key UNIQUE (sub_order_number);


--
-- Name: subscription_payments subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);


--
-- Name: subscription_payments subscription_payments_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_receipt_number_key UNIQUE (receipt_number);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_tenant_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_tenant_id_unique UNIQUE (tenant_id);


--
-- Name: super_admins super_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_admins
    ADD CONSTRAINT super_admins_pkey PRIMARY KEY (user_id);


--
-- Name: support_ticket_messages support_ticket_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_messages
    ADD CONSTRAINT support_ticket_messages_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tags tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_slug_key UNIQUE (slug);


--
-- Name: template_categories template_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_categories
    ADD CONSTRAINT template_categories_pkey PRIMARY KEY (id);


--
-- Name: template_categories template_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_categories
    ADD CONSTRAINT template_categories_slug_key UNIQUE (slug);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: templates templates_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_slug_key UNIQUE (slug);


--
-- Name: tenant_alias_domains tenant_alias_domains_domain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_alias_domains
    ADD CONSTRAINT tenant_alias_domains_domain_key UNIQUE (domain);


--
-- Name: tenant_alias_domains tenant_alias_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_alias_domains
    ADD CONSTRAINT tenant_alias_domains_pkey PRIMARY KEY (id);


--
-- Name: tenant_api_keys tenant_api_keys_key_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_api_keys
    ADD CONSTRAINT tenant_api_keys_key_hash_key UNIQUE (key_hash);


--
-- Name: tenant_api_keys tenant_api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_api_keys
    ADD CONSTRAINT tenant_api_keys_pkey PRIMARY KEY (id);


--
-- Name: tenant_business_profiles tenant_business_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_business_profiles
    ADD CONSTRAINT tenant_business_profiles_pkey PRIMARY KEY (tenant_id);


--
-- Name: tenant_email_settings tenant_email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_email_settings
    ADD CONSTRAINT tenant_email_settings_pkey PRIMARY KEY (tenant_id);


--
-- Name: tenant_integrations tenant_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_integrations
    ADD CONSTRAINT tenant_integrations_pkey PRIMARY KEY (tenant_id);


--
-- Name: tenant_low_stock_notices tenant_low_stock_notices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_low_stock_notices
    ADD CONSTRAINT tenant_low_stock_notices_pkey PRIMARY KEY (tenant_id);


--
-- Name: tenant_members tenant_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_members
    ADD CONSTRAINT tenant_members_pkey PRIMARY KEY (tenant_id, user_id);


--
-- Name: tenant_ownership_transfers tenant_ownership_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_ownership_transfers
    ADD CONSTRAINT tenant_ownership_transfers_pkey PRIMARY KEY (id);


--
-- Name: tenant_payment_methods tenant_payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_payment_methods
    ADD CONSTRAINT tenant_payment_methods_pkey PRIMARY KEY (id);


--
-- Name: tenant_payment_methods tenant_payment_methods_tenant_id_gateway_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_payment_methods
    ADD CONSTRAINT tenant_payment_methods_tenant_id_gateway_slug_key UNIQUE (tenant_id, gateway_slug);


--
-- Name: tenant_template_imports tenant_template_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_template_imports
    ADD CONSTRAINT tenant_template_imports_pkey PRIMARY KEY (id);


--
-- Name: tenant_visit_counters tenant_visit_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_visit_counters
    ADD CONSTRAINT tenant_visit_counters_pkey PRIMARY KEY (tenant_id, day);


--
-- Name: tenants tenants_custom_domain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_custom_domain_key UNIQUE (custom_domain);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_key UNIQUE (slug);


--
-- Name: tenants tenants_tenant_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_tenant_number_key UNIQUE (tenant_number);


--
-- Name: testimonial_groups testimonial_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonial_groups
    ADD CONSTRAINT testimonial_groups_pkey PRIMARY KEY (id);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: themes themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_pkey PRIMARY KEY (id);


--
-- Name: themes themes_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_slug_key UNIQUE (slug);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: vendor_courier_accounts vendor_courier_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_courier_accounts
    ADD CONSTRAINT vendor_courier_accounts_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: voucher_redemptions voucher_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_pkey PRIMARY KEY (id);


--
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);


--
-- Name: web_push_subscriptions web_push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_push_subscriptions
    ADD CONSTRAINT web_push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: web_push_subscriptions web_push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_push_subscriptions
    ADD CONSTRAINT web_push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);


--
-- Name: wishlist_items wishlist_items_tenant_id_customer_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_tenant_id_customer_id_product_id_key UNIQUE (tenant_id, customer_id, product_id);


--
-- Name: account_deletion_requests_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_deletion_requests_due ON public.account_deletion_requests USING btree (scheduled_for) WHERE ((cancelled_at IS NULL) AND (completed_at IS NULL));


--
-- Name: account_deletion_requests_open; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX account_deletion_requests_open ON public.account_deletion_requests USING btree (user_id) WHERE ((cancelled_at IS NULL) AND (completed_at IS NULL));


--
-- Name: admin_app_devices_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_app_devices_user_idx ON public.admin_app_devices USING btree (user_id);


--
-- Name: admin_audit_log_actor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_actor_idx ON public.admin_audit_log USING btree (actor_user_id, created_at DESC);


--
-- Name: admin_audit_log_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log USING btree (created_at DESC);


--
-- Name: admin_audit_log_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_tenant_idx ON public.admin_audit_log USING btree (tenant_id, created_at DESC);


--
-- Name: admin_audit_log_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_token_idx ON public.admin_audit_log USING btree (token_id, created_at DESC) WHERE (token_id IS NOT NULL);


--
-- Name: admin_audit_log_via_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_via_idx ON public.admin_audit_log USING btree (via, created_at DESC);


--
-- Name: admin_audit_log_visitor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_visitor_idx ON public.admin_audit_log USING btree (tenant_id, action, created_at DESC) WHERE (actor_user_id IS NULL);


--
-- Name: admin_notifications_dedupe_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admin_notifications_dedupe_idx ON public.admin_notifications USING btree (user_id, dedupe_key);


--
-- Name: admin_notifications_unread_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_notifications_unread_idx ON public.admin_notifications USING btree (user_id) WHERE (read_at IS NULL);


--
-- Name: admin_notifications_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_notifications_user_idx ON public.admin_notifications USING btree (user_id, created_at DESC);


--
-- Name: admin_push_tickets_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_push_tickets_created_idx ON public.admin_push_tickets USING btree (created_at);


--
-- Name: agent_conversations_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_conversations_tenant_idx ON public.agent_conversations USING btree (tenant_id);


--
-- Name: agent_conversations_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_conversations_user_idx ON public.agent_conversations USING btree (user_id);


--
-- Name: agent_messages_conversation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_messages_conversation_idx ON public.agent_messages USING btree (conversation_id);


--
-- Name: agent_messages_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_messages_tenant_idx ON public.agent_messages USING btree (tenant_id);


--
-- Name: agent_pending_actions_conversation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_pending_actions_conversation_idx ON public.agent_pending_actions USING btree (conversation_id);


--
-- Name: agent_pending_actions_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_pending_actions_tenant_idx ON public.agent_pending_actions USING btree (tenant_id);


--
-- Name: agents_referral_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agents_referral_code_idx ON public.pc_staff USING btree (referral_code);


--
-- Name: agents_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agents_status_idx ON public.pc_staff USING btree (status);


--
-- Name: agents_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agents_user_id_idx ON public.pc_staff USING btree (user_id);


--
-- Name: ai_credit_spends_ref_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ai_credit_spends_ref_uq ON public.ai_credit_spends USING btree (tenant_id, use_type, ref) WHERE ((ref IS NOT NULL) AND (refunded_at IS NULL));


--
-- Name: ai_credit_spends_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_credit_spends_tenant_idx ON public.ai_credit_spends USING btree (tenant_id, created_at DESC);


--
-- Name: ai_generation_log_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_generation_log_tenant_id_idx ON public.ai_generation_log USING btree (tenant_id, created_at DESC);


--
-- Name: appointments_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_status_idx ON public.booking_appointments USING btree (status);


--
-- Name: appointments_tenant_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_tenant_date_idx ON public.booking_appointments USING btree (tenant_id, date);


--
-- Name: backup_runs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX backup_runs_created_at_idx ON public.backup_runs USING btree (created_at DESC);


--
-- Name: backup_runs_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX backup_runs_tenant_id_idx ON public.backup_runs USING btree (tenant_id);


--
-- Name: booking_appointments_assigned_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX booking_appointments_assigned_idx ON public.booking_appointments USING btree (tenant_id, assigned_to) WHERE (assigned_to IS NOT NULL);


--
-- Name: booking_appointments_manage_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX booking_appointments_manage_token ON public.booking_appointments USING btree (manage_token);


--
-- Name: booking_appointments_reminder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX booking_appointments_reminder_idx ON public.booking_appointments USING btree (date, status) WHERE (reminder_sent_at IS NULL);


--
-- Name: booking_avail_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX booking_avail_tenant_idx ON public.booking_availability USING btree (tenant_id);


--
-- Name: campaign_recipients_pending_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipients_pending_idx ON public.campaign_recipients USING btree (campaign_id, status) WHERE (status = 'pending'::text);


--
-- Name: campaigns_sending_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaigns_sending_idx ON public.campaigns USING btree (status) WHERE (status = 'sending'::text);


--
-- Name: campaigns_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaigns_tenant_idx ON public.campaigns USING btree (tenant_id, created_at DESC);


--
-- Name: chat_conversations_buyer_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_conversations_buyer_idx ON public.chat_conversations USING btree (buyer_id, last_message_at DESC);


--
-- Name: chat_conversations_vendor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_conversations_vendor_idx ON public.chat_conversations USING btree (vendor_id, last_message_at DESC);


--
-- Name: chat_messages_conv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_messages_conv_idx ON public.chat_messages USING btree (conversation_id, created_at);


--
-- Name: collection_categories_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX collection_categories_type_idx ON public.collection_categories USING btree (type_id, sort_order);


--
-- Name: collection_entries_cats_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX collection_entries_cats_idx ON public.collection_entries USING gin (category_ids);


--
-- Name: collection_entries_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX collection_entries_tenant_idx ON public.collection_entries USING btree (tenant_id);


--
-- Name: collection_entries_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX collection_entries_type_idx ON public.collection_entries USING btree (type_id, status, sort_order);


--
-- Name: contact_blocks_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contact_blocks_unique_idx ON public.contact_blocks USING btree (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), kind, value);


--
-- Name: contact_blocks_value_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_blocks_value_idx ON public.contact_blocks USING btree (value);


--
-- Name: contact_details_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_details_tenant_idx ON public.contact_details USING btree (tenant_id);


--
-- Name: contact_events_buyer_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_events_buyer_user_idx ON public.contact_events USING btree (((meta ->> 'buyer_user_id'::text))) WHERE (type = 'form_submission'::text);


--
-- Name: contact_events_contact_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_events_contact_idx ON public.contact_events USING btree (contact_id, created_at DESC);


--
-- Name: contact_events_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_events_tenant_idx ON public.contact_events USING btree (tenant_id, created_at DESC);


--
-- Name: contact_form_submissions_sender_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_form_submissions_sender_email_idx ON public.contact_form_submissions USING btree (tenant_id, sender_email, created_at) WHERE (sender_email IS NOT NULL);


--
-- Name: contact_form_submissions_sender_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_form_submissions_sender_phone_idx ON public.contact_form_submissions USING btree (tenant_id, sender_phone, created_at) WHERE (sender_phone IS NOT NULL);


--
-- Name: contact_forms_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contact_forms_tenant_idx ON public.contact_forms USING btree (tenant_id);


--
-- Name: contacts_tags_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_tags_gin ON public.contacts USING gin (tags);


--
-- Name: contacts_tenant_activity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_tenant_activity_idx ON public.contacts USING btree (tenant_id, last_activity_at DESC);


--
-- Name: contacts_tenant_email_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contacts_tenant_email_uq ON public.contacts USING btree (tenant_id, lower(email)) WHERE (email IS NOT NULL);


--
-- Name: contacts_tenant_phone_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contacts_tenant_phone_uq ON public.contacts USING btree (tenant_id, phone) WHERE (phone IS NOT NULL);


--
-- Name: contacts_tenant_stage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_tenant_stage_idx ON public.contacts USING btree (tenant_id, stage_id);


--
-- Name: content_module_grants_tenant_user_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX content_module_grants_tenant_user_uq ON public.content_module_grants USING btree (tenant_id, user_id);


--
-- Name: content_module_grants_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_module_grants_user_idx ON public.content_module_grants USING btree (user_id);


--
-- Name: courier_events_key_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX courier_events_key_uidx ON public.courier_events USING btree (event_key) WHERE (event_key IS NOT NULL);


--
-- Name: courier_events_sub_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX courier_events_sub_idx ON public.courier_events USING btree (sub_order_id, created_at);


--
-- Name: crm_sequence_runs_active_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX crm_sequence_runs_active_uq ON public.crm_sequence_runs USING btree (sequence_id, contact_id) WHERE (status = 'active'::text);


--
-- Name: crm_sequence_runs_contact_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_sequence_runs_contact_idx ON public.crm_sequence_runs USING btree (tenant_id, contact_id);


--
-- Name: crm_sequence_runs_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_sequence_runs_due_idx ON public.crm_sequence_runs USING btree (status, next_run_at);


--
-- Name: crm_sequences_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_sequences_tenant_idx ON public.crm_sequences USING btree (tenant_id, enabled, trigger);


--
-- Name: crm_stages_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_stages_tenant_idx ON public.crm_stages USING btree (tenant_id, "position");


--
-- Name: crm_tasks_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_tasks_due_idx ON public.crm_tasks USING btree (tenant_id, status, due_at);


--
-- Name: customer_addresses_one_default; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX customer_addresses_one_default ON public.customer_addresses USING btree (tenant_id, customer_id) WHERE is_default;


--
-- Name: customer_addresses_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customer_addresses_owner ON public.customer_addresses USING btree (tenant_id, customer_id);


--
-- Name: domain_orders_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX domain_orders_tenant_id_idx ON public.domain_orders USING btree (tenant_id);


--
-- Name: experts_founding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX experts_founding_idx ON public.experts USING btree (founding_since) WHERE (founding_since IS NOT NULL);


--
-- Name: experts_listing_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX experts_listing_idx ON public.experts USING btree (country_code, city_id) WHERE listed;


--
-- Name: experts_owner_self_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX experts_owner_self_idx ON public.experts USING btree (owner_user_id) WHERE (tenant_id IS NULL);


--
-- Name: experts_rating_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX experts_rating_idx ON public.experts USING btree (country_code, rating_avg) WHERE (listed AND (rating_count > 0));


--
-- Name: experts_skills_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX experts_skills_idx ON public.experts USING gin (skills);


--
-- Name: experts_source_ref_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX experts_source_ref_idx ON public.experts USING btree (source, source_ref) WHERE (source_ref IS NOT NULL);


--
-- Name: experts_verification_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX experts_verification_idx ON public.experts USING btree (verification_status, verification_requested_at);


--
-- Name: feature_groups_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_groups_tenant_idx ON public.feature_groups USING btree (tenant_id);


--
-- Name: feature_items_group_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_items_group_idx ON public.feature_items USING btree (group_id);


--
-- Name: flash_sale_items_product_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flash_sale_items_product_idx ON public.flash_sale_items USING btree (product_id);


--
-- Name: flash_sales_window_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flash_sales_window_idx ON public.flash_sales USING btree (tenant_id, starts_at, ends_at);


--
-- Name: form_submissions_form_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submissions_form_idx ON public.contact_form_submissions USING btree (form_id);


--
-- Name: form_submissions_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submissions_tenant_id_idx ON public.form_submissions USING btree (tenant_id);


--
-- Name: form_submissions_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submissions_tenant_idx ON public.contact_form_submissions USING btree (tenant_id);


--
-- Name: forms_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX forms_tenant_id_idx ON public.forms USING btree (tenant_id);


--
-- Name: guide_events_guide_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX guide_events_guide_idx ON public.guide_events USING btree (guide, event, created_at);


--
-- Name: guide_events_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX guide_events_user_idx ON public.guide_events USING btree (user_id, event);


--
-- Name: idx_media_folder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_media_folder ON public.media USING btree (folder);


--
-- Name: idx_onboarding_build_jobs_resumable; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_build_jobs_resumable ON public.onboarding_build_jobs USING btree (status, locked_at) WHERE (status = ANY (ARRAY['planning'::text, 'building'::text]));


--
-- Name: idx_orders_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_page_view_stats_tenant_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_view_stats_tenant_day ON public.page_view_stats USING btree (tenant_id, day DESC);


--
-- Name: idx_pages_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pages_deleted_at ON public.pages USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: idx_pages_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pages_slug ON public.pages USING btree (slug);


--
-- Name: idx_pages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pages_status ON public.pages USING btree (status);


--
-- Name: idx_pages_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pages_type ON public.pages USING btree (type);


--
-- Name: idx_products_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_slug ON public.products USING btree (slug);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);


--
-- Name: idx_tenant_template_imports_tenant_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenant_template_imports_tenant_slug ON public.tenant_template_imports USING btree (tenant_id, template_slug);


--
-- Name: idx_tenant_visit_counters_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenant_visit_counters_day ON public.tenant_visit_counters USING btree (tenant_id, day DESC);


--
-- Name: idx_transactions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_date ON public.transactions USING btree (date DESC);


--
-- Name: idx_transactions_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_public ON public.transactions USING btree (is_public, date DESC);


--
-- Name: import_jobs_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX import_jobs_tenant ON public.import_jobs USING btree (tenant_id, created_at DESC);


--
-- Name: invoices_contact_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_contact_idx ON public.invoices USING btree (contact_id);


--
-- Name: invoices_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_project_idx ON public.invoices USING btree (project_id) WHERE (project_id IS NOT NULL);


--
-- Name: invoices_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_status_idx ON public.invoices USING btree (tenant_id, status);


--
-- Name: invoices_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_tenant_idx ON public.invoices USING btree (tenant_id, created_at DESC);


--
-- Name: mcp_tokens_user_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mcp_tokens_user_tenant ON public.mcp_tokens USING btree (user_id, tenant_id);


--
-- Name: media_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_tenant_id_idx ON public.media USING btree (tenant_id);


--
-- Name: media_upload_links_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_upload_links_tenant_idx ON public.media_upload_links USING btree (tenant_id);


--
-- Name: nav_menus_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX nav_menus_template_id_idx ON public.nav_menus USING btree (template_id);


--
-- Name: nav_menus_template_location_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX nav_menus_template_location_unique ON public.nav_menus USING btree (template_id, location) WHERE ((template_id IS NOT NULL) AND (location <> 'none'::text));


--
-- Name: nav_menus_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX nav_menus_tenant_idx ON public.nav_menus USING btree (tenant_id);


--
-- Name: nav_menus_tenant_location_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX nav_menus_tenant_location_unique ON public.nav_menus USING btree (tenant_id, location) WHERE (location <> 'none'::text);


--
-- Name: orders_branch_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_branch_idx ON public.orders USING btree (branch_id) WHERE (branch_id IS NOT NULL);


--
-- Name: orders_food_hub_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_food_hub_idx ON public.orders USING btree (tenant_id, created_at) WHERE (source = 'food_hub'::text);


--
-- Name: orders_kitchen_board_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_kitchen_board_idx ON public.orders USING btree (tenant_id, kitchen_status) WHERE (kitchen_status IS NOT NULL);


--
-- Name: INDEX orders_kitchen_board_idx; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.orders_kitchen_board_idx IS 'Backs api/ecommerce/kitchen''s GET filter (tenant_id + kitchen_status not terminal) — added after a load test showed poll time growing with row count on the unindexed path. Partial index (kitchen_status is not null) since most orders never touch the kitchen board at all.';


--
-- Name: orders_rider_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_rider_idx ON public.orders USING btree (rider_id) WHERE (rider_id IS NOT NULL);


--
-- Name: orders_split_group_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_split_group_idx ON public.orders USING btree (split_group_id) WHERE (split_group_id IS NOT NULL);


--
-- Name: orders_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_tenant_id_idx ON public.orders USING btree (tenant_id);


--
-- Name: orders_vendor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_vendor_idx ON public.orders USING btree (vendor_id) WHERE (vendor_id IS NOT NULL);


--
-- Name: page_redirects_tenant_from_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX page_redirects_tenant_from_uniq ON public.page_redirects USING btree (tenant_id, from_path);


--
-- Name: page_snapshots_page_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX page_snapshots_page_id_idx ON public.page_snapshots USING btree (page_id, created_at DESC);


--
-- Name: page_snapshots_page_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX page_snapshots_page_kind_idx ON public.page_snapshots USING btree (page_id, kind, created_at DESC);


--
-- Name: page_snapshots_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX page_snapshots_tenant_id_idx ON public.page_snapshots USING btree (tenant_id);


--
-- Name: pages_root_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pages_root_slug_unique ON public.pages USING btree (slug) WHERE ((tenant_id IS NULL) AND (template_id IS NULL));


--
-- Name: pages_scheduled_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pages_scheduled_due_idx ON public.pages USING btree (scheduled_at) WHERE ((status = 'scheduled'::text) AND (deleted_at IS NULL));


--
-- Name: pages_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pages_template_id_idx ON public.pages USING btree (template_id);


--
-- Name: pages_template_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pages_template_slug_unique ON public.pages USING btree (template_id, slug) WHERE (template_id IS NOT NULL);


--
-- Name: pages_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pages_tenant_id_idx ON public.pages USING btree (tenant_id);


--
-- Name: pages_tenant_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pages_tenant_slug_unique ON public.pages USING btree (tenant_id, slug) WHERE ((tenant_id IS NOT NULL) AND (deleted_at IS NULL) AND (status <> 'archived'::text));


--
-- Name: partner_credit_moves_partner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_credit_moves_partner_idx ON public.partner_credit_moves USING btree (partner_id, created_at DESC);


--
-- Name: partner_credit_moves_sub_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_credit_moves_sub_idx ON public.partner_credit_moves USING btree (subscription_id) WHERE (kind = 'reserve'::text);


--
-- Name: partners_custom_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX partners_custom_code_key ON public.partners USING btree (custom_code) WHERE (custom_code IS NOT NULL);


--
-- Name: partners_dashboard_domain_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX partners_dashboard_domain_idx ON public.partners USING btree (lower(dashboard_domain)) WHERE (dashboard_domain IS NOT NULL);


--
-- Name: partners_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partners_status_idx ON public.partners USING btree (status, created_at DESC);


--
-- Name: plugins_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plugins_tenant_id_idx ON public.plugins USING btree (tenant_id);


--
-- Name: portfolio_groups_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX portfolio_groups_tenant_idx ON public.portfolio_groups USING btree (tenant_id);


--
-- Name: portfolio_items_group_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX portfolio_items_group_idx ON public.portfolio_items USING btree (group_id);


--
-- Name: price_requests_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX price_requests_tenant_idx ON public.price_requests USING btree (tenant_id, created_at DESC);


--
-- Name: pricing_packages_table_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pricing_packages_table_idx ON public.pricing_packages USING btree (table_id);


--
-- Name: pricing_tables_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pricing_tables_tenant_idx ON public.pricing_tables USING btree (tenant_id);


--
-- Name: product_reviews_product_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_reviews_product_idx ON public.product_reviews USING btree (product_id, created_at DESC) WHERE (status = 'published'::text);


--
-- Name: product_reviews_vendor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_reviews_vendor_idx ON public.product_reviews USING btree (vendor_id, created_at DESC);


--
-- Name: product_stock_alerts_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_stock_alerts_lookup ON public.product_stock_alerts USING btree (product_id, variant_id) WHERE (notified_at IS NULL);


--
-- Name: product_variants_product_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_variants_product_idx ON public.product_variants USING btree (product_id, sort_order);


--
-- Name: products_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_tenant_id_idx ON public.products USING btree (tenant_id);


--
-- Name: products_tenant_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_tenant_status_idx ON public.products USING btree (tenant_id, status, approval_status);


--
-- Name: products_vendor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_vendor_idx ON public.products USING btree (vendor_id) WHERE (vendor_id IS NOT NULL);


--
-- Name: profiles_verification_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_verification_idx ON public.profiles USING btree (created_at) WHERE ((email_verified_at IS NULL) AND (whatsapp_verified_at IS NULL));


--
-- Name: re_properties_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX re_properties_tenant_idx ON public.re_properties USING btree (tenant_id, listing_type, status);


--
-- Name: restaurant_branches_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX restaurant_branches_tenant_idx ON public.restaurant_branches USING btree (tenant_id, is_active);


--
-- Name: restaurant_reservations_branch_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX restaurant_reservations_branch_time_idx ON public.restaurant_reservations USING btree (branch_id, reserved_at);


--
-- Name: restaurant_reservations_tenant_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX restaurant_reservations_tenant_time_idx ON public.restaurant_reservations USING btree (tenant_id, reserved_at);


--
-- Name: restaurant_riders_branch_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX restaurant_riders_branch_idx ON public.restaurant_riders USING btree (branch_id, is_active);


--
-- Name: restaurant_riders_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX restaurant_riders_token_idx ON public.restaurant_riders USING btree (rider_token);


--
-- Name: restaurant_tables_branch_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX restaurant_tables_branch_idx ON public.restaurant_tables USING btree (branch_id, is_active);


--
-- Name: restaurant_tables_branch_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX restaurant_tables_branch_number_idx ON public.restaurant_tables USING btree (branch_id, table_number);


--
-- Name: restaurant_tables_qr_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX restaurant_tables_qr_token_idx ON public.restaurant_tables USING btree (qr_token);


--
-- Name: section_preset_saves_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX section_preset_saves_tenant_idx ON public.section_preset_saves USING btree (tenant_id);


--
-- Name: service_categories_tenant_slug_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX service_categories_tenant_slug_uq ON public.service_categories USING btree (tenant_id, slug);


--
-- Name: service_groups_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_groups_tenant_idx ON public.service_groups USING btree (tenant_id);


--
-- Name: service_items_group_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_items_group_idx ON public.service_items USING btree (group_id);


--
-- Name: service_items_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_items_tenant_idx ON public.service_items USING btree (tenant_id);


--
-- Name: shipping_rates_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shipping_rates_tenant_idx ON public.shipping_rates USING btree (tenant_id, sort_order);


--
-- Name: shipping_rates_zone_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX shipping_rates_zone_uidx ON public.shipping_rates USING btree (tenant_id, zone) WHERE (zone IS NOT NULL);


--
-- Name: site_chat_conversations_ip_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_chat_conversations_ip_idx ON public.site_chat_conversations USING btree (tenant_id, ip, started_at);


--
-- Name: site_chat_conversations_last_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_chat_conversations_last_idx ON public.site_chat_conversations USING btree (tenant_id, last_at DESC);


--
-- Name: site_chat_conversations_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_chat_conversations_tenant_idx ON public.site_chat_conversations USING btree (tenant_id, started_at DESC);


--
-- Name: site_chat_messages_conv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_chat_messages_conv_idx ON public.site_chat_messages USING btree (conversation_id, created_at);


--
-- Name: site_chat_training_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_chat_training_tenant_idx ON public.site_chat_training USING btree (tenant_id, kind, created_at);


--
-- Name: site_identity_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_identity_template_id_idx ON public.site_identity USING btree (template_id);


--
-- Name: site_settings_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_settings_tenant_id_idx ON public.site_settings USING btree (tenant_id);


--
-- Name: site_visitor_pages_entered_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_visitor_pages_entered_idx ON public.site_visitor_pages USING btree (entered_at);


--
-- Name: site_visitor_pages_session_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_visitor_pages_session_idx ON public.site_visitor_pages USING btree (tenant_id, session_id, entered_at);


--
-- Name: site_visitors_live_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_visitors_live_idx ON public.site_visitors USING btree (tenant_id, last_seen DESC);


--
-- Name: slider_groups_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX slider_groups_tenant_idx ON public.slider_groups USING btree (tenant_id);


--
-- Name: slider_slides_group_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX slider_slides_group_idx ON public.slider_slides USING btree (group_id);


--
-- Name: spam_entries_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX spam_entries_tenant_idx ON public.spam_entries USING btree (tenant_id, created_at DESC);


--
-- Name: sub_orders_consignment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sub_orders_consignment_idx ON public.sub_orders USING btree (consignment_id) WHERE (consignment_id IS NOT NULL);


--
-- Name: sub_orders_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sub_orders_order_idx ON public.sub_orders USING btree (order_id);


--
-- Name: sub_orders_payout_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sub_orders_payout_idx ON public.sub_orders USING btree (payout_id) WHERE (payout_id IS NOT NULL);


--
-- Name: sub_orders_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sub_orders_tenant_idx ON public.sub_orders USING btree (tenant_id, created_at DESC);


--
-- Name: sub_orders_vendor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sub_orders_vendor_idx ON public.sub_orders USING btree (vendor_id, status);


--
-- Name: subscription_payments_paid_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscription_payments_paid_at_idx ON public.subscription_payments USING btree (paid_at);


--
-- Name: subscription_payments_sub_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscription_payments_sub_idx ON public.subscription_payments USING btree (subscription_id);


--
-- Name: subscription_payments_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscription_payments_tenant_idx ON public.subscription_payments USING btree (tenant_id);


--
-- Name: subscriptions_dodo_subscription_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscriptions_dodo_subscription_id_idx ON public.subscriptions USING btree (dodo_subscription_id) WHERE (dodo_subscription_id IS NOT NULL);


--
-- Name: subscriptions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscriptions_status_idx ON public.subscriptions USING btree (status);


--
-- Name: subscriptions_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscriptions_tenant_id_idx ON public.subscriptions USING btree (tenant_id);


--
-- Name: support_tickets_ai_state_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX support_tickets_ai_state_idx ON public.support_tickets USING btree (ai_state) WHERE (ai_state IS NOT NULL);


--
-- Name: support_tickets_department_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX support_tickets_department_idx ON public.support_tickets USING btree (department);


--
-- Name: support_tickets_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX support_tickets_status_idx ON public.support_tickets USING btree (status);


--
-- Name: support_tickets_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX support_tickets_tenant_id_idx ON public.support_tickets USING btree (tenant_id);


--
-- Name: template_categories_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX template_categories_status_idx ON public.template_categories USING btree (status);


--
-- Name: templates_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_active_idx ON public.templates USING btree (active);


--
-- Name: templates_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_category_id_idx ON public.templates USING btree (category_id);


--
-- Name: templates_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_category_idx ON public.templates USING btree (category);


--
-- Name: templates_owner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_owner_idx ON public.templates USING btree (owner_id);


--
-- Name: templates_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_slug_idx ON public.templates USING btree (slug);


--
-- Name: templates_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_status_idx ON public.templates USING btree (status);


--
-- Name: tenant_alias_domains_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_alias_domains_tenant_idx ON public.tenant_alias_domains USING btree (tenant_id);


--
-- Name: tenant_api_keys_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_api_keys_tenant_idx ON public.tenant_api_keys USING btree (tenant_id);


--
-- Name: tenant_members_one_primary_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenant_members_one_primary_per_user ON public.tenant_members USING btree (user_id) WHERE (is_primary = true);


--
-- Name: tenant_members_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_members_user_id_idx ON public.tenant_members USING btree (user_id);


--
-- Name: tenant_ownership_transfers_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_ownership_transfers_tenant_idx ON public.tenant_ownership_transfers USING btree (tenant_id, created_at DESC);


--
-- Name: tenants_assigned_agent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_assigned_agent_idx ON public.tenants USING btree (assigned_staff_id);


--
-- Name: tenants_custom_domain_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_custom_domain_idx ON public.tenants USING btree (custom_domain);


--
-- Name: tenants_delete_scheduled_for_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_delete_scheduled_for_idx ON public.tenants USING btree (delete_scheduled_for) WHERE (delete_scheduled_for IS NOT NULL);


--
-- Name: tenants_deletion_requested_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_deletion_requested_idx ON public.tenants USING btree (deletion_requested_at) WHERE (deletion_requested_at IS NOT NULL);


--
-- Name: tenants_demo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_demo_idx ON public.tenants USING btree (demo_created_by) WHERE (demo_expires_at IS NOT NULL);


--
-- Name: tenants_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_owner_id_idx ON public.tenants USING btree (owner_id);


--
-- Name: tenants_referred_by_agent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_referred_by_agent_idx ON public.tenants USING btree (referred_by_staff_id);


--
-- Name: tenants_referred_by_partner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_referred_by_partner_idx ON public.tenants USING btree (referred_by_partner_id);


--
-- Name: tenants_reseller_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_reseller_idx ON public.tenants USING btree (reseller_partner_id);


--
-- Name: tenants_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_slug_idx ON public.tenants USING btree (slug);


--
-- Name: tenants_trial_ends_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_trial_ends_at ON public.tenants USING btree (trial_ends_at) WHERE (trial_ends_at IS NOT NULL);


--
-- Name: testimonial_groups_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX testimonial_groups_tenant_idx ON public.testimonial_groups USING btree (tenant_id);


--
-- Name: testimonials_group_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX testimonials_group_idx ON public.testimonials USING btree (group_id);


--
-- Name: testimonials_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX testimonials_tenant_idx ON public.testimonials USING btree (tenant_id);


--
-- Name: themes_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX themes_tenant_id_idx ON public.themes USING btree (tenant_id);


--
-- Name: ticket_messages_ticket_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_messages_ticket_id_idx ON public.support_ticket_messages USING btree (ticket_id);


--
-- Name: tti_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tti_tenant_idx ON public.tenant_template_imports USING btree (tenant_id);


--
-- Name: vendor_courier_accounts_owner_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vendor_courier_accounts_owner_uidx ON public.vendor_courier_accounts USING btree (tenant_id, COALESCE(vendor_id, '00000000-0000-0000-0000-000000000000'::uuid), provider);


--
-- Name: vendor_courier_accounts_token_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vendor_courier_accounts_token_uidx ON public.vendor_courier_accounts USING btree (webhook_token);


--
-- Name: vendors_capabilities_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vendors_capabilities_idx ON public.vendors USING gin (capabilities);


--
-- Name: vendors_last_seen_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vendors_last_seen_idx ON public.vendors USING btree (tenant_id, last_seen_at DESC);


--
-- Name: vendors_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vendors_tenant_idx ON public.vendors USING btree (tenant_id, status);


--
-- Name: vendors_tenant_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vendors_tenant_slug_key ON public.vendors USING btree (tenant_id, slug) WHERE (slug IS NOT NULL);


--
-- Name: vendors_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vendors_user_id_idx ON public.vendors USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: voucher_redemptions_voucher_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX voucher_redemptions_voucher_idx ON public.voucher_redemptions USING btree (voucher_id, customer_id);


--
-- Name: vouchers_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vouchers_code_idx ON public.vouchers USING btree (tenant_id, upper(code));


--
-- Name: vouchers_vendor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vouchers_vendor_idx ON public.vouchers USING btree (tenant_id, vendor_id);


--
-- Name: web_push_subscriptions_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX web_push_subscriptions_user_idx ON public.web_push_subscriptions USING btree (tenant_id, user_id);


--
-- Name: wishlist_items_customer_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX wishlist_items_customer_idx ON public.wishlist_items USING btree (tenant_id, customer_id);


--
-- Name: admin_audit_log audit_acting_as; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_acting_as BEFORE INSERT ON public.admin_audit_log FOR EACH ROW EXECUTE FUNCTION public.audit_acting_as();


--
-- Name: contact_events contact_events_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER contact_events_touch AFTER INSERT ON public.contact_events FOR EACH ROW EXECUTE FUNCTION public.touch_contact_activity();


--
-- Name: experts experts_assign_founding; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER experts_assign_founding BEFORE INSERT ON public.experts FOR EACH ROW EXECUTE FUNCTION public.experts_assign_founding();


--
-- Name: product_reviews product_reviews_aggregate; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER product_reviews_aggregate AFTER INSERT OR DELETE OR UPDATE OF rating, status ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.refresh_review_aggregates();


--
-- Name: products products_ecommerce_on; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER products_ecommerce_on AFTER INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.ecommerce_on_with_products();


--
-- Name: ecommerce_settings set_ecom_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_ecom_settings_updated_at BEFORE UPDATE ON public.ecommerce_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: orders set_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: pages set_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: products set_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: profiles set_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: restaurant_reservations set_restaurant_reservations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_restaurant_reservations_updated_at BEFORE UPDATE ON public.restaurant_reservations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: site_settings set_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sub_orders sub_orders_vendor_guard_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sub_orders_vendor_guard_trg BEFORE UPDATE ON public.sub_orders FOR EACH ROW EXECUTE FUNCTION public.sub_orders_vendor_guard();


--
-- Name: subscriptions subscriptions_sync_demo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER subscriptions_sync_demo BEFORE INSERT OR UPDATE OF status ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.sync_subscription_demo();


--
-- Name: tenants tenants_booking_defaults; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tenants_booking_defaults AFTER INSERT ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.tenants_booking_defaults();


--
-- Name: tenants tenants_sync_demo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tenants_sync_demo AFTER UPDATE OF demo_expires_at ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_demo();


--
-- Name: pages trg_check_page_parent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_check_page_parent BEFORE INSERT OR UPDATE OF parent_id, tenant_id ON public.pages FOR EACH ROW EXECUTE FUNCTION public.check_page_parent();


--
-- Name: pages trg_clear_page_redirect; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_clear_page_redirect AFTER INSERT ON public.pages FOR EACH ROW EXECUTE FUNCTION public.clear_page_redirect_on_insert();


--
-- Name: pages trg_enforce_page_limit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_page_limit BEFORE INSERT ON public.pages FOR EACH ROW EXECUTE FUNCTION public.enforce_page_limit();


--
-- Name: tenants trg_guard_tenant_columns; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_guard_tenant_columns BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.guard_tenant_columns();


--
-- Name: tenants trg_guard_tenant_owner; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_guard_tenant_owner BEFORE UPDATE OF owner_id ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.guard_tenant_owner();


--
-- Name: care_plans trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.care_plans FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: care_prices trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.care_prices FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: homepage_settings trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.homepage_settings FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: partners trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: payment_gateways trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.payment_gateways FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: pc_staff trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.pc_staff FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: plan_prices trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.plan_prices FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: plans trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: platform_settings trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: profiles trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_db_change('role,is_active');


--
-- Name: site_settings trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: subscription_payments trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.subscription_payments FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: subscriptions trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: super_admins trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.super_admins FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: tenant_members trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.tenant_members FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: tenant_payment_methods trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.tenant_payment_methods FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: tenants trg_log_db_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_db_change AFTER INSERT OR DELETE OR UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.log_db_change('');


--
-- Name: ai_generation_packages trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.ai_generation_packages FOR EACH ROW EXECUTE FUNCTION public.log_team_action('platform', 'null');


--
-- Name: backup_settings trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.backup_settings FOR EACH ROW EXECUTE FUNCTION public.log_team_action('settings', 'null');


--
-- Name: booking_appointments trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.booking_appointments FOR EACH ROW EXECUTE FUNCTION public.log_team_action('intake', 'booking');


--
-- Name: booking_availability trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.booking_availability FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'booking_hours');


--
-- Name: booking_blocked_dates trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.booking_blocked_dates FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'booking_block');


--
-- Name: booking_settings trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.booking_settings FOR EACH ROW EXECUTE FUNCTION public.log_team_action('settings');


--
-- Name: campaigns trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'campaign');


--
-- Name: care_plans trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.care_plans FOR EACH ROW EXECUTE FUNCTION public.log_team_action('platform', 'null');


--
-- Name: care_prices trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.care_prices FOR EACH ROW EXECUTE FUNCTION public.log_team_action('platform', 'null');


--
-- Name: categories trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'category');


--
-- Name: collection_categories trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.collection_categories FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'collection_category');


--
-- Name: collection_entries trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.collection_entries FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'collection_entry');


--
-- Name: collection_types trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.collection_types FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'collection_type');


--
-- Name: contact_blocks trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.contact_blocks FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'contact_block');


--
-- Name: contact_details trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.contact_details FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'contact_detail');


--
-- Name: contact_events trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.contact_events FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'lead_note');


--
-- Name: contact_form_submissions trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.contact_form_submissions FOR EACH ROW EXECUTE FUNCTION public.log_team_action('intake', 'form');


--
-- Name: contact_forms trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.contact_forms FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'contact_form');


--
-- Name: contacts trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.log_team_action('intake', 'lead');


--
-- Name: crm_sequences trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.crm_sequences FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'crm_sequence');


--
-- Name: crm_stages trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.crm_stages FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'crm_stage');


--
-- Name: crm_tasks trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.crm_tasks FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'crm_task');


--
-- Name: domain_orders trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.domain_orders FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'domain_order');


--
-- Name: experts trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.experts FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'expert');


--
-- Name: feature_groups trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.feature_groups FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'feature_group');


--
-- Name: feature_items trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.feature_items FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'feature');


--
-- Name: flash_sales trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.flash_sales FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'flash_sale');


--
-- Name: homepage_settings trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.homepage_settings FOR EACH ROW EXECUTE FUNCTION public.log_team_action('platform', 'null');


--
-- Name: invoices trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'client_invoice');


--
-- Name: mcp_tokens trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE OF revoked_at ON public.mcp_tokens FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'token');


--
-- Name: media trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.media FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'media');


--
-- Name: nav_menus trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.nav_menus FOR EACH ROW EXECUTE FUNCTION public.log_team_action('settings');


--
-- Name: orders trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_team_action('intake', 'order');


--
-- Name: page_redirects trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE OF from_path, to_path, to_url, status_code, page_id, note ON public.page_redirects FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'redirect');


--
-- Name: pages trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.log_team_action('page');


--
-- Name: partners trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.log_team_action('platform', 'null');


--
-- Name: pc_staff trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.pc_staff FOR EACH ROW EXECUTE FUNCTION public.log_team_action('staff');


--
-- Name: plan_prices trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.plan_prices FOR EACH ROW EXECUTE FUNCTION public.log_team_action('platform');


--
-- Name: plans trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.log_team_action('platform');


--
-- Name: platform_settings trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.log_team_action('platform');


--
-- Name: portfolio_groups trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.portfolio_groups FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'portfolio_group');


--
-- Name: portfolio_items trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.portfolio_items FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'portfolio_item');


--
-- Name: price_requests trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.price_requests FOR EACH ROW EXECUTE FUNCTION public.log_team_action('intake', 'price_request');


--
-- Name: pricing_packages trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.pricing_packages FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'pricing_package');


--
-- Name: pricing_tables trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.pricing_tables FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'pricing_table');


--
-- Name: product_option_presets trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.product_option_presets FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'option_preset');


--
-- Name: product_reviews trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.log_team_action('intake', 'review');


--
-- Name: product_variants trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'product_variant');


--
-- Name: products trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'product');


--
-- Name: profiles trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_team_action('profile');


--
-- Name: re_communities trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.re_communities FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'community');


--
-- Name: re_developers trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.re_developers FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'developer');


--
-- Name: re_properties trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.re_properties FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'property');


--
-- Name: restaurant_branches trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.restaurant_branches FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'branch');


--
-- Name: restaurant_reservations trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.restaurant_reservations FOR EACH ROW EXECUTE FUNCTION public.log_team_action('intake', 'reservation');


--
-- Name: service_categories trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.service_categories FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'service_category');


--
-- Name: service_groups trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.service_groups FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'service_group');


--
-- Name: service_items trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.service_items FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'service');


--
-- Name: shipping_rates trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.shipping_rates FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'shipping_rate');


--
-- Name: site_chat_messages trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.site_chat_messages FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'chat_reply');


--
-- Name: site_chat_training trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.site_chat_training FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'chat_training');


--
-- Name: site_identity trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.site_identity FOR EACH ROW EXECUTE FUNCTION public.log_team_action('settings');


--
-- Name: site_settings trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.log_team_action('settings');


--
-- Name: slider_groups trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.slider_groups FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'slider');


--
-- Name: slider_slides trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.slider_slides FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'slide');


--
-- Name: subscription_payments trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.subscription_payments FOR EACH ROW EXECUTE FUNCTION public.log_team_action('payment');


--
-- Name: subscriptions trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.log_team_action('billing');


--
-- Name: super_admins trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.super_admins FOR EACH ROW EXECUTE FUNCTION public.log_team_action('super_admin');


--
-- Name: support_ticket_messages trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.support_ticket_messages FOR EACH ROW EXECUTE FUNCTION public.log_team_action('ticket_message');


--
-- Name: support_tickets trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.log_team_action('ticket');


--
-- Name: tenant_alias_domains trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.tenant_alias_domains FOR EACH ROW EXECUTE FUNCTION public.log_team_action('settings');


--
-- Name: tenant_api_keys trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.tenant_api_keys FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'api_key');


--
-- Name: tenant_business_profiles trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.tenant_business_profiles FOR EACH ROW EXECUTE FUNCTION public.log_team_action('settings');


--
-- Name: tenant_email_settings trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.tenant_email_settings FOR EACH ROW EXECUTE FUNCTION public.log_team_action('settings');


--
-- Name: tenant_integrations trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.tenant_integrations FOR EACH ROW EXECUTE FUNCTION public.log_team_action('settings');


--
-- Name: tenant_members trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.tenant_members FOR EACH ROW EXECUTE FUNCTION public.log_team_action('member');


--
-- Name: tenant_payment_methods trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.tenant_payment_methods FOR EACH ROW EXECUTE FUNCTION public.log_team_action('settings');


--
-- Name: tenants trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.log_team_action('site');


--
-- Name: testimonial_groups trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.testimonial_groups FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'testimonial_group');


--
-- Name: testimonials trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'testimonial');


--
-- Name: vendors trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'vendor');


--
-- Name: vouchers trg_log_team_action; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_team_action AFTER INSERT OR DELETE OR UPDATE ON public.vouchers FOR EACH ROW EXECUTE FUNCTION public.log_team_action('content', 'voucher');


--
-- Name: pages trg_pages_draft_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pages_draft_rev BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.pages_bump_draft_rev();


--
-- Name: page_snapshots trg_prune_old_page_snapshots; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prune_old_page_snapshots AFTER INSERT ON public.page_snapshots FOR EACH ROW EXECUTE FUNCTION public.prune_old_page_snapshots();


--
-- Name: pages trg_record_page_redirect; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_record_page_redirect AFTER UPDATE OF slug ON public.pages FOR EACH ROW EXECUTE FUNCTION public.record_page_redirect();


--
-- Name: pages trg_snapshot_page_before_blocks_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_snapshot_page_before_blocks_change BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.snapshot_page_before_blocks_change();


--
-- Name: support_tickets trg_support_tickets_owner_update_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_support_tickets_owner_update_guard BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.support_tickets_owner_update_guard();


--
-- Name: tenant_business_profiles trg_touch_tenant_business_profile; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_tenant_business_profile BEFORE UPDATE ON public.tenant_business_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_tenant_business_profile();


--
-- Name: admin_app_devices admin_app_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_app_devices
    ADD CONSTRAINT admin_app_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_notification_prefs admin_notification_prefs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notification_prefs
    ADD CONSTRAINT admin_notification_prefs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_notifications admin_notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: admin_notifications admin_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: agent_conversations agent_conversations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_conversations
    ADD CONSTRAINT agent_conversations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: agent_conversations agent_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_conversations
    ADD CONSTRAINT agent_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: agent_messages agent_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_messages
    ADD CONSTRAINT agent_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.agent_conversations(id) ON DELETE CASCADE;


--
-- Name: agent_messages agent_messages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_messages
    ADD CONSTRAINT agent_messages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: agent_pending_actions agent_pending_actions_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_pending_actions
    ADD CONSTRAINT agent_pending_actions_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.agent_conversations(id) ON DELETE CASCADE;


--
-- Name: agent_pending_actions agent_pending_actions_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_pending_actions
    ADD CONSTRAINT agent_pending_actions_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);


--
-- Name: agent_pending_actions agent_pending_actions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_pending_actions
    ADD CONSTRAINT agent_pending_actions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: pc_staff agents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pc_staff
    ADD CONSTRAINT agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: agents agents_user_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_credit_spends ai_credit_spends_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_credit_spends
    ADD CONSTRAINT ai_credit_spends_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_credit_spends ai_credit_spends_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_credit_spends
    ADD CONSTRAINT ai_credit_spends_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: ai_generation_log ai_generation_log_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generation_log
    ADD CONSTRAINT ai_generation_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_generation_log ai_generation_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generation_log
    ADD CONSTRAINT ai_generation_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: backup_runs backup_runs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_runs
    ADD CONSTRAINT backup_runs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: backup_settings backup_settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_settings
    ADD CONSTRAINT backup_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: booking_appointments booking_appointments_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_appointments
    ADD CONSTRAINT booking_appointments_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: booking_appointments booking_appointments_chat_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_appointments
    ADD CONSTRAINT booking_appointments_chat_conversation_id_fkey FOREIGN KEY (chat_conversation_id) REFERENCES public.site_chat_conversations(id) ON DELETE SET NULL;


--
-- Name: booking_appointments booking_appointments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_appointments
    ADD CONSTRAINT booking_appointments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: booking_availability booking_availability_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_availability
    ADD CONSTRAINT booking_availability_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: booking_blocked_dates booking_blocked_dates_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_blocked_dates
    ADD CONSTRAINT booking_blocked_dates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: booking_settings booking_settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_settings
    ADD CONSTRAINT booking_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: branch_product_availability branch_product_availability_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_product_availability
    ADD CONSTRAINT branch_product_availability_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.restaurant_branches(id) ON DELETE CASCADE;


--
-- Name: branch_product_availability branch_product_availability_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_product_availability
    ADD CONSTRAINT branch_product_availability_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: campaign_recipients campaign_recipients_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_recipients campaign_recipients_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: campaign_recipients campaign_recipients_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: campaigns campaigns_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: care_prices care_prices_care_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_prices
    ADD CONSTRAINT care_prices_care_id_fkey FOREIGN KEY (care_id) REFERENCES public.care_plans(id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: categories categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: chat_conversations chat_conversations_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: chat_conversations chat_conversations_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: chat_conversations chat_conversations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: chat_conversations chat_conversations_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: collection_categories collection_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_categories
    ADD CONSTRAINT collection_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.collection_categories(id) ON DELETE SET NULL;


--
-- Name: collection_categories collection_categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_categories
    ADD CONSTRAINT collection_categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: collection_categories collection_categories_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_categories
    ADD CONSTRAINT collection_categories_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.collection_types(id) ON DELETE CASCADE;


--
-- Name: collection_entries collection_entries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_entries
    ADD CONSTRAINT collection_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: collection_entries collection_entries_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_entries
    ADD CONSTRAINT collection_entries_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.collection_types(id) ON DELETE CASCADE;


--
-- Name: collection_types collection_types_template_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_types
    ADD CONSTRAINT collection_types_template_page_id_fkey FOREIGN KEY (template_page_id) REFERENCES public.pages(id) ON DELETE SET NULL;


--
-- Name: collection_types collection_types_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_types
    ADD CONSTRAINT collection_types_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: contact_blocks contact_blocks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_blocks
    ADD CONSTRAINT contact_blocks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: contact_blocks contact_blocks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_blocks
    ADD CONSTRAINT contact_blocks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: contact_details contact_details_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_details
    ADD CONSTRAINT contact_details_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: contact_events contact_events_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_events
    ADD CONSTRAINT contact_events_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: contact_events contact_events_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_events
    ADD CONSTRAINT contact_events_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: contact_events contact_events_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_events
    ADD CONSTRAINT contact_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: contact_form_submissions contact_form_submissions_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_form_submissions
    ADD CONSTRAINT contact_form_submissions_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.contact_forms(id) ON DELETE CASCADE;


--
-- Name: contact_form_submissions contact_form_submissions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_form_submissions
    ADD CONSTRAINT contact_form_submissions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: contact_forms contact_forms_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_forms
    ADD CONSTRAINT contact_forms_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: contacts contacts_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.crm_stages(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: content_module_grants content_module_grants_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_module_grants
    ADD CONSTRAINT content_module_grants_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: content_module_grants content_module_grants_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_module_grants
    ADD CONSTRAINT content_module_grants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: content_module_grants content_module_grants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_module_grants
    ADD CONSTRAINT content_module_grants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: courier_events courier_events_sub_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courier_events
    ADD CONSTRAINT courier_events_sub_order_id_fkey FOREIGN KEY (sub_order_id) REFERENCES public.sub_orders(id) ON DELETE CASCADE;


--
-- Name: courier_events courier_events_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courier_events
    ADD CONSTRAINT courier_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: crm_sequence_runs crm_sequence_runs_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_sequence_runs
    ADD CONSTRAINT crm_sequence_runs_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: crm_sequence_runs crm_sequence_runs_sequence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_sequence_runs
    ADD CONSTRAINT crm_sequence_runs_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.crm_sequences(id) ON DELETE CASCADE;


--
-- Name: crm_sequence_runs crm_sequence_runs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_sequence_runs
    ADD CONSTRAINT crm_sequence_runs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: crm_sequences crm_sequences_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_sequences
    ADD CONSTRAINT crm_sequences_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: crm_stages crm_stages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_stages
    ADD CONSTRAINT crm_stages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: crm_tasks crm_tasks_assignee_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_tasks
    ADD CONSTRAINT crm_tasks_assignee_user_id_fkey FOREIGN KEY (assignee_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: crm_tasks crm_tasks_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_tasks
    ADD CONSTRAINT crm_tasks_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: crm_tasks crm_tasks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_tasks
    ADD CONSTRAINT crm_tasks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: customer_addresses customer_addresses_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: customer_profiles customer_profiles_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_profiles
    ADD CONSTRAINT customer_profiles_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: customer_profiles customer_profiles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_profiles
    ADD CONSTRAINT customer_profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: domain_orders domain_orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.domain_orders
    ADD CONSTRAINT domain_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ecommerce_settings ecommerce_settings_privacy_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecommerce_settings
    ADD CONSTRAINT ecommerce_settings_privacy_page_id_fkey FOREIGN KEY (privacy_page_id) REFERENCES public.pages(id);


--
-- Name: ecommerce_settings ecommerce_settings_success_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecommerce_settings
    ADD CONSTRAINT ecommerce_settings_success_page_id_fkey FOREIGN KEY (success_page_id) REFERENCES public.pages(id);


--
-- Name: ecommerce_settings ecommerce_settings_terms_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecommerce_settings
    ADD CONSTRAINT ecommerce_settings_terms_page_id_fkey FOREIGN KEY (terms_page_id) REFERENCES public.pages(id);


--
-- Name: email_zoho_connections email_zoho_connections_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_zoho_connections
    ADD CONSTRAINT email_zoho_connections_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: experts experts_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experts
    ADD CONSTRAINT experts_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: experts experts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experts
    ADD CONSTRAINT experts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: experts experts_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experts
    ADD CONSTRAINT experts_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: feature_groups feature_groups_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_groups
    ADD CONSTRAINT feature_groups_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: feature_items feature_items_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_items
    ADD CONSTRAINT feature_items_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.feature_groups(id) ON DELETE CASCADE;


--
-- Name: feature_items feature_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_items
    ADD CONSTRAINT feature_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: flash_sale_items flash_sale_items_flash_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flash_sale_items
    ADD CONSTRAINT flash_sale_items_flash_sale_id_fkey FOREIGN KEY (flash_sale_id) REFERENCES public.flash_sales(id) ON DELETE CASCADE;


--
-- Name: flash_sale_items flash_sale_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flash_sale_items
    ADD CONSTRAINT flash_sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: flash_sale_items flash_sale_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flash_sale_items
    ADD CONSTRAINT flash_sale_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: flash_sales flash_sales_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flash_sales
    ADD CONSTRAINT flash_sales_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: form_submissions form_submissions_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE;


--
-- Name: form_submissions form_submissions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: forms forms_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forms
    ADD CONSTRAINT forms_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: guide_events guide_events_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_events
    ADD CONSTRAINT guide_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: guide_events guide_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_events
    ADD CONSTRAINT guide_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: import_jobs import_jobs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_jobs
    ADD CONSTRAINT import_jobs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: mcp_tokens mcp_tokens_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_tokens
    ADD CONSTRAINT mcp_tokens_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: media media_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: media_upload_links media_upload_links_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_upload_links
    ADD CONSTRAINT media_upload_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: media_upload_links media_upload_links_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_upload_links
    ADD CONSTRAINT media_upload_links_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: media media_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: nav_menus nav_menus_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nav_menus
    ADD CONSTRAINT nav_menus_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE CASCADE;


--
-- Name: nav_menus nav_menus_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nav_menus
    ADD CONSTRAINT nav_menus_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: notification_prefs notification_prefs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_prefs
    ADD CONSTRAINT notification_prefs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: onboarding_build_jobs onboarding_build_jobs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_build_jobs
    ADD CONSTRAINT onboarding_build_jobs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: orders orders_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.restaurant_branches(id) ON DELETE SET NULL;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: orders orders_rider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES public.restaurant_riders(id) ON DELETE SET NULL;


--
-- Name: orders orders_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;


--
-- Name: orders orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: orders orders_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;


--
-- Name: page_categories page_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_categories
    ADD CONSTRAINT page_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: page_categories page_categories_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_categories
    ADD CONSTRAINT page_categories_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: page_redirects page_redirects_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_redirects
    ADD CONSTRAINT page_redirects_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: page_redirects page_redirects_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_redirects
    ADD CONSTRAINT page_redirects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: page_snapshots page_snapshots_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_snapshots
    ADD CONSTRAINT page_snapshots_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: page_snapshots page_snapshots_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_snapshots
    ADD CONSTRAINT page_snapshots_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: page_snapshots page_snapshots_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_snapshots
    ADD CONSTRAINT page_snapshots_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: page_tags page_tags_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_tags
    ADD CONSTRAINT page_tags_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: page_tags page_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_tags
    ADD CONSTRAINT page_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: page_view_stats page_view_stats_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_view_stats
    ADD CONSTRAINT page_view_stats_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: pages pages_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: pages pages_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.pages(id) ON DELETE SET NULL;


--
-- Name: pages pages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: partner_credit_moves partner_credit_moves_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_credit_moves
    ADD CONSTRAINT partner_credit_moves_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: partner_credit_moves partner_credit_moves_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_credit_moves
    ADD CONSTRAINT partner_credit_moves_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: partners partners_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: plan_prices plan_prices_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_prices
    ADD CONSTRAINT plan_prices_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;


--
-- Name: plugins plugins_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT plugins_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: portfolio_groups portfolio_groups_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_groups
    ADD CONSTRAINT portfolio_groups_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: portfolio_items portfolio_items_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.portfolio_groups(id) ON DELETE CASCADE;


--
-- Name: portfolio_items portfolio_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: price_requests price_requests_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_requests
    ADD CONSTRAINT price_requests_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: price_requests price_requests_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_requests
    ADD CONSTRAINT price_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: pricing_packages pricing_packages_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_packages
    ADD CONSTRAINT pricing_packages_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.pricing_tables(id) ON DELETE CASCADE;


--
-- Name: pricing_packages pricing_packages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_packages
    ADD CONSTRAINT pricing_packages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: pricing_tables pricing_tables_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_tables
    ADD CONSTRAINT pricing_tables_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: product_option_presets product_option_presets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_option_presets
    ADD CONSTRAINT product_option_presets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: product_reviews product_reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_reviews product_reviews_sub_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_sub_order_id_fkey FOREIGN KEY (sub_order_id) REFERENCES public.sub_orders(id) ON DELETE SET NULL;


--
-- Name: product_reviews product_reviews_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: product_reviews product_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: product_reviews product_reviews_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;


--
-- Name: product_stock_alerts product_stock_alerts_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_stock_alerts
    ADD CONSTRAINT product_stock_alerts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_stock_alerts product_stock_alerts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_stock_alerts
    ADD CONSTRAINT product_stock_alerts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: product_stock_alerts product_stock_alerts_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_stock_alerts
    ADD CONSTRAINT product_stock_alerts_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: products products_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: re_communities re_communities_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.re_communities
    ADD CONSTRAINT re_communities_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: re_developers re_developers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.re_developers
    ADD CONSTRAINT re_developers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: re_properties re_properties_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.re_properties
    ADD CONSTRAINT re_properties_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.re_communities(id) ON DELETE SET NULL;


--
-- Name: re_properties re_properties_developer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.re_properties
    ADD CONSTRAINT re_properties_developer_id_fkey FOREIGN KEY (developer_id) REFERENCES public.re_developers(id) ON DELETE SET NULL;


--
-- Name: re_properties re_properties_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.re_properties
    ADD CONSTRAINT re_properties_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: restaurant_branches restaurant_branches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_branches
    ADD CONSTRAINT restaurant_branches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: restaurant_reservations restaurant_reservations_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_reservations
    ADD CONSTRAINT restaurant_reservations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.restaurant_branches(id) ON DELETE CASCADE;


--
-- Name: restaurant_reservations restaurant_reservations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_reservations
    ADD CONSTRAINT restaurant_reservations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: restaurant_riders restaurant_riders_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_riders
    ADD CONSTRAINT restaurant_riders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.restaurant_branches(id) ON DELETE CASCADE;


--
-- Name: restaurant_tables restaurant_tables_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.restaurant_branches(id) ON DELETE CASCADE;


--
-- Name: section_preset_saves section_preset_saves_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.section_preset_saves
    ADD CONSTRAINT section_preset_saves_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: section_preset_saves section_preset_saves_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.section_preset_saves
    ADD CONSTRAINT section_preset_saves_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: service_categories service_categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: service_groups service_groups_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_groups
    ADD CONSTRAINT service_groups_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: service_items service_items_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.service_groups(id) ON DELETE CASCADE;


--
-- Name: service_items service_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: shipping_rates shipping_rates_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipping_rates
    ADD CONSTRAINT shipping_rates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: site_chat_conversations site_chat_conversations_lead_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_chat_conversations
    ADD CONSTRAINT site_chat_conversations_lead_contact_id_fkey FOREIGN KEY (lead_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: site_chat_conversations site_chat_conversations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_chat_conversations
    ADD CONSTRAINT site_chat_conversations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: site_chat_messages site_chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_chat_messages
    ADD CONSTRAINT site_chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.site_chat_conversations(id) ON DELETE CASCADE;


--
-- Name: site_chat_messages site_chat_messages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_chat_messages
    ADD CONSTRAINT site_chat_messages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: site_chat_training site_chat_training_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_chat_training
    ADD CONSTRAINT site_chat_training_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: site_chat_training site_chat_training_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_chat_training
    ADD CONSTRAINT site_chat_training_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: site_identity site_identity_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_identity
    ADD CONSTRAINT site_identity_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE SET NULL;


--
-- Name: site_identity site_identity_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_identity
    ADD CONSTRAINT site_identity_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: site_settings site_settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: site_visitor_pages site_visitor_pages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_visitor_pages
    ADD CONSTRAINT site_visitor_pages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: site_visitors site_visitors_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_visitors
    ADD CONSTRAINT site_visitors_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.site_chat_conversations(id) ON DELETE SET NULL;


--
-- Name: site_visitors site_visitors_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_visitors
    ADD CONSTRAINT site_visitors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: slider_groups slider_groups_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slider_groups
    ADD CONSTRAINT slider_groups_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: slider_slides slider_slides_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slider_slides
    ADD CONSTRAINT slider_slides_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.slider_groups(id) ON DELETE CASCADE;


--
-- Name: slider_slides slider_slides_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slider_slides
    ADD CONSTRAINT slider_slides_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: spam_entries spam_entries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spam_entries
    ADD CONSTRAINT spam_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sub_orders sub_orders_courier_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_orders
    ADD CONSTRAINT sub_orders_courier_account_id_fkey FOREIGN KEY (courier_account_id) REFERENCES public.vendor_courier_accounts(id) ON DELETE SET NULL;


--
-- Name: sub_orders sub_orders_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_orders
    ADD CONSTRAINT sub_orders_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: sub_orders sub_orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_orders
    ADD CONSTRAINT sub_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sub_orders sub_orders_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_orders
    ADD CONSTRAINT sub_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: subscription_payments subscription_payments_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id);


--
-- Name: subscription_payments subscription_payments_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;


--
-- Name: subscription_payments subscription_payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_care_plan_id_fkey FOREIGN KEY (care_plan_id) REFERENCES public.care_plans(id);


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: subscriptions subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: super_admins super_admins_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_admins
    ADD CONSTRAINT super_admins_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: super_admins super_admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_admins
    ADD CONSTRAINT super_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_ticket_messages support_ticket_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_messages
    ADD CONSTRAINT support_ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: support_ticket_messages support_ticket_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_messages
    ADD CONSTRAINT support_ticket_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: template_categories template_categories_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_categories
    ADD CONSTRAINT template_categories_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: templates templates_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.template_categories(id) ON DELETE SET NULL;


--
-- Name: templates templates_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: templates templates_source_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_source_tenant_id_fkey FOREIGN KEY (source_tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: tenant_alias_domains tenant_alias_domains_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_alias_domains
    ADD CONSTRAINT tenant_alias_domains_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_api_keys tenant_api_keys_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_api_keys
    ADD CONSTRAINT tenant_api_keys_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_business_profiles tenant_business_profiles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_business_profiles
    ADD CONSTRAINT tenant_business_profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_email_settings tenant_email_settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_email_settings
    ADD CONSTRAINT tenant_email_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_integrations tenant_integrations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_integrations
    ADD CONSTRAINT tenant_integrations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_low_stock_notices tenant_low_stock_notices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_low_stock_notices
    ADD CONSTRAINT tenant_low_stock_notices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_members tenant_members_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_members
    ADD CONSTRAINT tenant_members_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_members tenant_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_members
    ADD CONSTRAINT tenant_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tenant_ownership_transfers tenant_ownership_transfers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_ownership_transfers
    ADD CONSTRAINT tenant_ownership_transfers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_payment_methods tenant_payment_methods_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_payment_methods
    ADD CONSTRAINT tenant_payment_methods_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_template_imports tenant_template_imports_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_template_imports
    ADD CONSTRAINT tenant_template_imports_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE SET NULL;


--
-- Name: tenant_template_imports tenant_template_imports_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_template_imports
    ADD CONSTRAINT tenant_template_imports_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_visit_counters tenant_visit_counters_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_visit_counters
    ADD CONSTRAINT tenant_visit_counters_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenants tenants_assigned_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_assigned_admin_id_fkey FOREIGN KEY (assigned_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tenants tenants_assigned_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_assigned_agent_id_fkey FOREIGN KEY (assigned_staff_id) REFERENCES public.pc_staff(id) ON DELETE SET NULL;


--
-- Name: tenants tenants_assigned_agent_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_assigned_agent_id_fkey1 FOREIGN KEY (assigned_agent_id) REFERENCES public.agents(id) ON DELETE SET NULL;


--
-- Name: tenants tenants_deletion_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_deletion_requested_by_fkey FOREIGN KEY (deletion_requested_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tenants tenants_demo_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_demo_created_by_fkey FOREIGN KEY (demo_created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tenants tenants_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tenants tenants_referred_by_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_referred_by_agent_id_fkey FOREIGN KEY (referred_by_staff_id) REFERENCES public.pc_staff(id) ON DELETE SET NULL;


--
-- Name: tenants tenants_referred_by_agent_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_referred_by_agent_id_fkey1 FOREIGN KEY (referred_by_agent_id) REFERENCES public.agents(id) ON DELETE SET NULL;


--
-- Name: tenants tenants_referred_by_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_referred_by_partner_id_fkey FOREIGN KEY (referred_by_partner_id) REFERENCES public.partners(id) ON DELETE SET NULL;


--
-- Name: tenants tenants_reseller_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_reseller_partner_id_fkey FOREIGN KEY (reseller_partner_id) REFERENCES public.partners(id) ON DELETE SET NULL;


--
-- Name: tenants tenants_staff_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_staff_agent_id_fkey FOREIGN KEY (staff_id) REFERENCES public.pc_staff(id) ON DELETE SET NULL;


--
-- Name: testimonial_groups testimonial_groups_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonial_groups
    ADD CONSTRAINT testimonial_groups_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: testimonials testimonials_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.testimonial_groups(id) ON DELETE CASCADE;


--
-- Name: testimonials testimonials_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: themes themes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: vendor_courier_accounts vendor_courier_accounts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_courier_accounts
    ADD CONSTRAINT vendor_courier_accounts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: vendor_courier_accounts vendor_courier_accounts_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_courier_accounts
    ADD CONSTRAINT vendor_courier_accounts_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendors vendors_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: vendors vendors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: voucher_redemptions voucher_redemptions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: voucher_redemptions voucher_redemptions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: voucher_redemptions voucher_redemptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: voucher_redemptions voucher_redemptions_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voucher_redemptions
    ADD CONSTRAINT voucher_redemptions_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id) ON DELETE CASCADE;


--
-- Name: vouchers vouchers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: vouchers vouchers_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: web_push_subscriptions web_push_subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_push_subscriptions
    ADD CONSTRAINT web_push_subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: web_push_subscriptions web_push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.web_push_subscriptions
    ADD CONSTRAINT web_push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: delivery_options Active delivery public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active delivery public" ON public.delivery_options FOR SELECT USING (((is_enabled = true) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));


--
-- Name: payment_gateways Active gateways public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active gateways public" ON public.payment_gateways FOR SELECT USING (((is_enabled = true) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));


--
-- Name: delivery_options Admins manage delivery; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage delivery" ON public.delivery_options USING (((auth.uid() IS NOT NULL) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)));


--
-- Name: ecommerce_settings Admins manage ecommerce settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage ecommerce settings" ON public.ecommerce_settings USING (((auth.uid() IS NOT NULL) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)));


--
-- Name: payment_gateways Admins manage gateways; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage gateways" ON public.payment_gateways USING (((auth.uid() IS NOT NULL) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)));


--
-- Name: menus Admins manage menus; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage menus" ON public.menus USING (((auth.uid() IS NOT NULL) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['admin'::text, 'editor'::text]))));


--
-- Name: tags Admins manage tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage tags" ON public.tags USING (((auth.uid() IS NOT NULL) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['admin'::text, 'editor'::text]))));


--
-- Name: product_variants Admins manage variants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage variants" ON public.product_variants USING (((auth.uid() IS NOT NULL) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['admin'::text, 'editor'::text]))));


--
-- Name: ecommerce_settings Ecommerce settings public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ecommerce settings public read" ON public.ecommerce_settings FOR SELECT USING (true);


--
-- Name: menus Menus public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Menus public read" ON public.menus FOR SELECT USING (true);


--
-- Name: profiles Profiles readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles readable by all" ON public.profiles FOR SELECT USING (true);


--
-- Name: profiles Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.profiles USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: tags Tags public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tags public read" ON public.tags FOR SELECT USING (true);


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: product_variants Variants public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Variants public read" ON public.product_variants FOR SELECT USING (true);


--
-- Name: account_deletion_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_app_devices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_app_devices ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_app_devices admin_app_devices_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_app_devices_own ON public.admin_app_devices USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: admin_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_notification_prefs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_notification_prefs ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_notification_prefs admin_notification_prefs_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_notification_prefs_own ON public.admin_notification_prefs USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: admin_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_notifications admin_notifications_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_notifications_own ON public.admin_notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: admin_push_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_push_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_conversations agent_conversations_tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agent_conversations_tenant_read ON public.agent_conversations FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: agent_conversations agent_conversations_tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agent_conversations_tenant_write ON public.agent_conversations USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: agent_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_messages agent_messages_tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agent_messages_tenant_read ON public.agent_messages FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: agent_messages agent_messages_tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agent_messages_tenant_write ON public.agent_messages USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: agent_pending_actions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_pending_actions ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_pending_actions agent_pending_actions_tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agent_pending_actions_tenant_read ON public.agent_pending_actions FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: agent_pending_actions agent_pending_actions_tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agent_pending_actions_tenant_write ON public.agent_pending_actions USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: agents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

--
-- Name: agents agents_self_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agents_self_select ON public.agents FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: pc_staff agents_self_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agents_self_select ON public.pc_staff FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: agents agents_self_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agents_self_update ON public.agents FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: pc_staff agents_self_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agents_self_update ON public.pc_staff FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: ai_credit_spends; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_credit_spends ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_generation_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_generation_log ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_generation_log ai_generation_log_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_generation_log_select ON public.ai_generation_log FOR SELECT USING (((tenant_id IN ( SELECT tenant_members.tenant_id
   FROM public.tenant_members
  WHERE (tenant_members.user_id = auth.uid()))) OR public.is_tenant_member(tenant_id)));


--
-- Name: ai_generation_packages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_generation_packages ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_generation_packages ai_generation_packages_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_generation_packages_public_read ON public.ai_generation_packages FOR SELECT USING (true);


--
-- Name: tenant_api_keys api_keys_tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY api_keys_tenant_read ON public.tenant_api_keys FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: tenant_api_keys api_keys_tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY api_keys_tenant_write ON public.tenant_api_keys USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: backup_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.backup_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: backup_runs backup_runs_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY backup_runs_select ON public.backup_runs FOR SELECT USING ((public.is_super_admin() OR (tenant_id IN ( SELECT tenant_members.tenant_id
   FROM public.tenant_members
  WHERE (tenant_members.user_id = auth.uid()))) OR public.is_tenant_member(tenant_id)));


--
-- Name: backup_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: backup_settings backup_settings_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY backup_settings_select ON public.backup_settings FOR SELECT USING (((tenant_id IN ( SELECT tenant_members.tenant_id
   FROM public.tenant_members
  WHERE (tenant_members.user_id = auth.uid()))) OR public.is_tenant_member(tenant_id)));


--
-- Name: booking_appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_availability; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_availability ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_blocked_dates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_blocked_dates ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: branch_product_availability branch_availability_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY branch_availability_public_read ON public.branch_product_availability FOR SELECT USING (true);


--
-- Name: branch_product_availability branch_availability_tenant_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY branch_availability_tenant_manage ON public.branch_product_availability USING ((EXISTS ( SELECT 1
   FROM public.restaurant_branches b
  WHERE ((b.id = branch_product_availability.branch_id) AND public.is_tenant_member(b.tenant_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.restaurant_branches b
  WHERE ((b.id = branch_product_availability.branch_id) AND public.is_tenant_member(b.tenant_id)))));


--
-- Name: branch_product_availability; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branch_product_availability ENABLE ROW LEVEL SECURITY;

--
-- Name: campaign_recipients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

--
-- Name: campaign_recipients campaign_recipients_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaign_recipients_read ON public.campaign_recipients FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: campaign_recipients campaign_recipients_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaign_recipients_write ON public.campaign_recipients USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: campaigns campaigns_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaigns_read ON public.campaigns FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: campaigns campaigns_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaigns_write ON public.campaigns USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: care_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.care_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: care_plans care_plans_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY care_plans_public_read ON public.care_plans FOR SELECT USING (is_active);


--
-- Name: care_prices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.care_prices ENABLE ROW LEVEL SECURITY;

--
-- Name: care_prices care_prices public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "care_prices public read" ON public.care_prices FOR SELECT USING (true);


--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: categories categories_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY categories_public_read ON public.categories FOR SELECT USING (true);


--
-- Name: categories categories_tenant_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY categories_tenant_all ON public.categories USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: chat_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_conversations chat_conversations_party_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chat_conversations_party_read ON public.chat_conversations FOR SELECT USING (((buyer_id = auth.uid()) OR public.owns_vendor(vendor_id)));


--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages chat_messages_party_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chat_messages_party_read ON public.chat_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chat_conversations c
  WHERE ((c.id = chat_messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR public.owns_vendor(c.vendor_id))))));


--
-- Name: collection_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.collection_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: collection_categories collection_categories_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY collection_categories_read ON public.collection_categories FOR SELECT USING (true);


--
-- Name: collection_categories collection_categories_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY collection_categories_write ON public.collection_categories USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: collection_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.collection_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: collection_entries collection_entries_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY collection_entries_read ON public.collection_entries FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id) OR ((status = 'published'::text) AND (EXISTS ( SELECT 1
   FROM public.collection_types t
  WHERE ((t.id = collection_entries.type_id) AND (t.visibility = 'public'::text)))))));


--
-- Name: collection_entries collection_entries_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY collection_entries_write ON public.collection_entries USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: collection_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.collection_types ENABLE ROW LEVEL SECURITY;

--
-- Name: collection_types collection_types_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY collection_types_read ON public.collection_types FOR SELECT USING (((visibility = 'public'::text) OR public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: collection_types collection_types_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY collection_types_write ON public.collection_types USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: contact_blocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_blocks ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_details ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_events ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_events contact_events_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contact_events_insert ON public.contact_events FOR INSERT WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: contact_events contact_events_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contact_events_read ON public.contact_events FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: contact_form_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_forms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_forms ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts contacts_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contacts_read ON public.contacts FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: contacts contacts_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contacts_write ON public.contacts USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: content_module_grants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_module_grants ENABLE ROW LEVEL SECURITY;

--
-- Name: content_module_grants content_module_grants_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_module_grants_read ON public.content_module_grants FOR SELECT USING ((public.has_content_access(tenant_id) OR (user_id = auth.uid())));


--
-- Name: content_module_grants content_module_grants_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_module_grants_write ON public.content_module_grants USING ((public.is_super_admin() OR (EXISTS ( SELECT 1
   FROM public.tenant_members
  WHERE ((tenant_members.tenant_id = content_module_grants.tenant_id) AND (tenant_members.user_id = auth.uid()) AND (tenant_members.role = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.content_module_grants g
  WHERE ((g.tenant_id = content_module_grants.tenant_id) AND (g.user_id = auth.uid()) AND (g.access_level = 'admin'::text)))) OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR (EXISTS ( SELECT 1
   FROM public.tenant_members
  WHERE ((tenant_members.tenant_id = content_module_grants.tenant_id) AND (tenant_members.user_id = auth.uid()) AND (tenant_members.role = ANY (ARRAY['owner'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.content_module_grants g
  WHERE ((g.tenant_id = content_module_grants.tenant_id) AND (g.user_id = auth.uid()) AND (g.access_level = 'admin'::text)))) OR public.is_tenant_member(tenant_id)));


--
-- Name: courier_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courier_events ENABLE ROW LEVEL SECURITY;

--
-- Name: courier_events courier_events_tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY courier_events_tenant_read ON public.courier_events FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: crm_sequence_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_sequence_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_sequence_runs crm_sequence_runs_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_sequence_runs_read ON public.crm_sequence_runs FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: crm_sequence_runs crm_sequence_runs_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_sequence_runs_write ON public.crm_sequence_runs USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: crm_sequences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_sequences ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_sequences crm_sequences_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_sequences_read ON public.crm_sequences FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: crm_sequences crm_sequences_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_sequences_write ON public.crm_sequences USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: crm_stages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_stages crm_stages_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_stages_read ON public.crm_stages FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: crm_stages crm_stages_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_stages_write ON public.crm_stages USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: crm_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_tasks crm_tasks_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_tasks_read ON public.crm_tasks FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: crm_tasks crm_tasks_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crm_tasks_write ON public.crm_tasks USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: customer_addresses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_addresses customer_addresses_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customer_addresses_own ON public.customer_addresses USING ((customer_id = auth.uid())) WITH CHECK ((customer_id = auth.uid()));


--
-- Name: customer_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_profiles customer_profiles_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customer_profiles_own_select ON public.customer_profiles FOR SELECT USING ((customer_id = auth.uid()));


--
-- Name: customer_profiles customer_profiles_own_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customer_profiles_own_update ON public.customer_profiles FOR UPDATE USING ((customer_id = auth.uid())) WITH CHECK ((customer_id = auth.uid()));


--
-- Name: customer_profiles customer_profiles_own_upsert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customer_profiles_own_upsert ON public.customer_profiles FOR INSERT WITH CHECK ((customer_id = auth.uid()));


--
-- Name: delivery_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.delivery_options ENABLE ROW LEVEL SECURITY;

--
-- Name: domain_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.domain_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: domain_orders domain_orders_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY domain_orders_select ON public.domain_orders FOR SELECT USING ((public.is_super_admin() OR (tenant_id IN ( SELECT tenant_members.tenant_id
   FROM public.tenant_members
  WHERE (tenant_members.user_id = auth.uid()))) OR public.is_tenant_member(tenant_id)));


--
-- Name: ecommerce_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ecommerce_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: email_zoho_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_zoho_connections ENABLE ROW LEVEL SECURITY;

--
-- Name: experts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

--
-- Name: experts experts_owner_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY experts_owner_write ON public.experts FOR UPDATE USING ((owner_user_id = auth.uid())) WITH CHECK ((owner_user_id = auth.uid()));


--
-- Name: experts experts_read_listed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY experts_read_listed ON public.experts FOR SELECT USING ((listed OR (owner_user_id = auth.uid())));


--
-- Name: feature_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_items ENABLE ROW LEVEL SECURITY;

--
-- Name: flash_sale_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.flash_sale_items ENABLE ROW LEVEL SECURITY;

--
-- Name: flash_sale_items flash_sale_items_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY flash_sale_items_public_read ON public.flash_sale_items FOR SELECT USING (true);


--
-- Name: flash_sales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

--
-- Name: flash_sales flash_sales_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY flash_sales_public_read ON public.flash_sales FOR SELECT USING ((status = 'active'::text));


--
-- Name: form_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submissions form_submissions_tenant_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submissions_tenant_delete ON public.form_submissions FOR DELETE USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: form_submissions form_submissions_tenant_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submissions_tenant_modify ON public.form_submissions FOR UPDATE USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: form_submissions form_submissions_tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submissions_tenant_read ON public.form_submissions FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: forms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

--
-- Name: forms forms_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY forms_public_read ON public.forms FOR SELECT USING (true);


--
-- Name: forms forms_tenant_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY forms_tenant_all ON public.forms USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: guide_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guide_events ENABLE ROW LEVEL SECURITY;

--
-- Name: homepage_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: homepage_settings homepage_settings_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY homepage_settings_read ON public.homepage_settings FOR SELECT USING (true);


--
-- Name: import_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: import_jobs import_jobs_member_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_jobs_member_read ON public.import_jobs FOR SELECT USING (public.is_tenant_member(tenant_id));


--
-- Name: invoice_counters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices invoices_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY invoices_read ON public.invoices FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: invoices invoices_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY invoices_write ON public.invoices USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: mcp_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mcp_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

--
-- Name: media media_tenant_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY media_tenant_all ON public.media USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: media_upload_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.media_upload_links ENABLE ROW LEVEL SECURITY;

--
-- Name: menus; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

--
-- Name: nav_menus; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nav_menus ENABLE ROW LEVEL SECURITY;

--
-- Name: nav_menus nav_menus_layout_lock_del; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nav_menus_layout_lock_del ON public.nav_menus AS RESTRICTIVE FOR DELETE USING (public.layout_writable(tenant_id));


--
-- Name: nav_menus nav_menus_layout_lock_ins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nav_menus_layout_lock_ins ON public.nav_menus AS RESTRICTIVE FOR INSERT WITH CHECK (public.layout_writable(tenant_id));


--
-- Name: nav_menus nav_menus_layout_lock_upd; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nav_menus_layout_lock_upd ON public.nav_menus AS RESTRICTIVE FOR UPDATE USING (public.layout_writable(tenant_id)) WITH CHECK (public.layout_writable(tenant_id));


--
-- Name: nav_menus nav_menus_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nav_menus_public_read ON public.nav_menus FOR SELECT USING (true);


--
-- Name: nav_menus nav_menus_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nav_menus_write ON public.nav_menus USING ((public.is_super_admin() OR ((tenant_id IS NOT NULL) AND public.is_tenant_member(tenant_id)) OR ((template_id IS NOT NULL) AND (template_id IN ( SELECT templates.id
   FROM public.templates
  WHERE (templates.owner_id = auth.uid())))))) WITH CHECK ((public.is_super_admin() OR ((tenant_id IS NOT NULL) AND public.is_tenant_member(tenant_id)) OR ((template_id IS NOT NULL) AND (template_id IN ( SELECT templates.id
   FROM public.templates
  WHERE (templates.owner_id = auth.uid()))))));


--
-- Name: notification_prefs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_build_jobs obj_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY obj_read ON public.onboarding_build_jobs FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: onboarding_build_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.onboarding_build_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: orders orders_customer_read_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY orders_customer_read_own ON public.orders FOR SELECT USING ((customer_id = auth.uid()));


--
-- Name: orders orders_tenant_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY orders_tenant_delete ON public.orders FOR DELETE USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: orders orders_tenant_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY orders_tenant_manage ON public.orders FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: orders orders_tenant_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY orders_tenant_update ON public.orders FOR UPDATE USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: page_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: page_categories page_categories_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY page_categories_read ON public.page_categories FOR SELECT USING (true);


--
-- Name: page_categories page_categories_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY page_categories_write ON public.page_categories USING ((EXISTS ( SELECT 1
   FROM public.pages p
  WHERE ((p.id = page_categories.page_id) AND (public.is_super_admin() OR public.is_tenant_editor(p.tenant_id)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.pages p
  WHERE ((p.id = page_categories.page_id) AND (public.is_super_admin() OR public.is_tenant_editor(p.tenant_id))))));


--
-- Name: page_redirects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_redirects ENABLE ROW LEVEL SECURITY;

--
-- Name: page_redirects page_redirects_member_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY page_redirects_member_delete ON public.page_redirects FOR DELETE USING (public.is_tenant_member(tenant_id));


--
-- Name: page_redirects page_redirects_member_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY page_redirects_member_read ON public.page_redirects FOR SELECT USING (public.is_tenant_member(tenant_id));


--
-- Name: page_snapshots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: page_snapshots page_snapshots_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY page_snapshots_select ON public.page_snapshots FOR SELECT USING (((tenant_id IN ( SELECT tenant_members.tenant_id
   FROM public.tenant_members
  WHERE (tenant_members.user_id = auth.uid()))) OR public.is_tenant_member(tenant_id)));


--
-- Name: page_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: page_tags page_tags_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY page_tags_read ON public.page_tags FOR SELECT USING (true);


--
-- Name: page_tags page_tags_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY page_tags_write ON public.page_tags USING ((EXISTS ( SELECT 1
   FROM public.pages p
  WHERE ((p.id = page_tags.page_id) AND (public.is_super_admin() OR public.is_tenant_editor(p.tenant_id)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.pages p
  WHERE ((p.id = page_tags.page_id) AND (public.is_super_admin() OR public.is_tenant_editor(p.tenant_id))))));


--
-- Name: page_view_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_view_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

--
-- Name: pages pages_layout_lock_del; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pages_layout_lock_del ON public.pages AS RESTRICTIVE FOR DELETE USING (public.layout_writable(tenant_id));


--
-- Name: pages pages_layout_lock_ins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pages_layout_lock_ins ON public.pages AS RESTRICTIVE FOR INSERT WITH CHECK (public.layout_writable(tenant_id));


--
-- Name: pages pages_layout_lock_upd; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pages_layout_lock_upd ON public.pages AS RESTRICTIVE FOR UPDATE USING (public.layout_writable(tenant_id)) WITH CHECK (public.layout_writable(tenant_id));


--
-- Name: pages pages_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pages_public_read ON public.pages FOR SELECT USING (((status = 'published'::text) AND (deleted_at IS NULL)));


--
-- Name: pages pages_tenant_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pages_tenant_all ON public.pages USING ((public.is_super_admin() OR ((tenant_id IS NOT NULL) AND public.is_tenant_member(tenant_id)) OR ((template_id IS NOT NULL) AND (template_id IN ( SELECT templates.id
   FROM public.templates
  WHERE (templates.owner_id = auth.uid())))))) WITH CHECK ((public.is_super_admin() OR ((tenant_id IS NOT NULL) AND public.is_tenant_member(tenant_id)) OR ((template_id IS NOT NULL) AND (template_id IN ( SELECT templates.id
   FROM public.templates
  WHERE (templates.owner_id = auth.uid()))))));


--
-- Name: partner_credit_moves; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_credit_moves ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_credit_moves partner_credit_moves_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY partner_credit_moves_own ON public.partner_credit_moves FOR SELECT USING ((public.is_super_admin() OR (partner_id IN ( SELECT partners.id
   FROM public.partners
  WHERE (partners.user_id = auth.uid())))));


--
-- Name: partners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

--
-- Name: partners partners_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY partners_own_select ON public.partners FOR SELECT USING (((user_id = auth.uid()) OR public.is_super_admin()));


--
-- Name: payment_gateways; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

--
-- Name: pc_staff; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pc_staff ENABLE ROW LEVEL SECURITY;

--
-- Name: plan_prices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;

--
-- Name: plan_prices plan_prices public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "plan_prices public read" ON public.plan_prices FOR SELECT USING (true);


--
-- Name: plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

--
-- Name: plans plans_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY plans_public_read ON public.plans FOR SELECT USING ((is_active = true));


--
-- Name: platform_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_settings platform_settings_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY platform_settings_read ON public.platform_settings FOR SELECT USING (true);


--
-- Name: plugins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;

--
-- Name: plugins plugins_tenant_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY plugins_tenant_all ON public.plugins USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: portfolio_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.portfolio_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: portfolio_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

--
-- Name: price_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.price_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: price_requests price_requests_editor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY price_requests_editor ON public.price_requests USING (public.is_tenant_editor(tenant_id)) WITH CHECK (public.is_tenant_editor(tenant_id));


--
-- Name: pricing_packages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pricing_packages ENABLE ROW LEVEL SECURITY;

--
-- Name: pricing_tables; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pricing_tables ENABLE ROW LEVEL SECURITY;

--
-- Name: product_option_presets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_option_presets ENABLE ROW LEVEL SECURITY;

--
-- Name: product_option_presets product_option_presets_editor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_option_presets_editor ON public.product_option_presets USING (public.is_tenant_editor(tenant_id)) WITH CHECK (public.is_tenant_editor(tenant_id));


--
-- Name: product_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: product_reviews product_reviews_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_reviews_public_read ON public.product_reviews FOR SELECT USING ((status = 'published'::text));


--
-- Name: product_reviews product_reviews_tenant_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_reviews_tenant_manage ON public.product_reviews USING (public.is_tenant_editor(tenant_id)) WITH CHECK (public.is_tenant_editor(tenant_id));


--
-- Name: product_stock_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_stock_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: product_stock_alerts product_stock_alerts_editor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_stock_alerts_editor ON public.product_stock_alerts USING (public.is_tenant_editor(tenant_id)) WITH CHECK (public.is_tenant_editor(tenant_id));


--
-- Name: product_variants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

--
-- Name: product_variants product_variants_tenant_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_variants_tenant_manage ON public.product_variants USING ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_variants.product_id) AND (p.vendor_id IS NULL) AND public.is_tenant_editor(p.tenant_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_variants.product_id) AND (p.vendor_id IS NULL) AND public.is_tenant_editor(p.tenant_id)))));


--
-- Name: product_variants product_variants_vendor_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_variants_vendor_manage ON public.product_variants USING ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_variants.product_id) AND (p.vendor_id IS NOT NULL) AND public.owns_vendor(p.vendor_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_variants.product_id) AND (p.vendor_id IS NOT NULL) AND public.owns_vendor(p.vendor_id)))));


--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: products products_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY products_public_read ON public.products FOR SELECT USING (((status = 'active'::text) AND ((vendor_id IS NULL) OR (approval_status = 'approved'::text))));


--
-- Name: products products_tenant_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY products_tenant_all ON public.products USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: products products_vendor_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY products_vendor_manage ON public.products USING (((vendor_id IS NOT NULL) AND public.owns_vendor(vendor_id))) WITH CHECK (((vendor_id IS NOT NULL) AND public.owns_vendor(vendor_id)));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: page_view_stats pvs_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pvs_read ON public.page_view_stats FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: re_communities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.re_communities ENABLE ROW LEVEL SECURITY;

--
-- Name: re_communities re_communities_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY re_communities_read ON public.re_communities FOR SELECT USING (true);


--
-- Name: re_communities re_communities_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY re_communities_write ON public.re_communities USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: re_developers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.re_developers ENABLE ROW LEVEL SECURITY;

--
-- Name: re_developers re_developers_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY re_developers_read ON public.re_developers FOR SELECT USING (true);


--
-- Name: re_developers re_developers_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY re_developers_write ON public.re_developers USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: re_properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.re_properties ENABLE ROW LEVEL SECURITY;

--
-- Name: re_properties re_properties_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY re_properties_read ON public.re_properties FOR SELECT USING (((status <> 'draft'::text) OR public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: re_properties re_properties_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY re_properties_write ON public.re_properties USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: receipt_counters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.receipt_counters ENABLE ROW LEVEL SECURITY;

--
-- Name: receipt_counters receipt_counters_sa_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY receipt_counters_sa_read ON public.receipt_counters FOR SELECT USING (public.is_super_admin());


--
-- Name: restaurant_branches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.restaurant_branches ENABLE ROW LEVEL SECURITY;

--
-- Name: restaurant_branches restaurant_branches_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY restaurant_branches_public_read ON public.restaurant_branches FOR SELECT USING ((is_active = true));


--
-- Name: restaurant_branches restaurant_branches_tenant_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY restaurant_branches_tenant_manage ON public.restaurant_branches USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));


--
-- Name: restaurant_reservations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.restaurant_reservations ENABLE ROW LEVEL SECURITY;

--
-- Name: restaurant_reservations restaurant_reservations_tenant_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY restaurant_reservations_tenant_manage ON public.restaurant_reservations USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));


--
-- Name: restaurant_riders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.restaurant_riders ENABLE ROW LEVEL SECURITY;

--
-- Name: restaurant_riders restaurant_riders_tenant_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY restaurant_riders_tenant_manage ON public.restaurant_riders USING ((EXISTS ( SELECT 1
   FROM public.restaurant_branches b
  WHERE ((b.id = restaurant_riders.branch_id) AND public.is_tenant_member(b.tenant_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.restaurant_branches b
  WHERE ((b.id = restaurant_riders.branch_id) AND public.is_tenant_member(b.tenant_id)))));


--
-- Name: restaurant_tables; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

--
-- Name: restaurant_tables restaurant_tables_tenant_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY restaurant_tables_tenant_manage ON public.restaurant_tables USING ((EXISTS ( SELECT 1
   FROM public.restaurant_branches b
  WHERE ((b.id = restaurant_tables.branch_id) AND public.is_tenant_member(b.tenant_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.restaurant_branches b
  WHERE ((b.id = restaurant_tables.branch_id) AND public.is_tenant_member(b.tenant_id)))));


--
-- Name: section_preset_saves; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.section_preset_saves ENABLE ROW LEVEL SECURITY;

--
-- Name: section_preset_saves section_preset_saves_tenant_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY section_preset_saves_tenant_all ON public.section_preset_saves USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: service_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: service_categories service_categories_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_categories_read ON public.service_categories FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: service_categories service_categories_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_categories_write ON public.service_categories USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: service_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: service_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;

--
-- Name: shipping_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: shipping_rates shipping_rates_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY shipping_rates_public_read ON public.shipping_rates FOR SELECT USING (true);


--
-- Name: shipping_rates shipping_rates_tenant_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY shipping_rates_tenant_all ON public.shipping_rates USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: site_chat_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_chat_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: site_chat_conversations site_chat_conversations_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY site_chat_conversations_read ON public.site_chat_conversations FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: site_chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: site_chat_messages site_chat_messages_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY site_chat_messages_read ON public.site_chat_messages FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: site_chat_training; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_chat_training ENABLE ROW LEVEL SECURITY;

--
-- Name: site_chat_training site_chat_training_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY site_chat_training_read ON public.site_chat_training FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.tenant_members m
  WHERE ((m.tenant_id = site_chat_training.tenant_id) AND (m.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.tenants t
  WHERE ((t.id = site_chat_training.tenant_id) AND (t.owner_id = auth.uid())))) OR public.is_tenant_member(tenant_id)));


--
-- Name: site_identity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_identity ENABLE ROW LEVEL SECURITY;

--
-- Name: site_identity site_identity_layout_lock_del; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY site_identity_layout_lock_del ON public.site_identity AS RESTRICTIVE FOR DELETE USING (public.layout_writable(tenant_id));


--
-- Name: site_identity site_identity_layout_lock_ins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY site_identity_layout_lock_ins ON public.site_identity AS RESTRICTIVE FOR INSERT WITH CHECK (public.layout_writable(tenant_id));


--
-- Name: site_identity site_identity_layout_lock_upd; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY site_identity_layout_lock_upd ON public.site_identity AS RESTRICTIVE FOR UPDATE USING (public.layout_writable(tenant_id)) WITH CHECK (public.layout_writable(tenant_id));


--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings site_settings_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY site_settings_public_read ON public.site_settings FOR SELECT USING (true);


--
-- Name: site_settings site_settings_tenant_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY site_settings_tenant_all ON public.site_settings USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: site_visitor_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_visitor_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: site_visitors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;

--
-- Name: slider_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.slider_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: slider_slides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.slider_slides ENABLE ROW LEVEL SECURITY;

--
-- Name: spam_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.spam_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: sub_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sub_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: sub_orders sub_orders_tenant_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sub_orders_tenant_all ON public.sub_orders USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: sub_orders sub_orders_vendor_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sub_orders_vendor_read ON public.sub_orders FOR SELECT USING (public.owns_vendor(vendor_id));


--
-- Name: sub_orders sub_orders_vendor_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sub_orders_vendor_update ON public.sub_orders FOR UPDATE USING (public.owns_vendor(vendor_id)) WITH CHECK (public.owns_vendor(vendor_id));


--
-- Name: subscription_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_payments subscription_payments_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY subscription_payments_read ON public.subscription_payments FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions subscriptions_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY subscriptions_select ON public.subscriptions FOR SELECT USING ((public.is_super_admin() OR (tenant_id IN ( SELECT tenant_members.tenant_id
   FROM public.tenant_members
  WHERE (tenant_members.user_id = auth.uid()))) OR public.is_tenant_member(tenant_id)));


--
-- Name: super_admins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

--
-- Name: super_admins super_admins_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY super_admins_select ON public.super_admins FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: support_ticket_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_business_profiles tbp_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tbp_read ON public.tenant_business_profiles FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: tenant_business_profiles tbp_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tbp_write ON public.tenant_business_profiles USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: template_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: template_categories template_categories_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY template_categories_read ON public.template_categories FOR SELECT USING (((status = 'active'::text) OR public.is_super_admin()));


--
-- Name: template_categories template_categories_request; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY template_categories_request ON public.template_categories FOR INSERT WITH CHECK (((status = 'pending'::text) AND (requested_by = auth.uid())));


--
-- Name: template_categories template_categories_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY template_categories_write ON public.template_categories USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());


--
-- Name: templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

--
-- Name: templates templates_owner_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY templates_owner_write ON public.templates USING (((owner_id = auth.uid()) OR public.is_super_admin())) WITH CHECK (((owner_id = auth.uid()) OR public.is_super_admin()));


--
-- Name: templates templates_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY templates_public_read ON public.templates FOR SELECT USING ((((status = 'published'::text) AND (active = true)) OR (owner_id = auth.uid()) OR public.is_super_admin()));


--
-- Name: tenant_alias_domains; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_alias_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_business_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_business_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_email_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_email_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_email_settings tenant_email_settings_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_email_settings_read ON public.tenant_email_settings FOR SELECT USING (public.is_tenant_member(tenant_id));


--
-- Name: tenant_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_low_stock_notices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_low_stock_notices ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_members tenant_members_self_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_members_self_read ON public.tenant_members FOR SELECT USING (((user_id = auth.uid()) OR public.is_super_admin()));


--
-- Name: tenant_ownership_transfers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_ownership_transfers ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_payment_methods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_payment_methods ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_payment_methods tenant_payment_methods_editor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_payment_methods_editor ON public.tenant_payment_methods USING (public.is_tenant_editor(tenant_id)) WITH CHECK (public.is_tenant_editor(tenant_id));


--
-- Name: booking_appointments tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.booking_appointments FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: booking_availability tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.booking_availability FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: booking_blocked_dates tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.booking_blocked_dates FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: booking_settings tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.booking_settings FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: contact_details tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.contact_details FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: contact_form_submissions tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.contact_form_submissions FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: contact_forms tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.contact_forms FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: feature_groups tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.feature_groups FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: feature_items tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.feature_items FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: nav_menus tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.nav_menus FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: portfolio_groups tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.portfolio_groups FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: portfolio_items tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.portfolio_items FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: pricing_packages tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.pricing_packages FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: pricing_tables tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.pricing_tables FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: service_groups tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.service_groups FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: service_items tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.service_items FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: site_identity tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.site_identity FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: slider_groups tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.slider_groups FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: slider_slides tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.slider_slides FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: testimonial_groups tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.testimonial_groups FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: testimonials tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_read ON public.testimonials FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: tenants tenant_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_select ON public.tenants FOR SELECT USING ((public.is_super_admin() OR (id IN ( SELECT tenant_members.tenant_id
   FROM public.tenant_members
  WHERE (tenant_members.user_id = auth.uid())))));


--
-- Name: tenant_template_imports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_template_imports ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants tenant_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_update ON public.tenants FOR UPDATE USING ((public.is_super_admin() OR (id IN ( SELECT tenant_members.tenant_id
   FROM public.tenant_members
  WHERE ((tenant_members.user_id = auth.uid()) AND (tenant_members.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));


--
-- Name: tenant_visit_counters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_visit_counters ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_appointments tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.booking_appointments USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: booking_availability tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.booking_availability USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: booking_blocked_dates tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.booking_blocked_dates USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: booking_settings tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.booking_settings USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: contact_details tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.contact_details USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: contact_form_submissions tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.contact_form_submissions USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: contact_forms tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.contact_forms USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: feature_groups tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.feature_groups USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: feature_items tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.feature_items USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: nav_menus tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.nav_menus USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: portfolio_groups tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.portfolio_groups USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: portfolio_items tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.portfolio_items USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: pricing_packages tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.pricing_packages USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: pricing_tables tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.pricing_tables USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: service_groups tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.service_groups USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: service_items tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.service_items USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: site_identity tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.site_identity USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: slider_groups tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.slider_groups USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: slider_slides tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.slider_slides USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: testimonial_groups tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.testimonial_groups USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: testimonials tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_write ON public.testimonials USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: testimonial_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.testimonial_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: testimonials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

--
-- Name: themes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

--
-- Name: themes themes_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY themes_public_read ON public.themes FOR SELECT USING (true);


--
-- Name: themes themes_tenant_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY themes_tenant_all ON public.themes USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: support_ticket_messages ticket_messages_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ticket_messages_insert ON public.support_ticket_messages FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (user_id = auth.uid()) AND (is_internal = false) AND (ticket_id IN ( SELECT support_tickets.id
   FROM public.support_tickets
  WHERE ((support_tickets.user_id = auth.uid()) OR (support_tickets.tenant_id IN ( SELECT tenant_members.tenant_id
           FROM public.tenant_members
          WHERE (tenant_members.user_id = auth.uid()))))))));


--
-- Name: support_ticket_messages ticket_messages_insert_super_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ticket_messages_insert_super_admin ON public.support_ticket_messages FOR INSERT WITH CHECK ((public.is_super_admin() AND (user_id = auth.uid())));


--
-- Name: support_ticket_messages ticket_messages_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ticket_messages_select ON public.support_ticket_messages FOR SELECT USING ((public.is_super_admin() OR ((NOT is_internal) AND (ticket_id IN ( SELECT support_tickets.id
   FROM public.support_tickets
  WHERE ((support_tickets.visibility = 'client'::text) AND ((support_tickets.user_id = auth.uid()) OR (support_tickets.tenant_id IN ( SELECT tenant_members.tenant_id
           FROM public.tenant_members
          WHERE (tenant_members.user_id = auth.uid()))))))))));


--
-- Name: support_tickets tickets_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tickets_insert ON public.support_tickets FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (user_id = auth.uid()) AND ((tenant_id IS NULL) OR (tenant_id IN ( SELECT tenant_members.tenant_id
   FROM public.tenant_members
  WHERE (tenant_members.user_id = auth.uid()))))));


--
-- Name: support_tickets tickets_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tickets_select ON public.support_tickets FOR SELECT USING ((public.is_super_admin() OR ((visibility = 'client'::text) AND ((user_id = auth.uid()) OR (tenant_id IN ( SELECT tenant_members.tenant_id
   FROM public.tenant_members
  WHERE (tenant_members.user_id = auth.uid())))))));


--
-- Name: support_tickets tickets_update_owner_reopen; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tickets_update_owner_reopen ON public.support_tickets FOR UPDATE USING (((user_id = auth.uid()) OR (tenant_id IN ( SELECT tenant_members.tenant_id
   FROM public.tenant_members
  WHERE (tenant_members.user_id = auth.uid()))))) WITH CHECK (((user_id = auth.uid()) OR (tenant_id IN ( SELECT tenant_members.tenant_id
   FROM public.tenant_members
  WHERE (tenant_members.user_id = auth.uid())))));


--
-- Name: tenant_low_stock_notices tlsn_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tlsn_read ON public.tenant_low_stock_notices FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions transactions_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY transactions_public_read ON public.transactions FOR SELECT USING ((is_public = true));


--
-- Name: transactions transactions_tenant_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY transactions_tenant_all ON public.transactions USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: tenant_template_imports tti_tenant_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tti_tenant_read ON public.tenant_template_imports FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: tenant_template_imports tti_tenant_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tti_tenant_write ON public.tenant_template_imports USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: tenant_visit_counters tvc_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tvc_read ON public.tenant_visit_counters FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: vendor_courier_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_courier_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: vendors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

--
-- Name: vendors vendors_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vendors_read ON public.vendors FOR SELECT USING ((public.is_super_admin() OR public.is_tenant_member(tenant_id)));


--
-- Name: vendors vendors_self_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vendors_self_read ON public.vendors FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: vendors vendors_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vendors_write ON public.vendors USING ((public.is_super_admin() OR public.is_tenant_editor(tenant_id))) WITH CHECK ((public.is_super_admin() OR public.is_tenant_editor(tenant_id)));


--
-- Name: voucher_redemptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

--
-- Name: vouchers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

--
-- Name: vouchers vouchers_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vouchers_public_read ON public.vouchers FOR SELECT USING (((status = 'active'::text) AND is_public));


--
-- Name: web_push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: wishlist_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

--
-- Name: wishlist_items wishlist_items_own_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY wishlist_items_own_delete ON public.wishlist_items FOR DELETE USING ((customer_id = auth.uid()));


--
-- Name: wishlist_items wishlist_items_own_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY wishlist_items_own_insert ON public.wishlist_items FOR INSERT WITH CHECK ((customer_id = auth.uid()));


--
-- Name: wishlist_items wishlist_items_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY wishlist_items_own_select ON public.wishlist_items FOR SELECT USING ((customer_id = auth.uid()));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION action_app_row(p_actor uuid, p_tenant uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.action_app_row(p_actor uuid, p_tenant uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.action_app_row(p_actor uuid, p_tenant uuid) TO service_role;


--
-- Name: FUNCTION action_changed(o jsonb, n jsonb, watch text[], skip text[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.action_changed(o jsonb, n jsonb, watch text[], skip text[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.action_changed(o jsonb, n jsonb, watch text[], skip text[]) TO service_role;


--
-- Name: FUNCTION action_values(o jsonb, cols text[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.action_values(o jsonb, cols text[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.action_values(o jsonb, cols text[]) TO service_role;


--
-- Name: FUNCTION ai_credit_usage(p_tenant uuid, p_since timestamp with time zone); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.ai_credit_usage(p_tenant uuid, p_since timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION public.ai_credit_usage(p_tenant uuid, p_since timestamp with time zone) TO service_role;


--
-- Name: FUNCTION apply_migration_009(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.apply_migration_009() FROM PUBLIC;
GRANT ALL ON FUNCTION public.apply_migration_009() TO service_role;


--
-- Name: FUNCTION apply_migration_010(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.apply_migration_010() FROM PUBLIC;
GRANT ALL ON FUNCTION public.apply_migration_010() TO service_role;


--
-- Name: FUNCTION apply_migration_011(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.apply_migration_011() FROM PUBLIC;
GRANT ALL ON FUNCTION public.apply_migration_011() TO service_role;


--
-- Name: FUNCTION audit_acting_as(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.audit_acting_as() FROM PUBLIC;
GRANT ALL ON FUNCTION public.audit_acting_as() TO service_role;


--
-- Name: FUNCTION bump_page_view_stats(t uuid, p_path text, p_referrer_domain text, p_device_type text, p_country text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.bump_page_view_stats(t uuid, p_path text, p_referrer_domain text, p_device_type text, p_country text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.bump_page_view_stats(t uuid, p_path text, p_referrer_domain text, p_device_type text, p_country text) TO service_role;


--
-- Name: FUNCTION bump_tenant_views(t uuid, n integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.bump_tenant_views(t uuid, n integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.bump_tenant_views(t uuid, n integer) TO service_role;


--
-- Name: FUNCTION can_edit_content(t uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.can_edit_content(t uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.can_edit_content(t uuid) TO authenticated;
GRANT ALL ON FUNCTION public.can_edit_content(t uuid) TO service_role;


--
-- Name: FUNCTION check_page_parent(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.check_page_parent() TO anon;
GRANT ALL ON FUNCTION public.check_page_parent() TO authenticated;
GRANT ALL ON FUNCTION public.check_page_parent() TO service_role;


--
-- Name: FUNCTION claim_flash_quantity(item uuid, qty integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.claim_flash_quantity(item uuid, qty integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.claim_flash_quantity(item uuid, qty integer) TO service_role;


--
-- Name: FUNCTION clear_page_redirect_on_insert(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.clear_page_redirect_on_insert() TO anon;
GRANT ALL ON FUNCTION public.clear_page_redirect_on_insert() TO authenticated;
GRANT ALL ON FUNCTION public.clear_page_redirect_on_insert() TO service_role;


--
-- Name: FUNCTION consume_free_build_credit(t uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.consume_free_build_credit(t uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.consume_free_build_credit(t uuid) TO service_role;


--
-- Name: FUNCTION current_tenant_id(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.current_tenant_id() TO anon;
GRANT ALL ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT ALL ON FUNCTION public.current_tenant_id() TO service_role;


--
-- Name: FUNCTION current_vendor_id(t uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.current_vendor_id(t uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.current_vendor_id(t uuid) TO anon;
GRANT ALL ON FUNCTION public.current_vendor_id(t uuid) TO authenticated;
GRANT ALL ON FUNCTION public.current_vendor_id(t uuid) TO service_role;


--
-- Name: FUNCTION db_audit_value(k text, v jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.db_audit_value(k text, v jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.db_audit_value(k text, v jsonb) TO service_role;


--
-- Name: FUNCTION discard_page_draft(p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.discard_page_draft(p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.discard_page_draft(p_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.discard_page_draft(p_id uuid) TO service_role;


--
-- Name: FUNCTION ecommerce_on_with_products(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.ecommerce_on_with_products() TO anon;
GRANT ALL ON FUNCTION public.ecommerce_on_with_products() TO authenticated;
GRANT ALL ON FUNCTION public.ecommerce_on_with_products() TO service_role;


--
-- Name: FUNCTION enforce_page_limit(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.enforce_page_limit() TO anon;
GRANT ALL ON FUNCTION public.enforce_page_limit() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_page_limit() TO service_role;


--
-- Name: FUNCTION ensure_booking_defaults(p_tenant uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.ensure_booking_defaults(p_tenant uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.ensure_booking_defaults(p_tenant uuid) TO service_role;


--
-- Name: FUNCTION experts_assign_founding(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.experts_assign_founding() FROM PUBLIC;
GRANT ALL ON FUNCTION public.experts_assign_founding() TO service_role;


--
-- Name: FUNCTION guard_tenant_columns(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.guard_tenant_columns() FROM PUBLIC;
GRANT ALL ON FUNCTION public.guard_tenant_columns() TO service_role;


--
-- Name: FUNCTION guard_tenant_owner(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.guard_tenant_owner() FROM PUBLIC;
GRANT ALL ON FUNCTION public.guard_tenant_owner() TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;
GRANT ALL ON FUNCTION public.handle_new_user() TO supabase_auth_admin;


--
-- Name: FUNCTION has_content_access(t uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.has_content_access(t uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.has_content_access(t uuid) TO authenticated;
GRANT ALL ON FUNCTION public.has_content_access(t uuid) TO service_role;


--
-- Name: FUNCTION import_job_list(p_tenant uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.import_job_list(p_tenant uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.import_job_list(p_tenant uuid) TO service_role;


--
-- Name: FUNCTION is_super_admin(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_super_admin() TO anon;
GRANT ALL ON FUNCTION public.is_super_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_super_admin() TO service_role;


--
-- Name: FUNCTION is_tenant_editor(t uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_tenant_editor(t uuid) TO anon;
GRANT ALL ON FUNCTION public.is_tenant_editor(t uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_tenant_editor(t uuid) TO service_role;


--
-- Name: FUNCTION is_tenant_member(t uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_tenant_member(t uuid) TO anon;
GRANT ALL ON FUNCTION public.is_tenant_member(t uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_tenant_member(t uuid) TO service_role;


--
-- Name: FUNCTION is_translated_page(p_tenant uuid, p_slug text, p_seo jsonb); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_translated_page(p_tenant uuid, p_slug text, p_seo jsonb) TO anon;
GRANT ALL ON FUNCTION public.is_translated_page(p_tenant uuid, p_slug text, p_seo jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.is_translated_page(p_tenant uuid, p_slug text, p_seo jsonb) TO service_role;


--
-- Name: FUNCTION layout_writable(t uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.layout_writable(t uuid) TO anon;
GRANT ALL ON FUNCTION public.layout_writable(t uuid) TO authenticated;
GRANT ALL ON FUNCTION public.layout_writable(t uuid) TO service_role;


--
-- Name: FUNCTION log_db_change(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.log_db_change() FROM PUBLIC;
GRANT ALL ON FUNCTION public.log_db_change() TO service_role;


--
-- Name: FUNCTION log_team_action(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.log_team_action() FROM PUBLIC;
GRANT ALL ON FUNCTION public.log_team_action() TO service_role;


--
-- Name: FUNCTION log_team_auth_action(p_actor uuid, p_action text, p_target uuid, p_args jsonb, p_via text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.log_team_auth_action(p_actor uuid, p_action text, p_target uuid, p_args jsonb, p_via text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.log_team_auth_action(p_actor uuid, p_action text, p_target uuid, p_args jsonb, p_via text) TO service_role;


--
-- Name: FUNCTION log_team_sign_in(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.log_team_sign_in() FROM PUBLIC;
GRANT ALL ON FUNCTION public.log_team_sign_in() TO service_role;


--
-- Name: FUNCTION media_usage(p_tenant uuid, p_url text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.media_usage(p_tenant uuid, p_url text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.media_usage(p_tenant uuid, p_url text) TO service_role;


--
-- Name: FUNCTION new_partner_code(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.new_partner_code() TO anon;
GRANT ALL ON FUNCTION public.new_partner_code() TO authenticated;
GRANT ALL ON FUNCTION public.new_partner_code() TO service_role;


--
-- Name: FUNCTION next_invoice_number(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.next_invoice_number() TO service_role;


--
-- Name: FUNCTION next_receipt_number(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.next_receipt_number() FROM PUBLIC;
GRANT ALL ON FUNCTION public.next_receipt_number() TO service_role;


--
-- Name: FUNCTION next_sub_order_number(prefix text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.next_sub_order_number(prefix text) TO anon;
GRANT ALL ON FUNCTION public.next_sub_order_number(prefix text) TO authenticated;
GRANT ALL ON FUNCTION public.next_sub_order_number(prefix text) TO service_role;


--
-- Name: FUNCTION owns_vendor(v uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.owns_vendor(v uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.owns_vendor(v uuid) TO anon;
GRANT ALL ON FUNCTION public.owns_vendor(v uuid) TO authenticated;
GRANT ALL ON FUNCTION public.owns_vendor(v uuid) TO service_role;


--
-- Name: FUNCTION pages_bump_draft_rev(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.pages_bump_draft_rev() TO anon;
GRANT ALL ON FUNCTION public.pages_bump_draft_rev() TO authenticated;
GRANT ALL ON FUNCTION public.pages_bump_draft_rev() TO service_role;


--
-- Name: FUNCTION prune_old_page_snapshots(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.prune_old_page_snapshots() TO anon;
GRANT ALL ON FUNCTION public.prune_old_page_snapshots() TO authenticated;
GRANT ALL ON FUNCTION public.prune_old_page_snapshots() TO service_role;


--
-- Name: FUNCTION prune_page_view_stats(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.prune_page_view_stats() TO anon;
GRANT ALL ON FUNCTION public.prune_page_view_stats() TO authenticated;
GRANT ALL ON FUNCTION public.prune_page_view_stats() TO service_role;


--
-- Name: FUNCTION publish_due_scheduled(p_tenant uuid, p_all boolean); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.publish_due_scheduled(p_tenant uuid, p_all boolean) TO anon;
GRANT ALL ON FUNCTION public.publish_due_scheduled(p_tenant uuid, p_all boolean) TO authenticated;
GRANT ALL ON FUNCTION public.publish_due_scheduled(p_tenant uuid, p_all boolean) TO service_role;


--
-- Name: FUNCTION publish_page(p_id uuid, p_blocks jsonb, p_expected_rev integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.publish_page(p_id uuid, p_blocks jsonb, p_expected_rev integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.publish_page(p_id uuid, p_blocks jsonb, p_expected_rev integer) TO authenticated;
GRANT ALL ON FUNCTION public.publish_page(p_id uuid, p_blocks jsonb, p_expected_rev integer) TO service_role;


--
-- Name: FUNCTION record_page_redirect(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.record_page_redirect() TO anon;
GRANT ALL ON FUNCTION public.record_page_redirect() TO authenticated;
GRANT ALL ON FUNCTION public.record_page_redirect() TO service_role;


--
-- Name: FUNCTION refresh_review_aggregates(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.refresh_review_aggregates() TO anon;
GRANT ALL ON FUNCTION public.refresh_review_aggregates() TO authenticated;
GRANT ALL ON FUNCTION public.refresh_review_aggregates() TO service_role;


--
-- Name: FUNCTION save_page_blocks(p_id uuid, p_blocks jsonb, p_expected_rev integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.save_page_blocks(p_id uuid, p_blocks jsonb, p_expected_rev integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_page_blocks(p_id uuid, p_blocks jsonb, p_expected_rev integer) TO authenticated;
GRANT ALL ON FUNCTION public.save_page_blocks(p_id uuid, p_blocks jsonb, p_expected_rev integer) TO service_role;


--
-- Name: FUNCTION search_tenant_users(t uuid, q text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.search_tenant_users(t uuid, q text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.search_tenant_users(t uuid, q text) TO authenticated;
GRANT ALL ON FUNCTION public.search_tenant_users(t uuid, q text) TO service_role;


--
-- Name: FUNCTION set_page_parent(p_page_ids uuid[], p_parent_id uuid, p_own_slug text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.set_page_parent(p_page_ids uuid[], p_parent_id uuid, p_own_slug text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_page_parent(p_page_ids uuid[], p_parent_id uuid, p_own_slug text) TO authenticated;
GRANT ALL ON FUNCTION public.set_page_parent(p_page_ids uuid[], p_parent_id uuid, p_own_slug text) TO service_role;


--
-- Name: FUNCTION set_tenant_context(p_tenant_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.set_tenant_context(p_tenant_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_tenant_context(p_tenant_id uuid) TO service_role;


--
-- Name: FUNCTION set_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.set_updated_at() TO anon;
GRANT ALL ON FUNCTION public.set_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;


--
-- Name: FUNCTION snapshot_page_before_blocks_change(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.snapshot_page_before_blocks_change() TO anon;
GRANT ALL ON FUNCTION public.snapshot_page_before_blocks_change() TO authenticated;
GRANT ALL ON FUNCTION public.snapshot_page_before_blocks_change() TO service_role;


--
-- Name: FUNCTION staff_can_edit_site(t uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.staff_can_edit_site(t uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.staff_can_edit_site(t uuid) TO anon;
GRANT ALL ON FUNCTION public.staff_can_edit_site(t uuid) TO authenticated;
GRANT ALL ON FUNCTION public.staff_can_edit_site(t uuid) TO service_role;


--
-- Name: FUNCTION sub_orders_vendor_guard(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sub_orders_vendor_guard() TO anon;
GRANT ALL ON FUNCTION public.sub_orders_vendor_guard() TO authenticated;
GRANT ALL ON FUNCTION public.sub_orders_vendor_guard() TO service_role;


--
-- Name: FUNCTION support_tickets_owner_update_guard(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.support_tickets_owner_update_guard() TO anon;
GRANT ALL ON FUNCTION public.support_tickets_owner_update_guard() TO authenticated;
GRANT ALL ON FUNCTION public.support_tickets_owner_update_guard() TO service_role;


--
-- Name: FUNCTION sync_subscription_demo(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sync_subscription_demo() TO anon;
GRANT ALL ON FUNCTION public.sync_subscription_demo() TO authenticated;
GRANT ALL ON FUNCTION public.sync_subscription_demo() TO service_role;


--
-- Name: FUNCTION sync_tenant_demo(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sync_tenant_demo() TO anon;
GRANT ALL ON FUNCTION public.sync_tenant_demo() TO authenticated;
GRANT ALL ON FUNCTION public.sync_tenant_demo() TO service_role;


--
-- Name: FUNCTION tenant_page_usage(p_tenant uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.tenant_page_usage(p_tenant uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.tenant_page_usage(p_tenant uuid) TO service_role;


--
-- Name: FUNCTION tenant_views_this_month(t uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tenant_views_this_month(t uuid) TO anon;
GRANT ALL ON FUNCTION public.tenant_views_this_month(t uuid) TO authenticated;
GRANT ALL ON FUNCTION public.tenant_views_this_month(t uuid) TO service_role;


--
-- Name: FUNCTION tenants_booking_defaults(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.tenants_booking_defaults() TO anon;
GRANT ALL ON FUNCTION public.tenants_booking_defaults() TO authenticated;
GRANT ALL ON FUNCTION public.tenants_booking_defaults() TO service_role;


--
-- Name: FUNCTION touch_contact_activity(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.touch_contact_activity() FROM PUBLIC;
GRANT ALL ON FUNCTION public.touch_contact_activity() TO service_role;


--
-- Name: FUNCTION touch_subscription_dunning(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_subscription_dunning() TO anon;
GRANT ALL ON FUNCTION public.touch_subscription_dunning() TO authenticated;
GRANT ALL ON FUNCTION public.touch_subscription_dunning() TO service_role;


--
-- Name: FUNCTION touch_tenant_business_profile(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_tenant_business_profile() TO anon;
GRANT ALL ON FUNCTION public.touch_tenant_business_profile() TO authenticated;
GRANT ALL ON FUNCTION public.touch_tenant_business_profile() TO service_role;


--
-- Name: FUNCTION touch_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_updated_at() TO anon;
GRANT ALL ON FUNCTION public.touch_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.touch_updated_at() TO service_role;


--
-- Name: TABLE account_deletion_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.account_deletion_requests TO anon;
GRANT ALL ON TABLE public.account_deletion_requests TO authenticated;
GRANT ALL ON TABLE public.account_deletion_requests TO service_role;


--
-- Name: TABLE admin_audit_log; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.admin_audit_log TO anon;
GRANT ALL ON TABLE public.admin_audit_log TO authenticated;
GRANT ALL ON TABLE public.admin_audit_log TO service_role;


--
-- Name: TABLE pc_staff; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.pc_staff TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.pc_staff TO authenticated;
GRANT ALL ON TABLE public.pc_staff TO service_role;


--
-- Name: COLUMN pc_staff.full_name; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(full_name) ON TABLE public.pc_staff TO authenticated;


--
-- Name: COLUMN pc_staff.company; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(company) ON TABLE public.pc_staff TO authenticated;


--
-- Name: COLUMN pc_staff.website; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(website) ON TABLE public.pc_staff TO authenticated;


--
-- Name: COLUMN pc_staff.bio; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(bio) ON TABLE public.pc_staff TO authenticated;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE super_admins; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.super_admins TO anon;
GRANT ALL ON TABLE public.super_admins TO authenticated;
GRANT ALL ON TABLE public.super_admins TO service_role;


--
-- Name: SEQUENCE tenant_number_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.tenant_number_seq TO anon;
GRANT ALL ON SEQUENCE public.tenant_number_seq TO authenticated;
GRANT ALL ON SEQUENCE public.tenant_number_seq TO service_role;


--
-- Name: TABLE tenants; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tenants TO anon;
GRANT ALL ON TABLE public.tenants TO authenticated;
GRANT ALL ON TABLE public.tenants TO service_role;


--
-- Name: TABLE admin_app_devices; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.admin_app_devices TO anon;
GRANT ALL ON TABLE public.admin_app_devices TO authenticated;
GRANT ALL ON TABLE public.admin_app_devices TO service_role;


--
-- Name: TABLE admin_notification_prefs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.admin_notification_prefs TO anon;
GRANT ALL ON TABLE public.admin_notification_prefs TO authenticated;
GRANT ALL ON TABLE public.admin_notification_prefs TO service_role;


--
-- Name: TABLE admin_notifications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.admin_notifications TO anon;
GRANT ALL ON TABLE public.admin_notifications TO authenticated;
GRANT ALL ON TABLE public.admin_notifications TO service_role;


--
-- Name: TABLE admin_push_tickets; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.admin_push_tickets TO anon;
GRANT ALL ON TABLE public.admin_push_tickets TO authenticated;
GRANT ALL ON TABLE public.admin_push_tickets TO service_role;


--
-- Name: TABLE agent_conversations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.agent_conversations TO anon;
GRANT ALL ON TABLE public.agent_conversations TO authenticated;
GRANT ALL ON TABLE public.agent_conversations TO service_role;


--
-- Name: TABLE agent_messages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.agent_messages TO anon;
GRANT ALL ON TABLE public.agent_messages TO authenticated;
GRANT ALL ON TABLE public.agent_messages TO service_role;


--
-- Name: TABLE agent_pending_actions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.agent_pending_actions TO anon;
GRANT ALL ON TABLE public.agent_pending_actions TO authenticated;
GRANT ALL ON TABLE public.agent_pending_actions TO service_role;


--
-- Name: TABLE agents; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.agents TO anon;
GRANT ALL ON TABLE public.agents TO authenticated;
GRANT ALL ON TABLE public.agents TO service_role;


--
-- Name: TABLE ai_credit_spends; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ai_credit_spends TO service_role;


--
-- Name: TABLE ai_generation_log; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ai_generation_log TO anon;
GRANT ALL ON TABLE public.ai_generation_log TO authenticated;
GRANT ALL ON TABLE public.ai_generation_log TO service_role;


--
-- Name: TABLE ai_generation_packages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ai_generation_packages TO anon;
GRANT ALL ON TABLE public.ai_generation_packages TO authenticated;
GRANT ALL ON TABLE public.ai_generation_packages TO service_role;


--
-- Name: TABLE backup_runs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.backup_runs TO anon;
GRANT ALL ON TABLE public.backup_runs TO authenticated;
GRANT ALL ON TABLE public.backup_runs TO service_role;


--
-- Name: TABLE backup_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.backup_settings TO anon;
GRANT ALL ON TABLE public.backup_settings TO authenticated;
GRANT ALL ON TABLE public.backup_settings TO service_role;


--
-- Name: TABLE booking_appointments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.booking_appointments TO anon;
GRANT ALL ON TABLE public.booking_appointments TO authenticated;
GRANT ALL ON TABLE public.booking_appointments TO service_role;


--
-- Name: TABLE booking_availability; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.booking_availability TO anon;
GRANT ALL ON TABLE public.booking_availability TO authenticated;
GRANT ALL ON TABLE public.booking_availability TO service_role;


--
-- Name: TABLE booking_blocked_dates; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.booking_blocked_dates TO anon;
GRANT ALL ON TABLE public.booking_blocked_dates TO authenticated;
GRANT ALL ON TABLE public.booking_blocked_dates TO service_role;


--
-- Name: TABLE booking_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.booking_settings TO anon;
GRANT ALL ON TABLE public.booking_settings TO authenticated;
GRANT ALL ON TABLE public.booking_settings TO service_role;


--
-- Name: TABLE branch_product_availability; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.branch_product_availability TO anon;
GRANT ALL ON TABLE public.branch_product_availability TO authenticated;
GRANT ALL ON TABLE public.branch_product_availability TO service_role;


--
-- Name: TABLE campaign_recipients; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.campaign_recipients TO anon;
GRANT ALL ON TABLE public.campaign_recipients TO authenticated;
GRANT ALL ON TABLE public.campaign_recipients TO service_role;


--
-- Name: TABLE campaigns; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.campaigns TO anon;
GRANT ALL ON TABLE public.campaigns TO authenticated;
GRANT ALL ON TABLE public.campaigns TO service_role;


--
-- Name: TABLE care_plans; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.care_plans TO anon;
GRANT ALL ON TABLE public.care_plans TO authenticated;
GRANT ALL ON TABLE public.care_plans TO service_role;


--
-- Name: TABLE care_prices; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.care_prices TO anon;
GRANT ALL ON TABLE public.care_prices TO authenticated;
GRANT ALL ON TABLE public.care_prices TO service_role;


--
-- Name: TABLE categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.categories TO anon;
GRANT ALL ON TABLE public.categories TO authenticated;
GRANT ALL ON TABLE public.categories TO service_role;


--
-- Name: TABLE chat_conversations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.chat_conversations TO anon;
GRANT ALL ON TABLE public.chat_conversations TO authenticated;
GRANT ALL ON TABLE public.chat_conversations TO service_role;


--
-- Name: TABLE chat_messages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.chat_messages TO anon;
GRANT ALL ON TABLE public.chat_messages TO authenticated;
GRANT ALL ON TABLE public.chat_messages TO service_role;


--
-- Name: TABLE collection_categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.collection_categories TO anon;
GRANT ALL ON TABLE public.collection_categories TO authenticated;
GRANT ALL ON TABLE public.collection_categories TO service_role;


--
-- Name: TABLE collection_entries; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.collection_entries TO anon;
GRANT ALL ON TABLE public.collection_entries TO authenticated;
GRANT ALL ON TABLE public.collection_entries TO service_role;


--
-- Name: TABLE collection_types; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.collection_types TO anon;
GRANT ALL ON TABLE public.collection_types TO authenticated;
GRANT ALL ON TABLE public.collection_types TO service_role;


--
-- Name: TABLE contact_blocks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.contact_blocks TO anon;
GRANT ALL ON TABLE public.contact_blocks TO authenticated;
GRANT ALL ON TABLE public.contact_blocks TO service_role;


--
-- Name: TABLE contact_details; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.contact_details TO anon;
GRANT ALL ON TABLE public.contact_details TO authenticated;
GRANT ALL ON TABLE public.contact_details TO service_role;


--
-- Name: TABLE contact_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.contact_events TO anon;
GRANT ALL ON TABLE public.contact_events TO authenticated;
GRANT ALL ON TABLE public.contact_events TO service_role;


--
-- Name: TABLE contact_form_submissions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.contact_form_submissions TO anon;
GRANT ALL ON TABLE public.contact_form_submissions TO authenticated;
GRANT ALL ON TABLE public.contact_form_submissions TO service_role;


--
-- Name: TABLE contact_forms; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.contact_forms TO anon;
GRANT ALL ON TABLE public.contact_forms TO authenticated;
GRANT ALL ON TABLE public.contact_forms TO service_role;


--
-- Name: TABLE contacts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.contacts TO anon;
GRANT ALL ON TABLE public.contacts TO authenticated;
GRANT ALL ON TABLE public.contacts TO service_role;


--
-- Name: TABLE content_module_grants; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.content_module_grants TO anon;
GRANT ALL ON TABLE public.content_module_grants TO authenticated;
GRANT ALL ON TABLE public.content_module_grants TO service_role;


--
-- Name: TABLE courier_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.courier_events TO anon;
GRANT ALL ON TABLE public.courier_events TO authenticated;
GRANT ALL ON TABLE public.courier_events TO service_role;


--
-- Name: TABLE crm_sequence_runs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.crm_sequence_runs TO anon;
GRANT ALL ON TABLE public.crm_sequence_runs TO authenticated;
GRANT ALL ON TABLE public.crm_sequence_runs TO service_role;


--
-- Name: TABLE crm_sequences; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.crm_sequences TO anon;
GRANT ALL ON TABLE public.crm_sequences TO authenticated;
GRANT ALL ON TABLE public.crm_sequences TO service_role;


--
-- Name: TABLE crm_stages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.crm_stages TO anon;
GRANT ALL ON TABLE public.crm_stages TO authenticated;
GRANT ALL ON TABLE public.crm_stages TO service_role;


--
-- Name: TABLE crm_tasks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.crm_tasks TO anon;
GRANT ALL ON TABLE public.crm_tasks TO authenticated;
GRANT ALL ON TABLE public.crm_tasks TO service_role;


--
-- Name: TABLE customer_addresses; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.customer_addresses TO anon;
GRANT ALL ON TABLE public.customer_addresses TO authenticated;
GRANT ALL ON TABLE public.customer_addresses TO service_role;


--
-- Name: TABLE customer_profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.customer_profiles TO anon;
GRANT ALL ON TABLE public.customer_profiles TO authenticated;
GRANT ALL ON TABLE public.customer_profiles TO service_role;


--
-- Name: TABLE delivery_options; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.delivery_options TO anon;
GRANT ALL ON TABLE public.delivery_options TO authenticated;
GRANT ALL ON TABLE public.delivery_options TO service_role;


--
-- Name: TABLE domain_orders; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.domain_orders TO anon;
GRANT ALL ON TABLE public.domain_orders TO authenticated;
GRANT ALL ON TABLE public.domain_orders TO service_role;


--
-- Name: TABLE ecommerce_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ecommerce_settings TO anon;
GRANT ALL ON TABLE public.ecommerce_settings TO authenticated;
GRANT ALL ON TABLE public.ecommerce_settings TO service_role;


--
-- Name: TABLE email_zoho_connections; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.email_zoho_connections TO service_role;


--
-- Name: TABLE experts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.experts TO anon;
GRANT ALL ON TABLE public.experts TO authenticated;
GRANT ALL ON TABLE public.experts TO service_role;


--
-- Name: TABLE feature_groups; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.feature_groups TO anon;
GRANT ALL ON TABLE public.feature_groups TO authenticated;
GRANT ALL ON TABLE public.feature_groups TO service_role;


--
-- Name: TABLE feature_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.feature_items TO anon;
GRANT ALL ON TABLE public.feature_items TO authenticated;
GRANT ALL ON TABLE public.feature_items TO service_role;


--
-- Name: TABLE flash_sale_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.flash_sale_items TO anon;
GRANT ALL ON TABLE public.flash_sale_items TO authenticated;
GRANT ALL ON TABLE public.flash_sale_items TO service_role;


--
-- Name: TABLE flash_sales; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.flash_sales TO anon;
GRANT ALL ON TABLE public.flash_sales TO authenticated;
GRANT ALL ON TABLE public.flash_sales TO service_role;


--
-- Name: TABLE form_submissions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.form_submissions TO anon;
GRANT ALL ON TABLE public.form_submissions TO authenticated;
GRANT ALL ON TABLE public.form_submissions TO service_role;


--
-- Name: TABLE forms; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.forms TO anon;
GRANT ALL ON TABLE public.forms TO authenticated;
GRANT ALL ON TABLE public.forms TO service_role;


--
-- Name: TABLE guide_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.guide_events TO anon;
GRANT ALL ON TABLE public.guide_events TO authenticated;
GRANT ALL ON TABLE public.guide_events TO service_role;


--
-- Name: TABLE homepage_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.homepage_settings TO anon;
GRANT ALL ON TABLE public.homepage_settings TO authenticated;
GRANT ALL ON TABLE public.homepage_settings TO service_role;


--
-- Name: TABLE import_jobs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.import_jobs TO anon;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.import_jobs TO authenticated;
GRANT ALL ON TABLE public.import_jobs TO service_role;


--
-- Name: TABLE invoice_counters; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.invoice_counters TO anon;
GRANT ALL ON TABLE public.invoice_counters TO authenticated;
GRANT ALL ON TABLE public.invoice_counters TO service_role;


--
-- Name: TABLE invoices; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.invoices TO anon;
GRANT ALL ON TABLE public.invoices TO authenticated;
GRANT ALL ON TABLE public.invoices TO service_role;


--
-- Name: TABLE mcp_tokens; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.mcp_tokens TO service_role;


--
-- Name: TABLE media; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.media TO anon;
GRANT ALL ON TABLE public.media TO authenticated;
GRANT ALL ON TABLE public.media TO service_role;


--
-- Name: TABLE media_upload_links; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.media_upload_links TO anon;
GRANT ALL ON TABLE public.media_upload_links TO authenticated;
GRANT ALL ON TABLE public.media_upload_links TO service_role;


--
-- Name: TABLE menus; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.menus TO anon;
GRANT ALL ON TABLE public.menus TO authenticated;
GRANT ALL ON TABLE public.menus TO service_role;


--
-- Name: TABLE nav_menus; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.nav_menus TO anon;
GRANT ALL ON TABLE public.nav_menus TO authenticated;
GRANT ALL ON TABLE public.nav_menus TO service_role;


--
-- Name: TABLE notification_prefs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.notification_prefs TO anon;
GRANT ALL ON TABLE public.notification_prefs TO authenticated;
GRANT ALL ON TABLE public.notification_prefs TO service_role;


--
-- Name: TABLE onboarding_build_jobs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.onboarding_build_jobs TO anon;
GRANT ALL ON TABLE public.onboarding_build_jobs TO authenticated;
GRANT ALL ON TABLE public.onboarding_build_jobs TO service_role;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.orders TO anon;
GRANT ALL ON TABLE public.orders TO authenticated;
GRANT ALL ON TABLE public.orders TO service_role;


--
-- Name: TABLE page_categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.page_categories TO anon;
GRANT ALL ON TABLE public.page_categories TO authenticated;
GRANT ALL ON TABLE public.page_categories TO service_role;


--
-- Name: TABLE page_redirects; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.page_redirects TO authenticated;
GRANT ALL ON TABLE public.page_redirects TO service_role;


--
-- Name: TABLE page_snapshots; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.page_snapshots TO anon;
GRANT ALL ON TABLE public.page_snapshots TO authenticated;
GRANT ALL ON TABLE public.page_snapshots TO service_role;


--
-- Name: TABLE page_tags; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.page_tags TO anon;
GRANT ALL ON TABLE public.page_tags TO authenticated;
GRANT ALL ON TABLE public.page_tags TO service_role;


--
-- Name: TABLE page_view_stats; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.page_view_stats TO anon;
GRANT ALL ON TABLE public.page_view_stats TO authenticated;
GRANT ALL ON TABLE public.page_view_stats TO service_role;


--
-- Name: TABLE pages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pages TO anon;
GRANT ALL ON TABLE public.pages TO authenticated;
GRANT ALL ON TABLE public.pages TO service_role;


--
-- Name: TABLE partner_credit_moves; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.partner_credit_moves TO anon;
GRANT ALL ON TABLE public.partner_credit_moves TO authenticated;
GRANT ALL ON TABLE public.partner_credit_moves TO service_role;


--
-- Name: TABLE partners; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.partners TO anon;
GRANT ALL ON TABLE public.partners TO authenticated;
GRANT ALL ON TABLE public.partners TO service_role;


--
-- Name: TABLE payment_gateways; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.payment_gateways TO anon;
GRANT ALL ON TABLE public.payment_gateways TO authenticated;
GRANT ALL ON TABLE public.payment_gateways TO service_role;


--
-- Name: TABLE plan_prices; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.plan_prices TO anon;
GRANT ALL ON TABLE public.plan_prices TO authenticated;
GRANT ALL ON TABLE public.plan_prices TO service_role;


--
-- Name: TABLE plans; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.plans TO anon;
GRANT ALL ON TABLE public.plans TO authenticated;
GRANT ALL ON TABLE public.plans TO service_role;


--
-- Name: TABLE platform_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.platform_settings TO anon;
GRANT ALL ON TABLE public.platform_settings TO authenticated;
GRANT ALL ON TABLE public.platform_settings TO service_role;


--
-- Name: TABLE plugins; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.plugins TO anon;
GRANT ALL ON TABLE public.plugins TO authenticated;
GRANT ALL ON TABLE public.plugins TO service_role;


--
-- Name: TABLE portfolio_groups; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.portfolio_groups TO anon;
GRANT ALL ON TABLE public.portfolio_groups TO authenticated;
GRANT ALL ON TABLE public.portfolio_groups TO service_role;


--
-- Name: TABLE portfolio_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.portfolio_items TO anon;
GRANT ALL ON TABLE public.portfolio_items TO authenticated;
GRANT ALL ON TABLE public.portfolio_items TO service_role;


--
-- Name: TABLE price_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.price_requests TO anon;
GRANT ALL ON TABLE public.price_requests TO authenticated;
GRANT ALL ON TABLE public.price_requests TO service_role;


--
-- Name: TABLE pricing_packages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pricing_packages TO anon;
GRANT ALL ON TABLE public.pricing_packages TO authenticated;
GRANT ALL ON TABLE public.pricing_packages TO service_role;


--
-- Name: TABLE pricing_tables; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pricing_tables TO anon;
GRANT ALL ON TABLE public.pricing_tables TO authenticated;
GRANT ALL ON TABLE public.pricing_tables TO service_role;


--
-- Name: TABLE product_option_presets; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.product_option_presets TO anon;
GRANT ALL ON TABLE public.product_option_presets TO authenticated;
GRANT ALL ON TABLE public.product_option_presets TO service_role;


--
-- Name: TABLE product_reviews; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.product_reviews TO anon;
GRANT ALL ON TABLE public.product_reviews TO authenticated;
GRANT ALL ON TABLE public.product_reviews TO service_role;


--
-- Name: TABLE product_stock_alerts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.product_stock_alerts TO anon;
GRANT ALL ON TABLE public.product_stock_alerts TO authenticated;
GRANT ALL ON TABLE public.product_stock_alerts TO service_role;


--
-- Name: TABLE product_variants; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.product_variants TO anon;
GRANT ALL ON TABLE public.product_variants TO authenticated;
GRANT ALL ON TABLE public.product_variants TO service_role;


--
-- Name: TABLE products; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.products TO anon;
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;


--
-- Name: TABLE re_communities; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.re_communities TO anon;
GRANT ALL ON TABLE public.re_communities TO authenticated;
GRANT ALL ON TABLE public.re_communities TO service_role;


--
-- Name: TABLE re_developers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.re_developers TO anon;
GRANT ALL ON TABLE public.re_developers TO authenticated;
GRANT ALL ON TABLE public.re_developers TO service_role;


--
-- Name: TABLE re_properties; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.re_properties TO anon;
GRANT ALL ON TABLE public.re_properties TO authenticated;
GRANT ALL ON TABLE public.re_properties TO service_role;


--
-- Name: TABLE receipt_counters; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.receipt_counters TO anon;
GRANT ALL ON TABLE public.receipt_counters TO authenticated;
GRANT ALL ON TABLE public.receipt_counters TO service_role;


--
-- Name: TABLE restaurant_branches; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.restaurant_branches TO anon;
GRANT ALL ON TABLE public.restaurant_branches TO authenticated;
GRANT ALL ON TABLE public.restaurant_branches TO service_role;


--
-- Name: TABLE restaurant_reservations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.restaurant_reservations TO anon;
GRANT ALL ON TABLE public.restaurant_reservations TO authenticated;
GRANT ALL ON TABLE public.restaurant_reservations TO service_role;


--
-- Name: TABLE restaurant_riders; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.restaurant_riders TO anon;
GRANT ALL ON TABLE public.restaurant_riders TO authenticated;
GRANT ALL ON TABLE public.restaurant_riders TO service_role;


--
-- Name: TABLE restaurant_tables; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.restaurant_tables TO anon;
GRANT ALL ON TABLE public.restaurant_tables TO authenticated;
GRANT ALL ON TABLE public.restaurant_tables TO service_role;


--
-- Name: TABLE section_preset_saves; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.section_preset_saves TO anon;
GRANT ALL ON TABLE public.section_preset_saves TO authenticated;
GRANT ALL ON TABLE public.section_preset_saves TO service_role;


--
-- Name: TABLE service_categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.service_categories TO anon;
GRANT ALL ON TABLE public.service_categories TO authenticated;
GRANT ALL ON TABLE public.service_categories TO service_role;


--
-- Name: TABLE service_groups; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.service_groups TO anon;
GRANT ALL ON TABLE public.service_groups TO authenticated;
GRANT ALL ON TABLE public.service_groups TO service_role;


--
-- Name: TABLE service_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.service_items TO anon;
GRANT ALL ON TABLE public.service_items TO authenticated;
GRANT ALL ON TABLE public.service_items TO service_role;


--
-- Name: TABLE shipping_rates; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.shipping_rates TO anon;
GRANT ALL ON TABLE public.shipping_rates TO authenticated;
GRANT ALL ON TABLE public.shipping_rates TO service_role;


--
-- Name: TABLE site_chat_conversations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.site_chat_conversations TO anon;
GRANT ALL ON TABLE public.site_chat_conversations TO authenticated;
GRANT ALL ON TABLE public.site_chat_conversations TO service_role;


--
-- Name: TABLE site_chat_messages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.site_chat_messages TO anon;
GRANT ALL ON TABLE public.site_chat_messages TO authenticated;
GRANT ALL ON TABLE public.site_chat_messages TO service_role;


--
-- Name: TABLE site_chat_monthly; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.site_chat_monthly TO anon;
GRANT ALL ON TABLE public.site_chat_monthly TO authenticated;
GRANT ALL ON TABLE public.site_chat_monthly TO service_role;


--
-- Name: TABLE site_chat_training; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.site_chat_training TO anon;
GRANT ALL ON TABLE public.site_chat_training TO authenticated;
GRANT ALL ON TABLE public.site_chat_training TO service_role;


--
-- Name: TABLE site_identity; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.site_identity TO anon;
GRANT ALL ON TABLE public.site_identity TO authenticated;
GRANT ALL ON TABLE public.site_identity TO service_role;


--
-- Name: TABLE site_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.site_settings TO anon;
GRANT ALL ON TABLE public.site_settings TO authenticated;
GRANT ALL ON TABLE public.site_settings TO service_role;


--
-- Name: TABLE site_visitor_pages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.site_visitor_pages TO anon;
GRANT ALL ON TABLE public.site_visitor_pages TO authenticated;
GRANT ALL ON TABLE public.site_visitor_pages TO service_role;


--
-- Name: TABLE site_visitors; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.site_visitors TO anon;
GRANT ALL ON TABLE public.site_visitors TO authenticated;
GRANT ALL ON TABLE public.site_visitors TO service_role;


--
-- Name: TABLE slider_groups; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.slider_groups TO anon;
GRANT ALL ON TABLE public.slider_groups TO authenticated;
GRANT ALL ON TABLE public.slider_groups TO service_role;


--
-- Name: TABLE slider_slides; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.slider_slides TO anon;
GRANT ALL ON TABLE public.slider_slides TO authenticated;
GRANT ALL ON TABLE public.slider_slides TO service_role;


--
-- Name: TABLE spam_entries; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.spam_entries TO anon;
GRANT ALL ON TABLE public.spam_entries TO authenticated;
GRANT ALL ON TABLE public.spam_entries TO service_role;


--
-- Name: SEQUENCE sub_order_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.sub_order_seq TO anon;
GRANT ALL ON SEQUENCE public.sub_order_seq TO authenticated;
GRANT ALL ON SEQUENCE public.sub_order_seq TO service_role;


--
-- Name: TABLE sub_orders; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sub_orders TO anon;
GRANT ALL ON TABLE public.sub_orders TO authenticated;
GRANT ALL ON TABLE public.sub_orders TO service_role;


--
-- Name: TABLE subscription_payments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.subscription_payments TO anon;
GRANT ALL ON TABLE public.subscription_payments TO authenticated;
GRANT ALL ON TABLE public.subscription_payments TO service_role;


--
-- Name: TABLE subscriptions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.subscriptions TO anon;
GRANT ALL ON TABLE public.subscriptions TO authenticated;
GRANT ALL ON TABLE public.subscriptions TO service_role;


--
-- Name: TABLE support_ticket_messages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.support_ticket_messages TO anon;
GRANT ALL ON TABLE public.support_ticket_messages TO authenticated;
GRANT ALL ON TABLE public.support_ticket_messages TO service_role;


--
-- Name: TABLE support_tickets; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.support_tickets TO anon;
GRANT ALL ON TABLE public.support_tickets TO authenticated;
GRANT ALL ON TABLE public.support_tickets TO service_role;


--
-- Name: TABLE tags; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tags TO anon;
GRANT ALL ON TABLE public.tags TO authenticated;
GRANT ALL ON TABLE public.tags TO service_role;


--
-- Name: TABLE template_categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.template_categories TO anon;
GRANT ALL ON TABLE public.template_categories TO authenticated;
GRANT ALL ON TABLE public.template_categories TO service_role;


--
-- Name: TABLE templates; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.templates TO anon;
GRANT ALL ON TABLE public.templates TO authenticated;
GRANT ALL ON TABLE public.templates TO service_role;


--
-- Name: TABLE tenant_alias_domains; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tenant_alias_domains TO anon;
GRANT ALL ON TABLE public.tenant_alias_domains TO authenticated;
GRANT ALL ON TABLE public.tenant_alias_domains TO service_role;


--
-- Name: TABLE tenant_api_keys; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tenant_api_keys TO anon;
GRANT ALL ON TABLE public.tenant_api_keys TO authenticated;
GRANT ALL ON TABLE public.tenant_api_keys TO service_role;


--
-- Name: TABLE tenant_business_profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tenant_business_profiles TO anon;
GRANT ALL ON TABLE public.tenant_business_profiles TO authenticated;
GRANT ALL ON TABLE public.tenant_business_profiles TO service_role;


--
-- Name: TABLE tenant_email_settings; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.tenant_email_settings TO anon;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.tenant_email_settings TO authenticated;
GRANT ALL ON TABLE public.tenant_email_settings TO service_role;


--
-- Name: TABLE tenant_integrations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tenant_integrations TO service_role;


--
-- Name: TABLE tenant_low_stock_notices; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tenant_low_stock_notices TO anon;
GRANT ALL ON TABLE public.tenant_low_stock_notices TO authenticated;
GRANT ALL ON TABLE public.tenant_low_stock_notices TO service_role;


--
-- Name: TABLE tenant_members; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tenant_members TO anon;
GRANT ALL ON TABLE public.tenant_members TO authenticated;
GRANT ALL ON TABLE public.tenant_members TO service_role;


--
-- Name: TABLE tenant_ownership_transfers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tenant_ownership_transfers TO anon;
GRANT ALL ON TABLE public.tenant_ownership_transfers TO authenticated;
GRANT ALL ON TABLE public.tenant_ownership_transfers TO service_role;


--
-- Name: TABLE tenant_payment_methods; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tenant_payment_methods TO anon;
GRANT ALL ON TABLE public.tenant_payment_methods TO authenticated;
GRANT ALL ON TABLE public.tenant_payment_methods TO service_role;


--
-- Name: TABLE tenant_template_imports; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tenant_template_imports TO anon;
GRANT ALL ON TABLE public.tenant_template_imports TO authenticated;
GRANT ALL ON TABLE public.tenant_template_imports TO service_role;


--
-- Name: TABLE tenant_visit_counters; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tenant_visit_counters TO anon;
GRANT ALL ON TABLE public.tenant_visit_counters TO authenticated;
GRANT ALL ON TABLE public.tenant_visit_counters TO service_role;


--
-- Name: TABLE testimonial_groups; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.testimonial_groups TO anon;
GRANT ALL ON TABLE public.testimonial_groups TO authenticated;
GRANT ALL ON TABLE public.testimonial_groups TO service_role;


--
-- Name: TABLE testimonials; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.testimonials TO anon;
GRANT ALL ON TABLE public.testimonials TO authenticated;
GRANT ALL ON TABLE public.testimonials TO service_role;


--
-- Name: TABLE themes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.themes TO anon;
GRANT ALL ON TABLE public.themes TO authenticated;
GRANT ALL ON TABLE public.themes TO service_role;


--
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.transactions TO anon;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.transactions TO service_role;


--
-- Name: TABLE vendor_courier_accounts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.vendor_courier_accounts TO service_role;


--
-- Name: TABLE vendors; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.vendors TO anon;
GRANT ALL ON TABLE public.vendors TO authenticated;
GRANT ALL ON TABLE public.vendors TO service_role;


--
-- Name: TABLE vendor_public_profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.vendor_public_profiles TO anon;
GRANT ALL ON TABLE public.vendor_public_profiles TO authenticated;
GRANT ALL ON TABLE public.vendor_public_profiles TO service_role;


--
-- Name: TABLE voucher_redemptions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.voucher_redemptions TO anon;
GRANT ALL ON TABLE public.voucher_redemptions TO authenticated;
GRANT ALL ON TABLE public.voucher_redemptions TO service_role;


--
-- Name: TABLE vouchers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.vouchers TO anon;
GRANT ALL ON TABLE public.vouchers TO authenticated;
GRANT ALL ON TABLE public.vouchers TO service_role;


--
-- Name: TABLE web_push_subscriptions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.web_push_subscriptions TO anon;
GRANT ALL ON TABLE public.web_push_subscriptions TO authenticated;
GRANT ALL ON TABLE public.web_push_subscriptions TO service_role;


--
-- Name: TABLE wishlist_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wishlist_items TO anon;
GRANT ALL ON TABLE public.wishlist_items TO authenticated;
GRANT ALL ON TABLE public.wishlist_items TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--




-- Logins: a profile row for every new user, and the team sign-in log.
create or replace trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create or replace trigger trg_log_team_sign_in after insert on auth.sessions for each row execute function public.log_team_sign_in();

-- Storage buckets and their rules.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('media', 'media', true, 52428800, '{image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,video/mp4,video/webm,video/ogg,audio/mpeg,audio/ogg,audio/wav,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,text/plain}'::text[]) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('backups', 'backups', false, 524288000, null) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('support-captures', 'support-captures', false, 8388608, '{image/webp,image/png,image/jpeg}'::text[]) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('support-media', 'support-media', false, 52428800, '{video/webm,video/mp4,audio/webm,audio/mp4,audio/ogg,audio/mpeg}'::text[]) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('form-uploads', 'form-uploads', false, 10485760, '{application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,text/plain}'::text[]) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('chat-training', 'chat-training', false, 26214400, null) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('pm-files', 'pm-files', false, 26214400, null) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('rider-docs', 'rider-docs', false, 6291456, '{image/jpeg,image/png,image/webp,image/heic}'::text[]) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('vendor-docs', 'vendor-docs', false, 5242880, '{image/jpeg,image/png,image/webp,application/pdf}'::text[]) on conflict (id) do nothing;
create policy "Authenticated can read media" on storage.objects as PERMISSIVE for SELECT to authenticated using ((bucket_id = 'media'::text));
create policy "Authenticated users can delete media" on storage.objects as PERMISSIVE for DELETE to authenticated using ((bucket_id = 'media'::text));
create policy "Authenticated users can upload media" on storage.objects as PERMISSIVE for INSERT to authenticated with check ((bucket_id = 'media'::text));

-- Changes made after the dump.
-- 242_selfhost_plan.sql
-- 242: "selfhost" plan for the standalone (self-hosted, single-site) edition.
--
-- A self-hosted install's one site gets plan = 'selfhost' from /setup, so
-- lib/modules/resolve-modules.ts turns on the open (AGPL core) modules and
-- leaves the premium ones off. is_active = false keeps the row out of every
-- public pricing list and plan picker on the hosted platform; on the hosted
-- database it is one unused row.
--
-- Open modules: services, features, portfolio, sliders, testimonials, pricing,
-- bookings, ecommerce (single vendor), crm, invoices, marketing, collections,
-- ai_coder, ai_agent. Everything else is premium (included = false).

insert into public.plans (id, name, price_yearly, storage_gb, is_active, sort_order, pages_limit, modules, features)
values (
  'selfhost',
  'Self-hosted',
  0,
  0,
  false,
  99,
  -1,
  '{
    "services":          {"included": true,  "defaultOn": true},
    "features":          {"included": true,  "defaultOn": true},
    "portfolio":         {"included": true,  "defaultOn": true},
    "sliders":           {"included": true,  "defaultOn": true},
    "testimonials":      {"included": true,  "defaultOn": true},
    "pricing":           {"included": true,  "defaultOn": true},
    "bookings":          {"included": true,  "defaultOn": true},
    "ecommerce":         {"included": true,  "defaultOn": false},
    "crm":               {"included": true,  "defaultOn": true},
    "invoices":          {"included": true,  "defaultOn": true},
    "marketing":         {"included": true,  "defaultOn": false},
    "collections":       {"included": true,  "defaultOn": false},
    "ai_coder":          {"included": true,  "defaultOn": true},
    "ai_agent":          {"included": true,  "defaultOn": true},
    "jobs":              {"included": false, "defaultOn": false},
    "pos":               {"included": false, "defaultOn": false},
    "inventory":         {"included": false, "defaultOn": false},
    "accounting":        {"included": false, "defaultOn": false},
    "visa_tour":         {"included": false, "defaultOn": false},
    "blood_donation":    {"included": false, "defaultOn": false},
    "marketplace":       {"included": false, "defaultOn": false},
    "content_scheduler": {"included": false, "defaultOn": false},
    "real_estate":       {"included": false, "defaultOn": false},
    "results":           {"included": false, "defaultOn": false},
    "restaurant":        {"included": false, "defaultOn": false},
    "projects":          {"included": false, "defaultOn": false}
  }'::jsonb,
  '[]'::jsonb
)
on conflict (id) do nothing;


-- 244_site_chat_prompt.sql
-- How the site chat invites visitors (2026-11-16). Null = the default:
-- a small callout next to the chat button after a few seconds, instead of
-- opening the chat window by itself.
--   {"mode": "bubble" | "open" | "off", "text": "<owner's own callout text>" | null}
alter table public.tenants add column if not exists site_chat_prompt jsonb;


-- Migrations already in this file (selfhost/migrate.mjs runs only newer ones).
create table if not exists public.selfhost_migrations (name text primary key, applied_at timestamptz not null default now());
alter table public.selfhost_migrations enable row level security;
insert into public.selfhost_migrations (name) values
  ('001_initial_schema.sql'),
  ('002_media_storage_theme.sql'),
  ('003_saas_schema.sql'),
  ('004_platform_schema.sql'),
  ('005_content_sections.sql'),
  ('006_templates.sql'),
  ('007_agents.sql'),
  ('008_ticket_departments.sql'),
  ('009_tenant_isolation_rls.sql'),
  ('009_trial_improvements.sql'),
  ('010_homepage_extended.sql'),
  ('010_scope_accounting_categories.sql'),
  ('011_agents_referral_column.sql'),
  ('011_billing_payment_config.sql'),
  ('012_agent_commission_type.sql'),
  ('012_subscription_pending_status.sql'),
  ('013_agent_panel.sql'),
  ('014_platform_settings.sql'),
  ('015_template_identity.sql'),
  ('016_pages_tenant_slug_unique.sql'),
  ('017_trial_suspension_cron.sql'),
  ('018_billing_agent_overhaul.sql'),
  ('019_payment_gateway_config.sql'),
  ('020_gateway_credentials.sql'),
  ('021_plan_bdt_prices.sql'),
  ('022_custom_dev_department.sql'),
  ('023_subscriptions_dodo_provider.sql'),
  ('024_subscription_billing.sql'),
  ('025_site_base_currency.sql'),
  ('026_maintenance_content.sql'),
  ('027_email_verification.sql'),
  ('028_authz_helpers_api_keys.sql'),
  ('029_super_admin_rls_bypass.sql'),
  ('030_crm_core.sql'),
  ('031_booking_reminders.sql'),
  ('032_invoices.sql'),
  ('033_campaigns.sql'),
  ('034_staff_jobs.sql'),
  ('035_security_advisor_fixes.sql'),
  ('036_revoke_public_execute.sql'),
  ('037_blood_donors.sql'),
  ('038_donor_admin_photo_geo.sql'),
  ('039_donor_availability_translate.sql'),
  ('040_donor_socials_neverdonated.sql'),
  ('042_blood_requests_devices.sql'),
  ('043_agent_tenant_access.sql'),
  ('043_donor_location_prompt.sql'),
  ('044_agent_tenant_editor_access.sql'),
  ('044_request_lifecycle_webpush.sql'),
  ('045_deletion_request_agent_view.sql'),
  ('046_backup_settings_types.sql'),
  ('046_section_preset_saves.sql'),
  ('047_plan_modules.sql'),
  ('047_setup_wizard.sql'),
  ('048_pages_soft_delete.sql'),
  ('049_site_color_overrides.sql'),
  ('050_marketplace.sql'),
  ('051_service_requests.sql'),
  ('052_service_category_icons.sql'),
  ('053_service_category_images.sql'),
  ('054_template_engine.sql'),
  ('055_seed_template_categories.sql'),
  ('056_content_scheduler.sql'),
  ('057_recurring_commission_only.sql'),
  ('058_rename_agent_to_staff.sql'),
  ('059_manager_role.sql'),
  ('060_nav_menu_locations.sql'),
  ('061_template_page_slug_unique.sql'),
  ('062_site_identity_template_id.sql'),
  ('063_marketplace_ecom_vendors.sql'),
  ('063_pages_slug_unique_excludes_archived.sql'),
  ('064_marketplace_ecom_core.sql'),
  ('064_page_snapshots_nullable_tenant.sql'),
  ('065_sub_orders_guard_service_role.sql'),
  ('066_vendor_ledger_seq.sql'),
  ('067_vendor_self_read.sql'),
  ('068_page_snapshots.sql'),
  ('069_aicoder_generation_metering.sql'),
  ('070_ai_topup_dodo_product.sql'),
  ('071_enm_booking_sync.sql'),
  ('071_tenant_ownership_transfers.sql'),
  ('072_admin_app_devices_and_leads_notify.sql'),
  ('073_ai_agent.sql'),
  ('074_agent_chat_metering.sql'),
  ('075_tenant_business_profiles.sql'),
  ('076_dunning.sql'),
  ('077_visitor_counters.sql'),
  ('078_onboarding_free_build.sql'),
  ('079_onboarding_build_jobs.sql'),
  ('080_marketing_leads.sql'),
  ('081_page_analytics.sql'),
  ('082_resumable_onboarding_build.sql'),
  ('083_customer_order_access.sql'),
  ('084_customer_profiles_wishlists.sql'),
  ('085_order_fulfillment_type.sql'),
  ('086_product_dietary_info.sql'),
  ('087_restaurant_branches_tables.sql'),
  ('088_restaurant_public_read_scoping.sql'),
  ('089_restaurant_template.sql'),
  ('090_restaurant_riders.sql'),
  ('091_dodo_subscription_id.sql'),
  ('092_kitchen_status_vocabulary.sql'),
  ('093_ga_oauth.sql'),
  ('094_rider_token.sql'),
  ('095_restaurant_reservations.sql'),
  ('096_low_stock_notices.sql'),
  ('097_split_bill.sql'),
  ('098_rider_location.sql'),
  ('099_kitchen_orders_index.sql'),
  ('100_ticket_insert_and_replies.sql'),
  ('101_tenant_integrations.sql'),
  ('102_revoke_public_rpc.sql'),
  ('103_drop_site_settings_ga_secrets.sql'),
  ('104_drop_unused_public_insert_policies.sql'),
  ('105_page_drafts.sql'),
  ('106_pages_has_draft.sql'),
  ('107_ai_credit_ledger.sql'),
  ('108_site_design_overrides.sql'),
  ('109_demo_sites.sql'),
  ('110_subscription_pending_change.sql'),
  ('111_trial_expiry_pauses_site.sql'),
  ('112_real_estate.sql'),
  ('114_neutral_template_names.sql'),
  ('115_neutral_template_emails.sql'),
  ('116_marketplace_reviews_chat_push.sql'),
  ('117_marketplace_variants_flash_vouchers.sql'),
  ('117_translated_pages_page_limit.sql'),
  ('118_mcp_server.sql'),
  ('119_page_redirects.sql'),
  ('120_media_usage.sql'),
  ('121_search_console_verification.sql'),
  ('122_import_jobs.sql'),
  ('123_ai_visibility.sql'),
  ('124_business_email.sql'),
  ('125_launch_offer.sql'),
  ('126_booking_ready.sql'),
  ('126_gtm_container_id.sql'),
  ('127_basic_bookings.sql'),
  ('128_product_variants_tenant_manage.sql'),
  ('129_zoho_connections.sql'),
  ('130_store_payment_methods.sql'),
  ('131_product_defaults.sql'),
  ('132_store_reviews.sql'),
  ('133_booking_contact_requirement.sql'),
  ('134_search_console.sql'),
  ('135_ai_seo_free_run.sql'),
  ('136_bing_webmaster.sql'),
  ('137_dev_platform_care_pricing.sql'),
  ('137_redirects_manager.sql'),
  ('138_pricing_v2_dodo_products.sql'),
  ('138_restaurant_module.sql'),
  ('139_root_site_builder_flag.sql'),
  ('139_site_languages.sql'),
  ('140_company_accounts_invoices.sql'),
  ('140_results.sql'),
  ('141_invoice_member_read.sql'),
  ('141_results_alumni.sql'),
  ('142_live_root_slug.sql'),
  ('142_notification_prefs.sql'),
  ('143_product_translations.sql'),
  ('144_template_multi_categories.sql'),
  ('145_demo_status_billing_sync.sql'),
  ('146_mcp_site_setup.sql'),
  ('147_admin_audit_log.sql'),
  ('148_support_captures.sql'),
  ('149_partners.sql'),
  ('150_partner_credits.sql'),
  ('151_reseller.sql'),
  ('152_whatsapp_order_method.sql'),
  ('152_white_label.sql'),
  ('153_country_prices.sql'),
  ('153_support_media.sql'),
  ('154_price_on_request.sql'),
  ('155_form_uploads.sql'),
  ('156_dodo_custom_amount.sql'),
  ('157_platform_errors.sql'),
  ('157_product_variations.sql'),
  ('158_booking_deposit_manage_invoice_pay.sql'),
  ('159_trial_lifecycle.sql'),
  ('160_collections.sql'),
  ('161_layout_lock.sql'),
  ('162_partner_custom_code.sql'),
  ('163_customer_addresses.sql'),
  ('164_shipping_weight.sql'),
  ('165_plans_no_page_limit.sql'),
  ('165_social_links.sql'),
  ('166_variant_stock_nullable.sql'),
  ('167_pages_public_read_excludes_trash.sql'),
  ('168_admin_audit_mcp.sql'),
  ('169_category_translations.sql'),
  ('170_draft_page_snapshots.sql'),
  ('171_service_vendor_capability.sql'),
  ('172_mail_shortcuts_alias_domains.sql'),
  ('172_support_ai_change_sets.sql'),
  ('173_booking_assignee.sql'),
  ('174_admin_notifications.sql'),
  ('175_account_deletion_requests.sql'),
  ('175_experts.sql'),
  ('176_experts_verified_billing.sql'),
  ('177_experts_public.sql'),
  ('178_partner_footer_credit.sql'),
  ('179_crm_sequences.sql'),
  ('180_site_ai_chat.sql'),
  ('181_site_live_chat.sql'),
  ('182_site_chat_hours.sql'),
  ('183_site_chat_lang_ai_default.sql'),
  ('184_scheduled_posts.sql'),
  ('185_site_visitors.sql'),
  ('186_experts_profile.sql'),
  ('187_media_upload_links.sql'),
  ('188_meta_pixel.sql'),
  ('189_expert_reviews.sql'),
  ('190_expert_saves.sql'),
  ('191_expert_events.sql'),
  ('192_expert_promotions.sql'),
  ('193_experts_taxonomy_admin.sql'),
  ('194_site_chat_training.sql'),
  ('195_notification_controls.sql'),
  ('195_project_management.sql'),
  ('197_contact_blocks.sql'),
  ('198_team_feed.sql'),
  ('199_guide_events.sql'),
  ('200_testimonial_photos.sql'),
  ('201_staff_title_site_admin.sql'),
  ('202_site_delete_schedule.sql'),
  ('203_staff_manager.sql'),
  ('204_todo_due_time.sql'),
  ('205_subscription_provider_credit.sql'),
  ('206_page_blocks_backup.sql'),
  ('207_unified_ai_credits.sql'),
  ('208_site_chat_intake.sql'),
  ('209_action_list.sql'),
  ('210_guard_tenant_owner.sql'),
  ('211_action_list_more.sql'),
  ('212_ticket_guard_service_role.sql'),
  ('213_guard_tenant_columns.sql'),
  ('214_staff_edit_pages.sql'),
  ('215_page_parents.sql'),
  ('216_attendance.sql'),
  ('217_attendance_leave_holidays.sql'),
  ('218_attendance_office_pin.sql'),
  ('219_food_delivery_pipeline.sql'),
  ('220_food_riders_dispatch.sql'),
  ('221_food_order_cancel.sql'),
  ('222_food_hub_commission.sql'),
  ('223_attendance_v2.sql'),
  ('224_food_rider_pay_package.sql'),
  ('224_staff_act_as.sql'),
  ('225_attendance_live.sql'),
  ('226_panel_timezone.sql'),
  ('227_action_list_sources.sql'),
  ('228_attendance_early_overtime.sql'),
  ('229_attendance_gap_break.sql'),
  ('230_attendance_overtime_approval.sql'),
  ('231_ecommerce_on_with_products.sql'),
  ('232_goshop_marketplace_v2_base.sql'),
  ('233_courier_integration.sql'),
  ('234_marketplace_withdrawals_commission.sql'),
  ('235_goshop_vendor_rejected_status.sql'),
  ('236_vendor_product_drafts.sql'),
  ('237_goshop_followups.sql'),
  ('238_staff_edit_site_content.sql'),
  ('239_staff_support_read_access.sql'),
  ('240_header_studio.sql'),
  ('241_footer_studio.sql'),
  ('242_selfhost_plan.sql'),
  ('243_ai_api_keys.sql'),
  ('244_site_chat_prompt.sql')
on conflict do nothing;

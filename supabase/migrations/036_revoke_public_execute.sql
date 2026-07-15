-- 036_revoke_public_execute.sql
-- 035 revoked EXECUTE from anon/authenticated, but Postgres grants EXECUTE
-- to PUBLIC on function creation, so the roles still inherited it. Revoke
-- from PUBLIC and grant back only what the platform needs (service_role).
-- The RLS helpers (is_super_admin / is_tenant_member / is_tenant_editor)
-- keep authenticated+anon EXECUTE — policies evaluate them as the querying
-- role; the advisor warning on those three is accepted.

begin;

revoke execute on function public.apply_migration_009() from public;
revoke execute on function public.apply_migration_010() from public;
revoke execute on function public.apply_migration_011() from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.next_receipt_number() from public;
revoke execute on function public.set_tenant_context(uuid) from public;
revoke execute on function public.touch_contact_activity() from public;

grant execute on function public.apply_migration_009() to service_role;
grant execute on function public.apply_migration_010() to service_role;
grant execute on function public.apply_migration_011() to service_role;
grant execute on function public.next_receipt_number() to service_role;
grant execute on function public.set_tenant_context(uuid) to service_role;

-- Trigger functions run as table/definer context; supabase_auth_admin needs
-- handle_new_user for the auth.users trigger.
grant execute on function public.handle_new_user() to supabase_auth_admin;
grant execute on function public.touch_contact_activity() to service_role;

commit;

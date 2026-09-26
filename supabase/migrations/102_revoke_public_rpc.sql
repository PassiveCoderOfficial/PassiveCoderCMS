-- Lock down SECURITY DEFINER functions that were callable by anyone.
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default, and a
-- SECURITY DEFINER function runs with its owner's rights (bypassing RLS).
-- These three had no caller check, so anyone holding the public anon key
-- could call them via /rest/v1/rpc/... with any tenant id — and every
-- tenant id is enumerable through the public site_settings read:
--
--   consume_free_build_credit(t)  — burn any tenant's free AiCoder build
--                                   credit (griefing a brand-new customer's
--                                   first-day site build).
--   bump_tenant_views(t, n)       — add any n (including negative) to any
--                                   tenant's visitor counter, which feeds the
--                                   soft-cap usage warnings.
--   bump_page_view_stats(...)     — inject arbitrary rows into any tenant's
--                                   analytics.
--
-- All three are only ever called server-side through the service-role admin
-- client (lib/aicoder/quota.ts, lib/usage/count-visit.ts,
-- lib/usage/record-page-view.ts), which keeps its access. Found 2026-09-26.

revoke execute on function public.consume_free_build_credit(uuid) from public, anon, authenticated;
revoke execute on function public.bump_tenant_views(uuid, integer) from public, anon, authenticated;
revoke execute on function public.bump_page_view_stats(uuid, text, text, text, text) from public, anon, authenticated;

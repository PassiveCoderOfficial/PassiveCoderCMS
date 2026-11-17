import type { Instrumentation } from "next";

export async function register() {
  // Nothing to do at startup. This used to call apply_migration_009/010/011
  // on every cold start; 009 drops and re-adds a constraint on
  // subscriptions, which locked the table and made PostgREST reload its
  // whole schema cache each time (~43k reloads, 0.6s each on
  // pg_timezone_names). It took the database down twice on 2026-10-19.
  // Those migrations were applied long ago; schema changes go through
  // supabase/migrations only.
}

/**
 * Every uncaught server error (page render, route handler, server action)
 * lands in platform_errors, grouped by message + path, and shows up in
 * Super Admin > Errors. Audit 2026-10-18: until now production errors were
 * only known when a client reported one. Never throws; never slows the
 * response (Next runs this after the error response is sent).
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Local runs against a shared database (design previews, audits) set this
  // so their render errors are not recorded or pushed to phones as platform faults.
  if (process.env.PC_DISABLE_ERROR_REPORTING === "1") return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    const e = err as { message?: string; stack?: string; digest?: string } | null;
    const message = String(e?.message ?? err ?? "Unknown error").slice(0, 500);
    // Redirects and not-found are control flow in Next, not errors.
    if (/^NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR_FALLBACK)/.test(e?.digest ?? "") || /NEXT_REDIRECT|NEXT_NOT_FOUND/.test(message)) return;
    // Stale server-action ids (old tabs after a deploy, bots replaying POSTs)
    // are expected noise, not platform faults: Next already answers 404.
    if (message.startsWith("Failed to find Server Action")) return;
    const path = request.path.split("?")[0].slice(0, 300);
    const headers = request.headers as Record<string, string | string[] | undefined>;
    const h = (n: string) => { const v = headers[n]; return (Array.isArray(v) ? v[0] : v) ?? null; };
    const tenant = h("x-tenant-id");
    const { createClient } = await import("@supabase/supabase-js");
    const fingerprint = `${message.slice(0, 160)}|${path.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi, ":id").replace(/\/\d+/g, "/:n")}`;
    // Phone alert for super admins: once per error kind per day.
    const { createHash } = await import("crypto");
    const { notifySuperAdmins } = await import("@/lib/push/notify");
    await notifySuperAdmins({
      type: "platform_error", tenantId: tenant && /^[0-9a-f-]{36}$/i.test(tenant) ? tenant : null,
      dedupeKey: `error:${createHash("sha1").update(fingerprint).digest("hex")}:${new Date().toISOString().slice(0, 10)}`,
      title: "Platform error", body: `${path}: ${message.slice(0, 150)}`,
    });
    await createClient(url, key).rpc("record_platform_error", {
      p_fingerprint: fingerprint,
      p_message: message,
      p_stack: (e?.stack ?? "").slice(0, 4000) || null,
      p_path: path,
      p_method: request.method,
      p_router: context.routerKind,
      p_route_type: context.routeType,
      p_tenant: tenant && /^[0-9a-f-]{36}$/i.test(tenant) ? tenant : null,
      p_user_agent: (h("user-agent") ?? "").slice(0, 300) || null,
    });
  } catch {
    // Logging must never cause a second failure.
  }
};

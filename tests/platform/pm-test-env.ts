/**
 * Lets a test call /api/pm route handlers and pm helpers directly, with no server
 * and no database: Next's request helpers, auth, the admin client and push are
 * replaced before the code under test loads. Import this file first and load the
 * code under test with `await import()` inside the test.
 */
import type { FakeDb } from "../mcp/fake-supabase";

type Load = (id: string) => string;
const resolve: Load = (id) => require.resolve(id);
function stub(id: string, exports: Record<string, unknown>) {
  const filename = resolve(id);
  require.cache[filename] = { id: filename, filename, loaded: true, exports, children: [], paths: [] } as unknown as NodeJS.Module;
}

export const session: { userId: string | null; tenantId: string | null; db: FakeDb | null; siteHeader: string | null } = {
  userId: null, tenantId: null, db: null, siteHeader: null,
};
/** Everything the code under test tried to send. Nothing leaves the process. */
export const sent: { kind: string; input: unknown }[] = [];
export const mail: unknown[] = [];
export const partner: { brand: unknown } = { brand: null };

process.env.NEXT_PUBLIC_ENABLE_PROJECTS = "true";
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test";

// Not an installed package: Next's bundler supplies it.
const loader = require("node:module") as { _load: (request: string, ...rest: unknown[]) => unknown };
const load = loader._load;
loader._load = (request, ...rest) => (request === "server-only" ? {} : load(request, ...rest));

stub("next/headers", {
  headers: async () => new Headers(session.siteHeader ? { "x-tenant-id": session.siteHeader } : {}),
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
});
stub("../../src/lib/supabase/server", {
  createAdminClient: async () => session.db,
  createClient: async () => session.db,
});
stub("../../src/lib/auth/api-caller", {
  REQUESTED_TENANT_HEADER: "x-requested-tenant-id",
  apiUser: async () => (session.userId ? { id: session.userId } : null),
  apiUserId: async () => session.userId,
  getApiCaller: async () => (session.userId && session.tenantId ? { user: { id: session.userId }, userId: session.userId, tenantId: session.tenantId } : null),
});
stub("../../src/lib/modules/resolve-modules", {
  requireModule: async () => true,
  resolveEnabledModules: async () => ({ projects: true }),
});
stub("../../src/lib/push/notify", {
  notifyUsers: async (_u: unknown, input: unknown) => { sent.push({ kind: "users", input }); },
  notifyTenantEvent: async (input: unknown) => { sent.push({ kind: "tenant", input }); },
  notifySuperAdmins: async (input: unknown) => { sent.push({ kind: "superadmins", input }); },
});
stub("../../src/lib/push/web-push", { deliverWebPush: async () => undefined });
stub("../../src/lib/push/notify-owners", { notifyOwners: async () => undefined });
stub("../../src/lib/email", { sendEmail: async (input: unknown) => { mail.push(input); return { ok: true }; } });
stub("../../src/lib/partners/brand", { brandForTenant: async () => partner.brand });

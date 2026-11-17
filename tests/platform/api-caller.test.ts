/**
 * getApiCaller core: web cookie session vs mobile Bearer + X-Tenant-Id.
 * Run: npm run test:platform
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { User } from "@supabase/supabase-js";
import { resolveApiCaller, pickAuthMode, type CallerDeps } from "../../src/lib/auth/api-caller-core";

const SITE_A = "11111111-1111-4111-8111-111111111111";
const SITE_B = "22222222-2222-4222-8222-222222222222";
const user = (id: string) => ({ id, email: `${id}@x.test` }) as unknown as User;

/** Fake world: alice is an editor on A; boss is a super admin, member nowhere. */
function deps(over: Partial<CallerDeps> & { cookie?: User | null } = {}): CallerDeps {
  const tokens: Record<string, User> = { "tok-alice": user("alice"), "tok-boss": user("boss") };
  const roles: Record<string, Record<string, string>> = { alice: { [SITE_A]: "editor" } };
  return {
    cookieUser: async () => over.cookie ?? null,
    verifyToken: async (t) => tokens[t] ?? null,
    isSuperAdmin: async (id) => id === "boss",
    membershipRole: async (id, tenant) => roles[id]?.[tenant] ?? null,
    sessionTenant: async (id, isSA, host) => (host ? { tenantId: host } : { tenantId: roles[id] ? Object.keys(roles[id])[0] : null, role: roles[id] ? Object.values(roles[id])[0] : undefined }),
    fallbackTenant: async (id) => (roles[id] ? { tenantId: Object.keys(roles[id])[0], role: Object.values(roles[id])[0] } : { tenantId: null }),
    ...over,
  };
}

const hdrs = (h: Record<string, string>) => new Headers(h);
const SESSION_COOKIE = ["sb-abcd-auth-token.0"];

test("cookie session resolves like apiTenantId and reports the role", async () => {
  const c = await resolveApiCaller({ headers: hdrs({}), cookieNames: SESSION_COOKIE }, deps({ cookie: user("alice") }));
  assert.equal(c?.via, "cookie");
  assert.equal(c?.tenantId, SITE_A);
  assert.equal(c?.role, "editor");
  assert.equal(c?.isSuperAdmin, false);
});

test("cookie session ignores a requested tenant header (web behaviour unchanged)", async () => {
  const c = await resolveApiCaller(
    { headers: hdrs({ "x-requested-tenant-id": SITE_B }), cookieNames: SESSION_COOKIE },
    deps({ cookie: user("alice") }),
  );
  assert.equal(c?.tenantId, SITE_A);
});

test("no session and no token -> null", async () => {
  assert.equal(await resolveApiCaller({ headers: hdrs({}), cookieNames: [] }, deps()), null);
});

test("Bearer + X-Tenant-Id for a site the user belongs to", async () => {
  const c = await resolveApiCaller(
    { headers: hdrs({ authorization: "Bearer tok-alice", "x-requested-tenant-id": SITE_A }), cookieNames: [] },
    deps(),
  );
  assert.equal(c?.via, "bearer");
  assert.equal(c?.userId, "alice");
  assert.equal(c?.tenantId, SITE_A);
  assert.equal(c?.role, "editor");
  assert.equal(c?.token, "tok-alice");
});

test("Bearer for a site the user is NOT a member of -> null", async () => {
  const c = await resolveApiCaller(
    { headers: hdrs({ authorization: "Bearer tok-alice", "x-requested-tenant-id": SITE_B }), cookieNames: [] },
    deps(),
  );
  assert.equal(c, null);
});

test("invalid Bearer token -> null", async () => {
  const c = await resolveApiCaller(
    { headers: hdrs({ authorization: "Bearer nope", "x-requested-tenant-id": SITE_A }), cookieNames: [] },
    deps(),
  );
  assert.equal(c, null);
});

test("super admin Bearer may act on any site, role null", async () => {
  const c = await resolveApiCaller(
    { headers: hdrs({ authorization: "Bearer tok-boss", "x-requested-tenant-id": SITE_B }), cookieNames: [] },
    deps(),
  );
  assert.equal(c?.isSuperAdmin, true);
  assert.equal(c?.tenantId, SITE_B);
  assert.equal(c?.role, null);
});

test("super admin still needs a well-formed site id", async () => {
  const c = await resolveApiCaller(
    { headers: hdrs({ authorization: "Bearer tok-boss", "x-requested-tenant-id": "not-a-uuid" }), cookieNames: [] },
    deps(),
  );
  assert.equal(c, null);
});

test("Bearer without a site header falls back to the primary membership", async () => {
  const c = await resolveApiCaller({ headers: hdrs({ authorization: "Bearer tok-alice" }), cookieNames: [] }, deps());
  assert.equal(c?.tenantId, SITE_A);
});

test("a browser session cookie always wins over a Bearer header", () => {
  assert.equal(pickAuthMode(hdrs({ authorization: "Bearer x" }), SESSION_COOKIE).via, "cookie");
  assert.equal(pickAuthMode(hdrs({ authorization: "Bearer x" }), ["other"]).via, "bearer");
  assert.equal(pickAuthMode(hdrs({ authorization: "Basic x" }), []).via, "cookie");
});

/**
 * Pure core of getApiCaller() — no Next.js or Supabase imports, so it can be
 * unit-tested with fakes (tests/platform/api-caller.test.ts).
 */
import type { User } from "@supabase/supabase-js";

/** Where the proxy puts a client-sent X-Tenant-Id (the real x-tenant-id
 *  header is reserved for the site the request's host belongs to). */
export const REQUESTED_TENANT_HEADER = "x-requested-tenant-id";

export type ApiCallerCore = {
  user: User;
  userId: string;
  tenantId: string;
  /** owner / admin / editor / viewer (tenant_members.role), "owner" for the
   *  tenants.owner_id, null for a super admin who is not a member. */
  role: string | null;
  isSuperAdmin: boolean;
  via: "cookie" | "bearer";
  /** Bearer access token (mobile only). */
  token?: string;
};

export type CallerDeps = {
  /** Cookie-session user, or null. */
  cookieUser(): Promise<User | null>;
  /** Verify a Supabase access token server-side. */
  verifyToken(token: string): Promise<User | null>;
  isSuperAdmin(userId: string): Promise<boolean>;
  /** tenant_members role, "owner" for tenants.owner_id, else null. */
  membershipRole(userId: string, tenantId: string): Promise<string | null>;
  /** apiTenantId()'s resolution for a cookie session. */
  sessionTenant(userId: string, isSA: boolean, hostTenantId: string | null): Promise<{ tenantId: string | null; role?: string | null }>;
  /** Primary, then any membership. */
  fallbackTenant(userId: string): Promise<{ tenantId: string | null; role?: string | null }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type HeaderReader = { get(name: string): string | null };

export function bearerToken(h: HeaderReader): string | null {
  const auth = h.get("authorization");
  if (!auth || !/^Bearer\s+/i.test(auth)) return null;
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

/** Supabase SSR session cookies are named sb-<ref>-auth-token (maybe chunked .0, .1). */
export function hasSessionCookie(cookieNames: string[]): boolean {
  return cookieNames.some((n) => n.startsWith("sb-") && n.includes("-auth-token"));
}

/**
 * Bearer mode only when the request carries a Bearer token and no session
 * cookie, so every browser request keeps the exact cookie behaviour.
 */
export function pickAuthMode(h: HeaderReader, cookieNames: string[]): { via: "cookie" } | { via: "bearer"; token: string } {
  const token = bearerToken(h);
  if (token && !hasSessionCookie(cookieNames)) return { via: "bearer", token };
  return { via: "cookie" };
}

export async function resolveApiCaller(
  input: { headers: HeaderReader; cookieNames: string[] },
  deps: CallerDeps,
): Promise<ApiCallerCore | null> {
  const mode = pickAuthMode(input.headers, input.cookieNames);

  if (mode.via === "cookie") {
    const user = await deps.cookieUser();
    if (!user) return null;
    const isSA = await deps.isSuperAdmin(user.id);
    const resolved = await deps.sessionTenant(user.id, isSA, input.headers.get("x-tenant-id"));
    if (!resolved.tenantId) return null;
    const role = resolved.role !== undefined ? resolved.role : await deps.membershipRole(user.id, resolved.tenantId);
    return { user, userId: user.id, tenantId: resolved.tenantId, role, isSuperAdmin: isSA, via: "cookie" };
  }

  const user = await deps.verifyToken(mode.token);
  if (!user) return null;
  const isSA = await deps.isSuperAdmin(user.id);
  const requested = input.headers.get(REQUESTED_TENANT_HEADER)?.trim() || input.headers.get("x-tenant-id")?.trim() || null;

  if (!requested) {
    // No site named: same default as the web (primary, then any membership).
    const fb = await deps.fallbackTenant(user.id);
    if (!fb.tenantId) return null;
    const role = fb.role !== undefined ? fb.role : await deps.membershipRole(user.id, fb.tenantId);
    return { user, userId: user.id, tenantId: fb.tenantId, role, isSuperAdmin: isSA, via: "bearer", token: mode.token };
  }

  if (!UUID.test(requested)) return null;
  const role = await deps.membershipRole(user.id, requested);
  if (!role && !isSA) return null; // not a member of that site
  return { user, userId: user.id, tenantId: requested, role, isSuperAdmin: isSA, via: "bearer", token: mode.token };
}

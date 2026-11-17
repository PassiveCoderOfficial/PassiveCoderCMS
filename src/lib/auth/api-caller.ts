import "server-only";
import { cookies, headers } from "next/headers";
import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { siteAwareFetch } from "@/lib/supabase/public-cache";
import { resolveSessionTenant, membershipFallbackTenant } from "@/lib/tenant/api";
import { SA_VIEWING_COOKIE, STAFF_VIEWING_COOKIE } from "@/lib/tenant/current";
import {
  pickAuthMode,
  resolveApiCaller,
  type ApiCallerCore,
  type CallerDeps,
} from "./api-caller-core";

export { REQUESTED_TENANT_HEADER, pickAuthMode, bearerToken } from "./api-caller-core";

/**
 * One auth helper for dashboard API routes, web and mobile.
 *
 *  - Web: the cookie session (unchanged behaviour of apiTenantId(): subdomain
 *    header, SA "manage as" cookie, primary/any membership).
 *  - Mobile: `Authorization: Bearer <supabase access token>` plus the site in
 *    `X-Tenant-Id`. The proxy moves a client-sent X-Tenant-Id to
 *    `x-requested-tenant-id` (the real x-tenant-id is reserved for the host's
 *    site), and membership is always verified here, server-side.
 *
 * `supabase` is a client acting as the caller, so RLS applies exactly as on
 * the web: the cookie client for web, an anon client carrying the user's JWT
 * for mobile.
 */
export type ApiCaller = ApiCallerCore & {
  supabase: Awaited<ReturnType<typeof createClient>>;
};

// Short memo of verified access tokens, so the helpers a route calls (write
// check, module check) don't each re-verify the same token over the network.
const TOKEN_TTL_MS = 30_000;
const tokenMemo = new Map<string, { at: number; user: User }>();

async function verifyAccessToken(token: string): Promise<User | null> {
  const hit = tokenMemo.get(token);
  if (hit && Date.now() - hit.at < TOKEN_TTL_MS) return hit.user;
  const admin = await createAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  if (tokenMemo.size >= 500) tokenMemo.delete(tokenMemo.keys().next().value!);
  tokenMemo.set(token, { at: Date.now(), user: data.user });
  return data.user;
}

/** Supabase client acting as the Bearer user (anon key + their JWT). */
function bearerClient(token: string): ApiCaller["supabase"] {
  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` }, fetch: siteAwareFetch() },
    },
  );
  // Routes call supabase.auth.getUser() with no argument; there is no stored
  // session on this client, so default it to the request's token.
  const getUser = client.auth.getUser.bind(client.auth);
  client.auth.getUser = (jwt?: string) => getUser(jwt ?? token);
  return client as unknown as ApiCaller["supabase"];
}

async function requestContext(req?: Request) {
  const h = req?.headers ?? (await headers());
  const store = await cookies();
  return {
    headers: h,
    cookieNames: store.getAll().map((c) => c.name),
    viewing: store.get(SA_VIEWING_COOKIE)?.value ?? null,
    staffViewing: store.get(STAFF_VIEWING_COOKIE)?.value ?? null,
  };
}

function realDeps(viewing: string | null, staffViewing: string | null): CallerDeps {
  return {
    async cookieUser() {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user ?? null;
    },
    verifyToken: verifyAccessToken,
    async isSuperAdmin(userId) {
      const admin = await createAdminClient();
      const { data } = await admin.from("super_admins").select("user_id").eq("user_id", userId).maybeSingle();
      return !!data;
    },
    async membershipRole(userId, tenantId) {
      const admin = await createAdminClient();
      const [{ data: member }, { data: owned }] = await Promise.all([
        admin.from("tenant_members").select("role").eq("tenant_id", tenantId).eq("user_id", userId).maybeSingle(),
        admin.from("tenants").select("id").eq("id", tenantId).eq("owner_id", userId).maybeSingle(),
      ]);
      if (member) return (member.role as string) ?? "viewer";
      return owned ? "owner" : null;
    },
    async sessionTenant(userId, isSA, hostTenantId) {
      return resolveSessionTenant(await createAdminClient(), userId, isSA, hostTenantId, viewing, staffViewing);
    },
    async fallbackTenant(userId) {
      return membershipFallbackTenant(await createAdminClient(), userId);
    },
  };
}

/**
 * Resolve who is calling and for which site. Returns null when there is no
 * valid session/token or the user may not act on the requested site; routes
 * keep answering 401 as before.
 */
export async function getApiCaller(req?: Request): Promise<ApiCaller | null> {
  const ctx = await requestContext(req);
  const core = await resolveApiCaller(
    { headers: ctx.headers, cookieNames: ctx.cookieNames },
    realDeps(ctx.viewing, ctx.staffViewing),
  );
  if (!core) return null;
  const supabase = core.via === "bearer" ? bearerClient(core.token!) : await createClient();
  return { ...core, supabase };
}

/** Tenant id of the caller (web cookie or mobile Bearer), or null. */
export async function apiCallerTenantId(req?: Request): Promise<string | null> {
  return (await getApiCaller(req))?.tenantId ?? null;
}

/**
 * Supabase client acting as the caller, without any network call: the
 * Bearer client when the request is a mobile Bearer call (Bearer header and
 * no session cookie), else the normal cookie client. Drop-in for
 * `createClient()` in dashboard API routes.
 */
export async function apiSupabase(req?: Request): Promise<ApiCaller["supabase"]> {
  const ctx = await requestContext(req);
  const mode = pickAuthMode(ctx.headers, ctx.cookieNames);
  return mode.via === "bearer" ? bearerClient(mode.token) : createClient();
}

/**
 * The signed-in user for checks that are not tied to one site (bootstrap,
 * helper checks): cookie session on the web, verified Bearer token on mobile.
 * Membership is not checked here; callers check it against a tenant.
 */
export async function apiUser(req?: Request): Promise<User | null> {
  const ctx = await requestContext(req);
  const mode = pickAuthMode(ctx.headers, ctx.cookieNames);
  if (mode.via === "bearer") return verifyAccessToken(mode.token);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

/** Id of apiUser(): used by canWriteSite, requireModule, teamAccess. */
export async function apiUserId(req?: Request): Promise<string | null> {
  return (await apiUser(req))?.id ?? null;
}

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * "Connect Zoho": the site owner authorises Passive Coder (one OAuth client,
 * registered once in api-console.zoho.com, env ZOHO_CLIENT_ID /
 * ZOHO_CLIENT_SECRET) against their own Zoho Mail organisation, free or paid.
 * The dashboard then adds + verifies the domain and creates / resets /
 * deletes mailboxes through Zoho's Mail API. No reseller partnership needed:
 * every organisation belongs to the client and is billed (if at all) by Zoho.
 *
 * Zoho runs separate data centres; the OAuth callback says which one the
 * account lives in (`location` + `accounts-server`), and every later call
 * goes to that region's hosts.
 */
export const ZOHO_SCOPES = [
  "ZohoMail.organization.ALL",
  "ZohoMail.organization.accounts.ALL",
  "ZohoMail.organization.domains.ALL",
  // Reading the signed-in user's own mail account is how we learn the
  // organisation id (zoid); without it Zoho answers INVALID_OAUTHSCOPE.
  "ZohoMail.accounts.READ",
].join(",");

const DC_FROM_LOCATION: Record<string, string> = { us: "com", in: "in", eu: "eu", au: "com.au", jp: "jp", ca: "ca", sa: "sa", uk: "uk" };

export function zohoConfigured() {
  return !!(process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET);
}

/**
 * Must match the redirect URI registered in the Zoho API console exactly.
 * Fixed to the www host (NEXT_PUBLIC_APP_URL has no www, which Zoho rejected
 * as "Invalid Redirect Uri"); ZOHO_REDIRECT_URI overrides it if ever needed.
 */
export function zohoRedirectUri() {
  if (process.env.ZOHO_REDIRECT_URI) return process.env.ZOHO_REDIRECT_URI;
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com").split(":")[0];
  return root.includes("localhost") ? `http://${root}/api/email/zoho/callback` : `https://www.${root}/api/email/zoho/callback`;
}

/* ── Signed OAuth state (tenant + user, 15 min) ──────────────────────── */
const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export function signState(tenantId: string, userId: string, returnTo: string) {
  const payload = Buffer.from(JSON.stringify({ t: tenantId, u: userId, r: returnTo, e: Date.now() + 15 * 60_000 })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(`zoho:${payload}`).digest("base64url");
  return `${payload}.${sig}`;
}
export function readState(state: string): { t: string; u: string; r: string } | null {
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return null;
  const want = Buffer.from(createHmac("sha256", secret()).update(`zoho:${payload}`).digest("base64url"));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as { t: string; u: string; r: string; e: number };
  return s.e > Date.now() ? s : null;
}

export function authorizeUrl(state: string) {
  const q = new URLSearchParams({
    scope: ZOHO_SCOPES, client_id: process.env.ZOHO_CLIENT_ID ?? "", response_type: "code",
    access_type: "offline", prompt: "consent", redirect_uri: zohoRedirectUri(), state,
  });
  // accounts.zoho.com redirects to the user's own data centre as needed.
  return `https://accounts.zoho.com/oauth/v2/auth?${q}`;
}

/** Exchange the code at the account's own accounts server. */
export async function exchangeCode(code: string, accountsServer: string, location: string) {
  const res = await fetch(`${accountsServer.replace(/\/$/, "")}/oauth/v2/token`, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code", code, redirect_uri: zohoRedirectUri(),
      client_id: process.env.ZOHO_CLIENT_ID ?? "", client_secret: process.env.ZOHO_CLIENT_SECRET ?? "",
    }),
  });
  const j = await res.json() as { access_token?: string; refresh_token?: string; error?: string };
  if (!j.refresh_token || !j.access_token) throw new Error(`Zoho sign-in failed: ${j.error ?? res.status}`);
  return { accessToken: j.access_token, refreshToken: j.refresh_token, dc: DC_FROM_LOCATION[location] ?? "com" };
}

export type ZohoConn = { tenant_id: string; dc: string; accounts_server: string; refresh_token: string; zoid: number | null; org_name: string | null };

/** Short-lived access token from the stored refresh token (cached per instance). */
const tokenCache = new Map<string, { token: string; exp: number }>();
async function accessToken(c: ZohoConn): Promise<string> {
  const hit = tokenCache.get(c.tenant_id);
  if (hit && hit.exp > Date.now() + 60_000) return hit.token;
  const res = await fetch(`${c.accounts_server.replace(/\/$/, "")}/oauth/v2/token`, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "refresh_token", refresh_token: c.refresh_token,
      client_id: process.env.ZOHO_CLIENT_ID ?? "", client_secret: process.env.ZOHO_CLIENT_SECRET ?? "",
    }),
  });
  const j = await res.json() as { access_token?: string; expires_in?: number; error?: string };
  if (!j.access_token) throw new Error(`Zoho connection expired or was revoked (${j.error ?? res.status}). Connect Zoho again.`);
  tokenCache.set(c.tenant_id, { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 });
  return j.access_token;
}

/** Call the Mail API in the account's data centre; returns `data` or throws Zoho's message. */
export async function zohoMail<T = unknown>(c: ZohoConn, path: string, init: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const token = init.token ?? await accessToken(c);
  const res = await fetch(`https://mail.zoho.${c.dc}/api${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  const raw = await res.text();
  let j: { status?: { code?: number; description?: string }; data?: T & { moreInfo?: string; errorCode?: string } } = {};
  try { j = JSON.parse(raw); } catch { /* not JSON */ }
  if (!res.ok || (j.status?.code && j.status.code >= 400)) {
    const d = j.data as { moreInfo?: string; errorCode?: string } | undefined;
    const detail = d?.moreInfo || d?.errorCode || j.status?.description || raw.slice(0, 160) || "no details";
    console.error("[zoho]", init.method ?? "GET", path, res.status, raw.slice(0, 400));
    if (j.status?.description === "Invalid Access" && path.startsWith("/organization/")) {
      throw new Error("The Zoho login you connected is a regular member of its organisation, not an admin, so Zoho won't let it manage domains or mailboxes. In Zoho Mail Admin Console > Users, make it an Admin (or Super Admin), or click Disconnect and connect again with the Zoho login that created the organisation.");
    }
    throw new Error(`Zoho (${res.status} on ${path}): ${detail}`);
  }
  return j.data as T;
}

export async function getConnection(admin: SupabaseClient, tenantId: string): Promise<ZohoConn | null> {
  const { data } = await admin.from("email_zoho_connections").select("*").eq("tenant_id", tenantId).maybeSingle();
  return (data as ZohoConn | null) ?? null;
}

/* ── Organisation, domain and mailbox operations ─────────────────────── */
/**
 * The organisation id (zoid). Tries the organisation endpoint first; if Zoho
 * refuses it (some accounts only allow per-user calls), reads the signed-in
 * user's own mail account, which carries its organisation id.
 */
export async function fetchOrg(c: ZohoConn, token?: string) {
  try {
    const d = await zohoMail<{ zoid?: number; companyName?: string; orgName?: string }>(c, "/organization", { token });
    if (d?.zoid) return { zoid: d.zoid, name: d.companyName ?? d.orgName ?? null };
  } catch (e) {
    console.error("[zoho] /organization failed, trying /accounts:", e instanceof Error ? e.message : e);
  }
  const accts = await zohoMail<{ accountName?: string; primaryEmailAddress?: string }[]>(c, "/accounts", { token });
  const a = Array.isArray(accts) ? accts[0] : undefined;
  const zoid = findZoid(a);
  if (!zoid) console.error("[zoho] no zoid in /accounts:", JSON.stringify(accts).slice(0, 600));
  if (!zoid) throw new Error("This Zoho account has no Zoho Mail organisation yet. Sign up for Zoho Mail with your domain first (step 1), then connect again.");
  return { zoid, name: a?.accountName ?? a?.primaryEmailAddress ?? null };
}

/** Zoho nests the organisation id differently per account type; find it anywhere. */
function findZoid(v: unknown, depth = 0): number | null {
  if (!v || typeof v !== "object" || depth > 4) return null;
  const o = v as Record<string, unknown>;
  for (const k of ["zoid", "organizationId", "orgId"]) {
    const n = Number(o[k]);
    if (n > 0) return n;
  }
  for (const x of Object.values(o)) {
    const n = findZoid(x, depth + 1);
    if (n) return n;
  }
  return null;
}

type ZDomain = { domainName: string; verificationStatus?: boolean | string; mxstatus?: string; CNAMEVerificationCode?: string; HTMLVerificationCode?: string; isPrimary?: boolean };

export async function listDomains(c: ZohoConn): Promise<ZDomain[]> {
  const d = await zohoMail<{ domainVOS?: ZDomain[] } | ZDomain[]>(c, `/organization/${c.zoid}/domains`);
  return Array.isArray(d) ? d : d.domainVOS ?? [];
}

/** Add the domain if missing; returns its record including the TXT verification code. */
export async function ensureDomain(c: ZohoConn, domain: string): Promise<ZDomain> {
  let found = (await listDomains(c)).find((x) => x.domainName.toLowerCase() === domain);
  if (!found) {
    await zohoMail(c, `/organization/${c.zoid}/domains`, { method: "POST", body: { domainName: domain } });
    found = (await listDomains(c)).find((x) => x.domainName.toLowerCase() === domain);
  }
  if (!found) throw new Error("Zoho didn't accept the domain. Check it isn't already added in another Zoho account.");
  return found;
}

/** The TXT value Zoho checks: zoho-verification=<code>.zmverify.zoho.<dc> */
export function verificationTxt(c: ZohoConn, d: ZDomain): string | null {
  const code = d.CNAMEVerificationCode || d.HTMLVerificationCode;
  if (!code) return null;
  return code.startsWith("zoho-verification=") ? code : `zoho-verification=${code}.zmverify.zoho.${c.dc}`;
}

export async function verifyDomain(c: ZohoConn, domain: string) {
  return zohoMail(c, `/organization/${c.zoid}/domains/${domain}`, { method: "PUT", body: { mode: "verifyDomainByTXT" } });
}

export type ZAccount = { zuid: number; accountId?: string; primaryEmailAddress?: string; emailAddress?: string; displayName?: string; firstName?: string; lastName?: string; role?: string };

export async function listAccounts(c: ZohoConn): Promise<ZAccount[]> {
  const d = await zohoMail<ZAccount[]>(c, `/organization/${c.zoid}/accounts`);
  return Array.isArray(d) ? d : [];
}

export async function createAccount(c: ZohoConn, a: { email: string; password: string; firstName: string; lastName?: string }) {
  return zohoMail<ZAccount>(c, `/organization/${c.zoid}/accounts`, {
    method: "POST",
    body: { primaryEmailAddress: a.email, password: a.password, firstName: a.firstName, lastName: a.lastName ?? "", displayName: `${a.firstName} ${a.lastName ?? ""}`.trim(), role: "member" },
  });
}

export async function resetPassword(c: ZohoConn, zuid: number, password: string) {
  return zohoMail(c, `/organization/${c.zoid}/accounts/${zuid}`, { method: "PUT", body: { mode: "resetPassword", password } });
}

export async function deleteAccount(c: ZohoConn, zuid: number) {
  return zohoMail(c, `/organization/${c.zoid}/accounts`, { method: "DELETE", body: { accountList: [zuid] } });
}

import "server-only";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { isStandalone } from "@/lib/flags";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { collectFacts, evaluateChecks, summarize, siteExists as factsSiteExists } from "../../../selfhost/lib/checks.mjs";
import { bucketsInSchema, connect, listMigrationFiles } from "../../../selfhost/lib/db.mjs";
import { installerGate } from "../../../selfhost/lib/gate.mjs";
import { PUBLIC_SETTINGS } from "../../../selfhost/lib/env.mjs";
import { hasWritableDisk } from "./local-settings";

/*
 * Server side of the web installer (/setup and /api/setup/*), standalone
 * (self-hosted) mode only.
 *
 * Every installer route starts with installerAccess(): it answers 404 on the
 * hosted platform, 409 once a site exists (the installer is then locked for
 * good), asks for SETUP_TOKEN when one is set, and rate-limits by IP. The
 * rules themselves are in selfhost/lib/gate.mjs (pure, tested).
 *
 * Nothing here ever returns a setting's value to the browser: results carry
 * names, counts and host names only.
 */

export type InstallPlatform = "vercel" | "docker" | "node";
export type CheckResult = { id: string; status: "ok" | "warn" | "fail" | "skip"; code: string; params: Record<string, string | number> };
export type Facts = Awaited<ReturnType<typeof collectFacts>>;

export function installPlatform(): InstallPlatform {
  if (process.env.VERCEL) return "vercel";
  if (process.env.PC_INSTALL_KIND === "docker" || existsSync("/.dockerenv")) return "docker";
  return "node";
}

/** Public settings as written into this build (Next.js replaces each
 *  `process.env.NEXT_PUBLIC_X` below with its value at build time). */
export function builtPublicSettings(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };
}

/** The settings as the server sees them now. Public ones the server was not
 *  given at run time (Vercel fills the site address in at build time) come
 *  from the build. */
export function currentSettings(): Record<string, string | undefined> {
  const runtime: Record<string, string | undefined> = { ...process.env };
  const built = builtPublicSettings();
  for (const k of PUBLIC_SETTINGS) if (!runtime[k]?.trim()) runtime[k] = built[k];
  return runtime;
}

const root = () => process.cwd();
export const schemaFilePath = () => path.join(root(), "selfhost", "schema.sql");
export const migrationsDir = () => path.join(root(), "supabase", "migrations");

let bucketsCache: string[] | null = null;
function expectedBuckets(): string[] {
  if (bucketsCache) return bucketsCache;
  try {
    bucketsCache = bucketsInSchema(readFileSync(schemaFilePath(), "utf8"));
  } catch {
    return ["media"];
  }
  return bucketsCache.length ? bucketsCache : ["media"];
}

/** Open a direct database connection (the `pg` package, loaded only here). */
export async function connectDatabase(url: string, timeoutMs = 10_000) {
  const pg = await import("pg");
  return connect(pg, url, { timeoutMs });
}

/** Look at everything: settings, Supabase, the database. */
export async function gatherFacts(browserOrigin: string | null): Promise<Facts> {
  return collectFacts({
    env: currentSettings(),
    built: builtPublicSettings(),
    connectDb: (url: string) => connectDatabase(url, 8000),
    migrationFiles: listMigrationFiles(migrationsDir()),
    expectedBuckets: expectedBuckets(),
    browserOrigin,
  });
}

export function runChecks(facts: Facts) {
  const results = evaluateChecks(facts) as CheckResult[];
  return { results, summary: summarize(facts, results) };
}

/** Is there a site already? A quick look, without the full set of checks.
 *  null = could not find out. */
export async function siteExistsNow(): Promise<boolean | null> {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (base && key) {
    try {
      const res = await fetch(`${base}/rest/v1/tenants?select=id&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });
      const body = await res.json().catch(() => null);
      if (res.ok && Array.isArray(body)) return body.length > 0;
      if (res.status === 404 || ["PGRST205", "PGRST202", "42P01"].includes(body?.code)) return false;
    } catch { /* fall through to the database */ }
  }
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  let db: Awaited<ReturnType<typeof connectDatabase>> | null = null;
  try {
    db = await connectDatabase(url, 6000);
    const { rows } = await db.query(`select pg_catalog.to_regclass('public.tenants') is not null as has`);
    if (!rows[0].has) return false;
    const n = await db.query(`select count(*)::int as n from public.tenants`);
    return n.rows[0].n > 0;
  } catch {
    return null;
  } finally {
    await db?.end().catch(() => {});
  }
}

const REASON_TEXT: Record<string, string> = {
  not_found: "Not found",
  installed: "This site is already set up. Please sign in.",
  token_required: "Enter the setup code. It is the SETUP_TOKEN value in this install's settings.",
  token_wrong: "The setup code is not right. It is the SETUP_TOKEN value in this install's settings.",
  state_unknown: "The database does not answer yet. Fix the items in the system check first.",
  rate_limited: "Too many tries. Please wait a few minutes.",
};

const deny = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  Response.json({ error: REASON_TEXT[code] ?? code, code, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

export const setupTokenFrom = (req: Request, bodyToken?: string | null) =>
  (req.headers.get("x-setup-token") ?? bodyToken ?? "").trim();

/**
 * The gate at the top of every installer route.
 * @param action "check" = read-only system check; "write" = anything else
 * @param known  pass the answer when the caller has already looked
 */
export async function installerAccess(
  req: Request,
  action: "check" | "write",
  opts: { scope: string; max: number; windowMs?: number; bodyToken?: string | null; known?: boolean | null },
): Promise<{ ok: true; siteExists: boolean | null } | { ok: false; response: Response }> {
  if (!isStandalone) return { ok: false, response: deny(404, "not_found") };
  if (rateLimited(`setup:${opts.scope}:${clientIp(req)}`, opts.max, opts.windowMs ?? 10 * 60_000)) {
    return { ok: false, response: deny(429, "rate_limited") };
  }
  const setupToken = process.env.SETUP_TOKEN?.trim() || null;
  const givenToken = setupTokenFrom(req, opts.bodyToken);
  const exists = opts.known !== undefined ? opts.known : await siteExistsNow();
  const gate = installerGate({ standalone: true, siteExists: exists, setupToken, givenToken, action });
  if (!gate.allow) {
    // Guessing the code: ten wrong tries, then a pause.
    if (gate.reason === "token_wrong" && rateLimited(`setup:wrong-code:${clientIp(req)}`, 10, 10 * 60_000)) {
      return { ok: false, response: deny(429, "rate_limited") };
    }
    return { ok: false, response: deny(gate.status, gate.reason, { needsToken: !!setupToken }) };
  }
  return { ok: true, siteExists: exists };
}

export { hasWritableDisk, factsSiteExists };

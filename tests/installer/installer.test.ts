/**
 * Self-host installer: the pure logic shared by the web installer (/setup),
 * the CLI (selfhost/cli) and the Docker image.
 *   settings and secrets  selfhost/lib/env.mjs
 *   who may use /setup    selfhost/lib/gate.mjs
 *   the system check      selfhost/lib/checks.mjs (+ check-messages.mjs, i18n)
 *   database load         selfhost/lib/db.mjs (with a fake client)
 *   ready-made image      selfhost/lib/runtime-config.mjs
 * Run: npm run test:installer
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as env from "../../selfhost/lib/env.mjs";
import { installerGate, sameSecret } from "../../selfhost/lib/gate.mjs";
import { CHECK_IDS, evaluateChecks, probeSupabase, settingsFacts, siteExists, summarize } from "../../selfhost/lib/checks.mjs";
import { CHECK_MESSAGES, CHECK_TITLES, checkText } from "../../selfhost/lib/check-messages.mjs";
import * as db from "../../selfhost/lib/db.mjs";
import * as rc from "../../selfhost/lib/runtime-config.mjs";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

const counter = () => {
  let n = 0;
  return (size: number) => Buffer.alloc(size, ++n);
};

/* ── env.mjs ─────────────────────────────────────────────────────────── */

test("generateSecrets makes only missing secrets, never replaces one", () => {
  const made = env.generateSecrets({ APP_SECRET: "keep-me", COURIER_SECRET_KEY: " " }, counter());
  assert.deepEqual(Object.keys(made).sort(), ["COURIER_SECRET_KEY", "CRON_SECRET", "SETUP_TOKEN"]);
  assert.equal(made.APP_SECRET, undefined);
  assert.ok(env.isCourierKey(made.COURIER_SECRET_KEY), "courier key is 32 bytes base64");
  assert.match(made.SETUP_TOKEN, /^[0-9a-f]{32}$/);
  assert.match(made.CRON_SECRET, /^[0-9a-f]{64}$/);
  // Real randomness: two runs differ.
  assert.notEqual(env.generateSecrets({}).APP_SECRET, env.generateSecrets({}).APP_SECRET);
});

test("isCourierKey wants exactly 32 bytes", () => {
  assert.equal(env.isCourierKey(Buffer.alloc(32, 7).toString("base64")), true);
  assert.equal(env.isCourierKey(Buffer.alloc(16, 7).toString("base64")), false);
  assert.equal(env.isCourierKey("not base64!"), false);
  assert.equal(env.isCourierKey(""), false);
});

test("siteAddress turns what people type into the two address settings", () => {
  assert.deepEqual(env.siteAddress("Example.com"), { rootDomain: "example.com", appUrl: "https://example.com", local: false });
  assert.deepEqual(env.siteAddress("https://www.example.com/"), { rootDomain: "www.example.com", appUrl: "https://www.example.com", local: false });
  assert.deepEqual(env.siteAddress("localhost:3000"), { rootDomain: "localhost:3000", appUrl: "http://localhost:3000", local: true });
  assert.equal(env.siteAddress("http://192.168.1.5:3000")?.appUrl, "http://192.168.1.5:3000");
  for (const bad of ["", "not a domain", "foo", "https://user:pw@example.com", "exa_mple.com"]) assert.equal(env.siteAddress(bad), null, bad);
});

test("checkSupabaseUrl explains the usual mistakes", () => {
  assert.equal(env.checkSupabaseUrl("https://abcd.supabase.co"), null);
  assert.equal(env.checkSupabaseUrl("https://abcd.supabase.co/"), null);
  assert.equal(env.checkSupabaseUrl(""), "empty");
  assert.equal(env.checkSupabaseUrl("abcd.supabase.co"), "not_a_url");
  assert.equal(env.checkSupabaseUrl("https://supabase.com/dashboard/project/abcd"), "dashboard_link");
  assert.equal(env.checkSupabaseUrl("https://abcd.supabase.co/rest/v1"), "has_path");
});

test("supabaseKeyKind tells public and secret keys apart, new and old style", () => {
  const jwt = (role: string) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.sig`;
  assert.equal(env.supabaseKeyKind("sb_publishable_abc"), "publishable");
  assert.equal(env.supabaseKeyKind("sb_secret_abc"), "secret");
  assert.equal(env.supabaseKeyKind(jwt("anon")), "publishable");
  assert.equal(env.supabaseKeyKind(jwt("service_role")), "secret");
  assert.equal(env.supabaseKeyKind("whatever"), "unknown");
  assert.equal(env.supabaseKeyKind(""), "empty");
});

test("checkDatabaseUrl and isTransactionPooler", () => {
  assert.equal(env.checkDatabaseUrl("postgresql://postgres.x:pw@aws-0-eu.pooler.supabase.com:5432/postgres"), null);
  assert.equal(env.checkDatabaseUrl(""), "empty");
  assert.equal(env.checkDatabaseUrl("mysql://a:b@c/d"), "not_postgres");
  assert.equal(env.checkDatabaseUrl("postgresql://postgres.x:[YOUR-PASSWORD]@h:5432/postgres"), "password_placeholder");
  assert.equal(env.checkDatabaseUrl("postgresql://postgres.x@h:5432/postgres"), "no_password");
  assert.equal(env.isTransactionPooler("postgresql://u:p@aws-0-eu.pooler.supabase.com:6543/postgres"), true);
  assert.equal(env.isTransactionPooler("postgresql://u:p@aws-0-eu.pooler.supabase.com:5432/postgres"), false);
});

test("settings file: values round-trip through envValue, mergeEnv and parseEnv", () => {
  const tricky = { A: "plain", B: "has space", C: "p@ss$word#1", D: 'with "double"', E: "" };
  const text = env.mergeEnv("# keep this comment\nA=old\nOTHER=1\n", tricky);
  assert.match(text, /^# keep this comment\nA=plain\nOTHER=1\n/);
  assert.ok(!/^E=/m.test(text), "empty values are skipped");
  const back = env.parseEnv(text);
  assert.equal(back.A, "plain");
  assert.equal(back.B, "has space");
  assert.equal(back.C, "p@ss$word#1");
  assert.equal(back.D, 'with "double"');
  assert.equal(back.OTHER, "1");
  assert.throws(() => env.envValue("it's"), /single quote/);
  assert.throws(() => env.envValue("two\nlines"), /line break/);
  // A header only for a new file.
  assert.ok(env.mergeEnv("", { A: "1" }, { header: env.ENV_HEADER }).startsWith("# Passive Coder CMS"));
});

test("parseEnv reads the usual formats", () => {
  const v = env.parseEnv("export A=1\nB='x y'\nC=\"q\\\"r\"\nD=val # comment\n# E=no\n  F = spaced \n");
  assert.deepEqual(v, { A: "1", B: "x y", C: 'q"r', D: "val", F: "spaced" });
});

test("buildSettings writes standalone mode, the address pair and new secrets only", () => {
  const s = env.buildSettings(
    { supabaseUrl: "https://abcd.supabase.co/", anonKey: "sb_publishable_x", serviceKey: "sb_secret_y", databaseUrl: "postgresql://u:p@h:5432/d", address: "www.example.com" },
    { APP_SECRET: "already-here-and-long-enough-123456" },
    counter(),
  );
  assert.equal(s.values.NEXT_PUBLIC_CMS_MODE, "standalone");
  assert.equal(s.values.NEXT_PUBLIC_SUPABASE_URL, "https://abcd.supabase.co");
  assert.equal(s.values.NEXT_PUBLIC_ROOT_DOMAIN, "www.example.com");
  assert.equal(s.values.NEXT_PUBLIC_APP_URL, "https://www.example.com");
  assert.equal((s.values as Record<string, string | undefined>).APP_SECRET, undefined, "an existing secret is not replaced");
  assert.deepEqual(s.newSecrets.sort(), ["COURIER_SECRET_KEY", "CRON_SECRET", "SETUP_TOKEN"]);
  assert.throws(() => env.buildSettings({ supabaseUrl: "", anonKey: "", serviceKey: "", address: "nope" }));
});

test("Deploy to Vercel link: public repo, every asked setting, guide link", () => {
  const url = new URL(env.vercelDeployUrl());
  assert.equal(url.origin + url.pathname, "https://vercel.com/new/clone");
  assert.equal(url.searchParams.get("repository-url"), "https://github.com/PassiveCoderOfficial/PassiveCoderCMS");
  assert.deepEqual(url.searchParams.get("env")?.split(","), env.VERCEL_ENV);
  for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL", "SETUP_TOKEN"]) {
    assert.ok(env.VERCEL_ENV.includes(k), k);
  }
  assert.match(url.searchParams.get("envLink") ?? "", /INSTALL-CLOUD\.md#2-click-deploy$/);
  // The docs carry the same link.
  for (const f of ["selfhost/README.md", "selfhost/INSTALL-CLOUD.md", "open-source/public-root/README.md"]) {
    assert.ok(readFileSync(f, "utf8").includes(env.vercelDeployUrl()), `${f} has the current Deploy link`);
  }
  // The guide has the heading the link points at.
  assert.match(readFileSync("selfhost/INSTALL-CLOUD.md", "utf8"), /^## 2\. Click deploy$/m);
});

/* ── gate.mjs ────────────────────────────────────────────────────────── */

test("installer gate: hosted mode, installed, setup code, unknown state", () => {
  const base = { standalone: true, siteExists: false, setupToken: null, givenToken: null, action: "write" as const };
  assert.deepEqual(installerGate({ ...base, standalone: false }), { allow: false, status: 404, reason: "not_found" });
  assert.deepEqual(installerGate({ ...base, siteExists: true }), { allow: false, status: 409, reason: "installed" });
  // Locked even with the right code.
  assert.equal(installerGate({ ...base, siteExists: true, setupToken: "abc", givenToken: "abc" }).allow, false);
  assert.deepEqual(installerGate({ ...base, setupToken: "abc" }), { allow: false, status: 401, reason: "token_required" });
  assert.deepEqual(installerGate({ ...base, setupToken: "abc", givenToken: "abd" }), { allow: false, status: 403, reason: "token_wrong" });
  assert.deepEqual(installerGate({ ...base, setupToken: " abc ", givenToken: "abc" }), { allow: true });
  assert.deepEqual(installerGate(base), { allow: true });
  // Database state unknown: read-only checks yes, writes no.
  assert.deepEqual(installerGate({ ...base, siteExists: null }), { allow: false, status: 503, reason: "state_unknown" });
  assert.deepEqual(installerGate({ ...base, siteExists: null, action: "check" }), { allow: true });
  // ...but the setup code still comes first.
  assert.equal(installerGate({ ...base, siteExists: null, action: "check", setupToken: "x" }).allow, false);
});

test("sameSecret compares any lengths", () => {
  assert.equal(sameSecret("a", "a"), true);
  assert.equal(sameSecret("a", "ab"), false);
  assert.equal(sameSecret("", ""), true);
});

/* ── checks.mjs ──────────────────────────────────────────────────────── */

const GOOD_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_x",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_y",
  NEXT_PUBLIC_ROOT_DOMAIN: "www.example.com",
  NEXT_PUBLIC_APP_URL: "https://www.example.com",
  DATABASE_URL: "postgresql://u:p@aws-0-eu.pooler.supabase.com:5432/postgres",
  APP_SECRET: "x".repeat(40),
  COURIER_SECRET_KEY: Buffer.alloc(32, 1).toString("base64"),
  SETUP_TOKEN: "t".repeat(32),
  CRON_SECRET: "c".repeat(64),
};

function facts(over: Any = {}): Any {
  return {
    settings: settingsFacts({ ...GOOD_ENV, ...(over.env ?? {}) }, over.built ?? null),
    supabase: { reachable: true, anonOk: true, serviceOk: true, schema: "loaded", sites: 0, applied: ["300_a.sql"], buckets: ["media", "site-packages"], ...(over.supabase ?? {}) },
    database: { configured: true, reachable: true, error: null, state: "ours", applied: ["300_a.sql"], sites: 0, ...(over.database ?? {}) },
    migrationFiles: over.migrationFiles ?? ["300_a.sql"],
    expectedBuckets: ["media", "site-packages"],
    browserOrigin: over.browserOrigin === undefined ? "https://www.example.com" : over.browserOrigin,
  };
}
const byId = (results: Any[]) => Object.fromEntries(results.map((r) => [r.id, r]));

test("a healthy install passes every check, in the fixed order", () => {
  const f = facts();
  const results = evaluateChecks(f);
  assert.deepEqual(results.map((r: Any) => r.id), CHECK_IDS);
  const notOk = results.filter((r: Any) => r.status !== "ok" && r.id !== "email");
  assert.deepEqual(notOk, []);
  assert.equal(byId(results).email.code, "email_not_configured");
  const sum = summarize(f, results);
  assert.equal(sum.ready, true);
  assert.equal(sum.siteExists, false);
});

test("missing settings and wrong keys get their own codes", () => {
  const r1 = byId(evaluateChecks(facts({ env: { SUPABASE_SERVICE_ROLE_KEY: "", NEXT_PUBLIC_APP_URL: "" } })));
  assert.equal(r1.settings.status, "fail");
  assert.match(String(r1.settings.params.names), /SUPABASE_SERVICE_ROLE_KEY/);
  assert.equal(r1.service_key.code, "service_key_missing");

  const r2 = byId(evaluateChecks(facts({ env: { NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_secret_oops" } })));
  assert.equal(r2.supabase.code, "anon_key_is_secret");
  const r3 = byId(evaluateChecks(facts({ env: { SUPABASE_SERVICE_ROLE_KEY: "sb_publishable_oops" } })));
  assert.equal(r3.service_key.code, "service_key_is_public");
  const r4 = byId(evaluateChecks(facts({ supabase: { reachable: false, serviceOk: null } })));
  assert.equal(r4.supabase.code, "supabase_unreachable");
  assert.equal(r4.service_key.status, "skip");
  const r5 = byId(evaluateChecks(facts({ env: { NEXT_PUBLIC_SUPABASE_URL: "https://supabase.com/dashboard/project/x" } })));
  assert.equal(r5.supabase.code, "supabase_url_dashboard_link");
});

test("the app built with other public settings is reported (stale build)", () => {
  const r = byId(evaluateChecks(facts({ built: { ...GOOD_ENV, NEXT_PUBLIC_APP_URL: "https://old.example.com" } })));
  assert.equal(r.build.code, "build_stale");
  assert.match(String(r.build.params.names), /NEXT_PUBLIC_APP_URL/);
  // A trailing slash is not a difference.
  const same = byId(evaluateChecks(facts({ built: { ...GOOD_ENV, NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co/" } })));
  assert.equal(same.build.status, "ok");
});

test("empty database: only the schema blocks, and the installer can load it", () => {
  const f = facts({ supabase: { schema: "missing", sites: null, applied: null, buckets: [] }, database: { state: "empty", applied: null, sites: 0 } });
  const results = evaluateChecks(f);
  const r = byId(results);
  assert.equal(r.schema.code, "schema_empty");
  assert.equal(r.storage.code, "needs_schema");
  const sum = summarize(f, results);
  assert.equal(sum.ready, false);
  assert.deepEqual(sum.blocking, ["schema"]);
  assert.equal(sum.onlyDatabaseMissing, true);
  assert.equal(sum.canLoadDatabase, true);
});

test("a database with other tables is refused, never loaded", () => {
  const f = facts({ supabase: { schema: "missing" }, database: { state: "foreign", applied: null, sites: 0 } });
  const results = evaluateChecks(f);
  assert.equal(byId(results).schema.code, "schema_foreign");
  const sum = summarize(f, results);
  assert.equal(sum.canLoadDatabase, false);
  assert.equal(sum.onlyDatabaseMissing, false);
});

test("database connection problems map to plain-language codes", () => {
  const r = byId(evaluateChecks(facts({ database: { reachable: false, error: "auth", state: "unknown" } })));
  assert.equal(r.database.code, "database_auth");
  assert.equal(r.database.status, "warn", "tables already there: the site works without it");
  const r2 = byId(evaluateChecks(facts({ env: { DATABASE_URL: "" }, database: { configured: false, reachable: false, state: "unknown" }, supabase: { schema: "missing" } })));
  assert.equal(r2.database.code, "database_url_missing");
  assert.equal(r2.database.status, "fail");
  assert.equal(r2.schema.code, "schema_missing_no_url");
  const r3 = byId(evaluateChecks(facts({ env: { DATABASE_URL: "postgresql://u:[YOUR-PASSWORD]@h:5432/d" }, database: { reachable: false, error: "format", state: "unknown" } })));
  assert.equal(r3.database.code, "database_url_password_placeholder");
  const r4 = byId(evaluateChecks(facts({ env: { DATABASE_URL: "postgresql://u:p@aws-0-eu.pooler.supabase.com:6543/postgres" } })));
  assert.equal(r4.database.code, "database_transaction_pooler");
});

test("pending updates, missing buckets, secrets, cron, email, address", () => {
  const r = byId(evaluateChecks(facts({ migrationFiles: ["300_a.sql", "301_b.sql"] })));
  assert.equal(r.schema.code, "schema_pending");
  assert.equal(r.schema.params.count, 1);

  assert.equal(byId(evaluateChecks(facts({ supabase: { buckets: ["site-packages"] } }))).storage.status, "fail");
  assert.equal(byId(evaluateChecks(facts({ supabase: { buckets: ["media"] } }))).storage.status, "warn");

  assert.equal(byId(evaluateChecks(facts({ env: { COURIER_SECRET_KEY: "short" } }))).secrets.code, "courier_key_bad");
  assert.equal(byId(evaluateChecks(facts({ env: { APP_SECRET: "" } }))).secrets.code, "app_secret_missing");
  assert.equal(byId(evaluateChecks(facts({ env: { SETUP_TOKEN: "" } }))).setup_code.code, "setup_token_missing");
  assert.equal(byId(evaluateChecks(facts({ env: { CRON_SECRET: "" } }))).cron.code, "cron_secret_missing");
  assert.equal(byId(evaluateChecks(facts({ env: { RESEND_API_KEY: "re_x" } }))).email.code, "email_from_missing");
  assert.equal(byId(evaluateChecks(facts({ env: { RESEND_API_KEY: "re_x", EMAIL_FROM: "A <a@b.co>" } }))).email.code, "email_ok");

  assert.equal(byId(evaluateChecks(facts({ browserOrigin: "https://other.example.net" }))).address.code, "address_mismatch");
  assert.equal(byId(evaluateChecks(facts({ browserOrigin: "https://example.com" }))).address.code, "address_www");
  assert.equal(byId(evaluateChecks(facts({ browserOrigin: "http://www.example.com" }))).address.code, "address_scheme");
  assert.equal(byId(evaluateChecks(facts({ browserOrigin: null }))).address.code, "address_not_checked");
});

test("siteExists: from the database first, the API second, null when unknown", () => {
  assert.equal(siteExists(facts({ database: { sites: 1 } })), true);
  assert.equal(siteExists(facts({ database: { state: "empty", sites: 0 } })), false);
  assert.equal(siteExists(facts({ database: { reachable: false, state: "unknown" }, supabase: { schema: "loaded", sites: 1 } })), true);
  assert.equal(siteExists(facts({ database: { reachable: false, state: "unknown" }, supabase: { schema: "missing" } })), false);
  assert.equal(siteExists(facts({ database: { reachable: false, state: "unknown" }, supabase: { schema: "unknown" } })), null);
});

test("no check result ever carries a secret value", () => {
  const secretEnv = { ...GOOD_ENV, RESEND_API_KEY: "re_supersecret", EMAIL_FROM: "A <a@b.co>" };
  const all = [
    evaluateChecks(facts({ env: secretEnv })),
    evaluateChecks(facts({ env: { ...secretEnv, CRON_SECRET: "" }, database: { reachable: false, error: "auth", state: "unknown" } })),
    evaluateChecks(facts({ env: { ...secretEnv, NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_secret_leak" } })),
  ];
  const text = JSON.stringify(all);
  for (const v of [secretEnv.SUPABASE_SERVICE_ROLE_KEY, secretEnv.APP_SECRET, secretEnv.COURIER_SECRET_KEY, secretEnv.SETUP_TOKEN, secretEnv.CRON_SECRET, "re_supersecret", "sb_secret_leak", "u:p@"]) {
    assert.ok(!text.includes(v), `result leaks ${v.slice(0, 6)}...`);
  }
});

test("probeSupabase reads keys and schema state from the API (fake fetch)", async () => {
  const calls: string[] = [];
  const fetchImpl = async (url: string) => {
    calls.push(url);
    const json = (status: number, body: unknown) => ({ status, json: async () => body });
    if (url.endsWith("/auth/v1/settings")) return json(200, {});
    if (url.includes("/auth/v1/admin/users")) return json(200, { users: [] });
    if (url.includes("/rest/v1/tenants")) return json(404, { code: "PGRST205" });
    if (url.includes("/rest/v1/selfhost_migrations")) return json(404, { code: "PGRST205" });
    if (url.endsWith("/storage/v1/bucket")) return json(200, []);
    return json(500, null);
  };
  const p = await probeSupabase({ url: "https://abcd.supabase.co/", anonKey: "a", serviceKey: "s", fetchImpl: fetchImpl as Any });
  assert.equal(p.reachable, true);
  assert.equal(p.anonOk, true);
  assert.equal(p.serviceOk, true);
  assert.equal(p.schema, "missing");
  assert.ok(calls.every((u) => u.startsWith("https://abcd.supabase.co/")));

  const down = await probeSupabase({ url: "https://abcd.supabase.co", anonKey: "a", serviceKey: "s", fetchImpl: (async () => { throw new Error("offline"); }) as Any });
  assert.equal(down.reachable, false);
  const badKey = await probeSupabase({ url: "https://abcd.supabase.co", anonKey: "a", serviceKey: "s", fetchImpl: (async (u: string) => ({ status: u.includes("admin") ? 401 : 200, json: async () => ({}) })) as Any });
  assert.equal(badKey.serviceOk, false);
});

test("every check code and title has English text, and en + bn installer strings", () => {
  // Codes the checks can produce in the scenarios above, plus every way a
  // connection or a settings value can fail.
  const codes = new Set<string>();
  const scenarios = [
    facts(), facts({ env: { SUPABASE_SERVICE_ROLE_KEY: "" } }), facts({ supabase: { reachable: false } }),
    facts({ supabase: { schema: "missing" }, database: { state: "empty" } }), facts({ database: { state: "foreign" }, supabase: { schema: "missing" } }),
    facts({ database: { reachable: false, state: "unknown" }, supabase: { schema: "unknown" } }), facts({ migrationFiles: ["300_a.sql", "9_x.sql"] }),
    facts({ env: { COURIER_SECRET_KEY: "", SETUP_TOKEN: "", CRON_SECRET: "" }, browserOrigin: "https://x.org" }),
  ];
  for (const f of scenarios) for (const r of evaluateChecks(f)) codes.add(r.code);
  for (const e of ["auth", "project", "host", "network", "other"]) codes.add(`database_${e}`);
  for (const e of ["not_a_url", "not_postgres", "password_placeholder", "no_password"]) codes.add(`database_url_${e}`);
  for (const e of ["not_a_url", "dashboard_link", "has_path"]) codes.add(`supabase_url_${e}`);
  const en = readFileSync("src/lib/i18n/locales/en.ts", "utf8");
  const bn = readFileSync("src/lib/i18n/locales/bn.ts", "utf8");
  for (const code of codes) assert.ok(CHECK_MESSAGES[code], `check-messages.mjs: ${code}`);
  for (const code of Object.keys(CHECK_MESSAGES)) {
    assert.ok(en.includes(`"installer.fix.${code}"`), `en: installer.fix.${code}`);
    assert.ok(bn.includes(`"installer.fix.${code}"`), `bn: installer.fix.${code}`);
  }
  for (const id of CHECK_IDS) {
    assert.ok(CHECK_TITLES[id], `title ${id}`);
    assert.ok(en.includes(`"installer.check.title.${id}"`) && bn.includes(`"installer.check.title.${id}"`), `i18n title ${id}`);
  }
  // Every installer key in English exists in Bangla, and the other way round.
  const keys = (t: string) => new Set([...t.matchAll(/"(installer\.[^"]+)"\s*:/g)].map((m) => m[1]));
  const ek = keys(en), bk = keys(bn);
  assert.deepEqual([...ek].filter((k) => !bk.has(k)), []);
  assert.deepEqual([...bk].filter((k) => !ek.has(k)), []);
  assert.equal(checkText("schema_pending", { count: 3 }), "The tables are there. 3 update(s) from this version are waiting to be applied.");
});

/* ── db.mjs ──────────────────────────────────────────────────────────── */

test("splitSql keeps function bodies, strings and comments whole", () => {
  const sql = `
    -- a comment; with a semicolon
    SET statement_timeout = 0;
    create function f() returns int language plpgsql as $$ begin return 1; end; $$;
    insert into t values ('a;b', E'c\\';d', 'it''s');
    /* block ; comment */ create table "x;y" (id int);
    do $tag$ begin perform 1; end $tag$;
    ;
  `;
  const parts = db.splitSql(sql);
  assert.equal(parts.length, 5);
  assert.match(parts[1], /^create function f\(\)[\s\S]*\$\$;?$/);
  assert.match(parts[2], /'it''s'\);?$/);
  assert.match(parts[3], /^create table "x;y"/);
});

test("transactionLocal keeps session settings inside the transaction", () => {
  assert.equal(db.transactionLocal("SET statement_timeout = 0"), "SET LOCAL statement_timeout = 0");
  assert.equal(db.transactionLocal("SET LOCAL x = 1"), "SET LOCAL x = 1");
  assert.equal(db.transactionLocal("SELECT pg_catalog.set_config('search_path', '', false)"), "SELECT pg_catalog.set_config('search_path', '', true)");
  assert.equal(db.transactionLocal("create table a (id int)"), "create table a (id int)");
});

test("pendingMigrations, chunkStatements, bucketsInSchema, classifyDbError", () => {
  assert.deepEqual(db.pendingMigrations(["1_a.sql", "2_b.sql", "3_c.sql"], ["1_a.sql", "3_c.sql"]), ["2_b.sql"]);
  const chunks = db.chunkStatements(["a", "b", "c", "d"], 2);
  assert.deepEqual(chunks.flat(), ["a", "b", "c", "d"]);
  assert.ok(chunks.length <= 3);
  assert.deepEqual(db.bucketsInSchema("insert into storage.buckets (id, name) values ('media', 'media');\nINSERT INTO storage.buckets (id) VALUES ('docs');"), ["media", "docs"]);
  assert.equal(db.classifyDbError({ code: "28P01", message: "password authentication failed" }), "auth");
  assert.equal(db.classifyDbError({ message: "Tenant or user not found" }), "project");
  assert.equal(db.classifyDbError({ code: "ENOTFOUND", message: "getaddrinfo ENOTFOUND x" }), "host");
  assert.equal(db.classifyDbError({ code: "ETIMEDOUT" }), "network");
  assert.equal(db.classifyDbError(new Error("something else")), "other");
});

/** A pretend database: answers inspect() from `state`, records the rest. */
function fakeDb(state: "empty" | "ours" | "foreign", { failOn = "" } = {}) {
  const log: string[] = [];
  return {
    log,
    async query(sql: string) {
      log.push(sql);
      if (/pg_tables where schemaname = 'public'\) as tables/.test(sql)) {
        return { rows: [{ tables: state === "empty" ? 0 : 5, has_tenants: state === "ours", has_settings: state === "ours", has_migrations: false }] };
      }
      if (/count\(\*\)::int as n from public\.tenants/.test(sql)) return { rows: [{ n: 0 }] };
      if (/count\(\*\)::int as n from pg_catalog\.pg_tables/.test(sql)) return { rows: [{ n: 2 }] };
      if (failOn && sql.includes(failOn)) throw new Error("boom");
      return { rows: [] };
    },
  };
}

test("loadSchema: one transaction under a lock, refuses a database that is not empty", async () => {
  const empty = fakeDb("empty");
  const progress: number[] = [];
  const res = await db.loadSchema(empty, "create table a (id int);\ncreate table b (id int);", { onProgress: (d: number) => progress.push(d), parts: 2 });
  assert.equal(res.statements, 2);
  assert.equal(empty.log[0], "begin");
  assert.match(empty.log[1], /pg_advisory_xact_lock/);
  assert.ok(empty.log.includes("commit"));
  assert.equal(progress.at(-1), 2);

  for (const state of ["ours", "foreign"] as const) {
    const full = fakeDb(state);
    await assert.rejects(db.loadSchema(full, "create table a (id int);"), (e: Any) => e instanceof db.DatabaseNotEmptyError && e.state === state);
    assert.ok(full.log.includes("rollback"));
    assert.ok(!full.log.some((q) => q.includes("create table a")), "nothing ran");
  }

  const broken = fakeDb("empty", { failOn: "create table b" });
  await assert.rejects(db.loadSchema(broken, "create table a (id int);\ncreate table b (id int);", { parts: 2 }));
  assert.ok(broken.log.includes("rollback"));
  assert.ok(!broken.log.includes("commit"));
});

/* ── runtime-config.mjs (the ready-made Docker image) ────────────────── */

const REAL = {
  NEXT_PUBLIC_SUPABASE_URL: "https://realproj.supabase.co/",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_RealKey-123",
  NEXT_PUBLIC_ROOT_DOMAIN: "www.shop.com",
  NEXT_PUBLIC_APP_URL: "https://www.shop.com",
};

test("runtimeValues checks the values that go into the built files", () => {
  const ok = rc.runtimeValues(REAL);
  assert.equal(ok.ok, true);
  assert.equal((ok as Any).values.NEXT_PUBLIC_SUPABASE_URL, "https://realproj.supabase.co");
  const missing = rc.runtimeValues({ ...REAL, NEXT_PUBLIC_APP_URL: "" }) as Any;
  assert.deepEqual(missing.missing, ["NEXT_PUBLIC_APP_URL"]);
  // Quotes, backslashes, braces could break out of a JS string: refused.
  for (const bad of ['x"y', "x'y", "x\\y", "x`y", "${x}", "a b"]) {
    assert.equal(rc.runtimeValues({ ...REAL, NEXT_PUBLIC_SUPABASE_ANON_KEY: bad }).ok, false, bad);
  }
  assert.equal(rc.runtimeValues({ ...REAL, NEXT_PUBLIC_APP_URL: "https://www.shop.com/path" }).ok, false);
  assert.equal(rc.runtimeValues({ ...REAL, NEXT_PUBLIC_ROOT_DOMAIN: "pcplaceholderrootdomain.invalid" }).ok, false);
});

test("applyValues replaces every form of every placeholder", () => {
  const values = (rc.runtimeValues(REAL) as Any).values;
  const pairs = rc.replacementPairs(values);
  const P = rc.PLACEHOLDERS;
  const built = [
    `const u="${P.NEXT_PUBLIC_SUPABASE_URL}",k="${P.NEXT_PUBLIC_SUPABASE_ANON_KEY}";`,
    `{"hostname":"pcplaceholdersupabase.supabase.co","destination":"${P.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/:path*"}`,
    `{"re":"^pcplaceholdersupabase\\\\.supabase\\\\.co$"} /pcplaceholdersupabase\\.supabase\\.co/`,
    `<a href="${P.NEXT_PUBLIC_APP_URL}/x">pcplaceholderappurl.invalid</a> root=${P.NEXT_PUBLIC_ROOT_DOMAIN}`,
  ].join("\n");
  const out = rc.applyValues(built, pairs);
  assert.ok(!out.includes(rc.MARKER), out);
  assert.match(out, /const u="https:\/\/realproj\.supabase\.co",k="sb_publishable_RealKey-123";/);
  assert.match(out, /"hostname":"realproj\.supabase\.co"/);
  assert.match(out, /"destination":"https:\/\/realproj\.supabase\.co\/storage/);
  assert.ok(out.includes(`"^realproj\\\\.supabase\\\\.co$"`));
  assert.ok(out.includes(`/realproj\\.supabase\\.co/`));
  assert.match(out, /<a href="https:\/\/www\.shop\.com\/x">www\.shop\.com<\/a> root=www\.shop\.com/);
  // Same input, same stamp; different values, different stamp.
  assert.equal(rc.valuesStamp(values), rc.valuesStamp({ ...values }));
  assert.notEqual(rc.valuesStamp(values), rc.valuesStamp({ ...values, NEXT_PUBLIC_ROOT_DOMAIN: "a.com" }));
  assert.equal(rc.isTextAsset("server/app/page.js"), true);
  assert.equal(rc.isTextAsset("static/media/font.woff2"), false);
});

test("the Dockerfile builds the ready-made image with the same placeholders", () => {
  const dockerfile = readFileSync("Dockerfile", "utf8");
  for (const [k, v] of Object.entries(rc.PLACEHOLDERS)) assert.ok(dockerfile.includes(`${k}=${v}`), k);
  assert.match(dockerfile, /CMD \["node", "selfhost\/docker-entrypoint\.mjs"\]/);
});

test("shell scripts and Docker files keep LF line endings", () => {
  const attrs = readFileSync(".gitattributes", "utf8");
  for (const p of ["*.sh", "Dockerfile", "selfhost/crontab.example"]) assert.match(attrs, new RegExp(`^${p.replace(/[.*]/g, (c) => `\\${c}`)}\\s+text eol=lf`, "m"), p);
  for (const f of ["selfhost/install.sh", "selfhost/update.sh"]) assert.ok(!readFileSync(f, "utf8").includes("\r"), `${f} has CRLF`);
});

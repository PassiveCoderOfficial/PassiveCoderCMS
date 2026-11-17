/**
 * The install checks: the same list for the web installer (step 0) and
 * `passivecoder doctor` in the terminal.
 *
 * Two halves:
 *   collectFacts()    looks at the settings, Supabase and the database
 *   evaluateChecks()  pure: turns those facts into the list of results
 *
 * A result is { id, status, code, params }. `code` names the exact problem;
 * the web installer translates it (installer.fix.<code> in the i18n files),
 * the CLI prints the English text from check-messages.mjs. No result ever
 * carries a secret: only names, counts and host names.
 */
import { REQUIRED_SETTINGS, PUBLIC_SETTINGS, checkSupabaseUrl, checkDatabaseUrl, supabaseKeyKind, isCourierKey, isTransactionPooler } from "./env.mjs";
import { classifyDbError, inspect, pendingMigrations } from "./db.mjs";

/** Order shown to the user. */
export const CHECK_IDS = ["settings", "build", "supabase", "service_key", "database", "schema", "storage", "secrets", "setup_code", "cron", "email", "address"];

const has = (env, k) => !!String(env[k] ?? "").trim();
const hostOf = (u) => { try { return new URL(u).host.toLowerCase(); } catch { return ""; } };
const bare = (h) => String(h ?? "").toLowerCase().replace(/^www\./, "");

/**
 * Facts read from the settings alone (no network).
 * @param {Record<string, string | undefined>} env
 * @param {Record<string, string | undefined>} [built] public settings the running app was built with, when known
 */
export function settingsFacts(env, built = null) {
  const missing = REQUIRED_SETTINGS.filter((k) => !has(env, k));
  const stale = built ? PUBLIC_SETTINGS.filter((k) => has(env, k) && has(built, k) && String(env[k]).trim().replace(/\/+$/, "") !== String(built[k]).trim().replace(/\/+$/, "")) : [];
  return {
    missing,
    stale,
    supabaseUrlProblem: has(env, "NEXT_PUBLIC_SUPABASE_URL") ? checkSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL) : null,
    anonKind: supabaseKeyKind(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceKind: supabaseKeyKind(env.SUPABASE_SERVICE_ROLE_KEY),
    databaseUrlProblem: checkDatabaseUrl(env.DATABASE_URL),
    transactionPooler: isTransactionPooler(env.DATABASE_URL),
    appSecret: !has(env, "APP_SECRET") ? "missing" : String(env.APP_SECRET).trim().length < 24 ? "short" : "ok",
    courierKey: !has(env, "COURIER_SECRET_KEY") ? "missing" : isCourierKey(env.COURIER_SECRET_KEY) ? "ok" : "bad",
    setupToken: has(env, "SETUP_TOKEN"),
    cronSecret: has(env, "CRON_SECRET"),
    // Resend, or the install's own mail server (SMTP).
    emailKey: has(env, "RESEND_API_KEY") || has(env, "SMTP_HOST"),
    emailFrom: has(env, "EMAIL_FROM"),
    appUrl: String(env.NEXT_PUBLIC_APP_URL ?? "").trim(),
    rootDomain: String(env.NEXT_PUBLIC_ROOT_DOMAIN ?? "").trim(),
  };
}

async function getJson(fetchImpl, url, headers, timeoutMs) {
  try {
    const res = await fetchImpl(url, { headers, signal: AbortSignal.timeout(timeoutMs), redirect: "manual", cache: "no-store" });
    let body = null;
    try { body = await res.json(); } catch { /* not JSON */ }
    return { status: res.status, body };
  } catch {
    return { status: 0, body: null };
  }
}

/**
 * Ask Supabase (over its public API) what works. Never throws.
 * @returns {Promise<{ reachable: boolean, anonOk: boolean|null, serviceOk: boolean|null, schema: "loaded"|"missing"|"unknown", sites: number|null, applied: string[]|null, buckets: string[]|null }>}
 */
export async function probeSupabase({ url, anonKey, serviceKey, fetchImpl = fetch, timeoutMs = 8000 }) {
  const base = String(url ?? "").trim().replace(/\/+$/, "");
  const out = { reachable: false, anonOk: null, serviceOk: null, schema: "unknown", sites: null, applied: null, buckets: null };
  if (!base || checkSupabaseUrl(base)) return out;

  const anon = await getJson(fetchImpl, `${base}/auth/v1/settings`, { apikey: anonKey ?? "" }, timeoutMs);
  if (anon.status === 0) return out;
  out.reachable = true;
  out.anonOk = anonKey ? anon.status === 200 : null;
  if (!serviceKey) return out;

  const svc = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const users = await getJson(fetchImpl, `${base}/auth/v1/admin/users?page=1&per_page=1`, svc, timeoutMs);
  out.serviceOk = users.status === 200 ? true : users.status === 401 || users.status === 403 ? false : null;
  if (!out.serviceOk) return out;

  const [sites, migrations, buckets] = await Promise.all([
    getJson(fetchImpl, `${base}/rest/v1/tenants?select=id&limit=2`, svc, timeoutMs),
    getJson(fetchImpl, `${base}/rest/v1/selfhost_migrations?select=name&limit=5000`, svc, timeoutMs),
    getJson(fetchImpl, `${base}/storage/v1/bucket`, svc, timeoutMs),
  ]);
  if (sites.status === 200 && Array.isArray(sites.body)) {
    out.schema = "loaded";
    out.sites = sites.body.length;
  } else if (sites.status === 404 || ["PGRST205", "PGRST202", "42P01"].includes(sites.body?.code)) {
    out.schema = "missing";
  }
  if (migrations.status === 200 && Array.isArray(migrations.body)) out.applied = migrations.body.map((r) => r.name);
  if (buckets.status === 200 && Array.isArray(buckets.body)) out.buckets = buckets.body.map((b) => b.id ?? b.name);
  return out;
}

/**
 * Look at the database directly (needs DATABASE_URL and the pg package).
 * Never throws. `connectDb(url)` returns a connected client with query/end.
 */
export async function probeDatabase({ url, connectDb }) {
  if (!String(url ?? "").trim()) return { configured: false, reachable: false, error: null, state: "unknown", applied: null, sites: null };
  if (checkDatabaseUrl(url)) return { configured: true, reachable: false, error: "format", state: "unknown", applied: null, sites: null };
  let db;
  try {
    db = await connectDb(url);
    const info = await inspect(db);
    return { configured: true, reachable: true, error: null, state: info.state, applied: info.hasMigrationsTable ? info.applied : null, sites: info.sites };
  } catch (e) {
    return { configured: true, reachable: false, error: classifyDbError(e), state: "unknown", applied: null, sites: null };
  } finally {
    await db?.end?.().catch(() => {});
  }
}

/**
 * Everything the checks need to know.
 * @param {object} o
 * @param {Record<string, string|undefined>} o.env            the settings
 * @param {Record<string, string|undefined>|null} [o.built]   public settings the app was built with
 * @param {(url: string) => Promise<any>} [o.connectDb]       opens a pg connection; omit when pg is not available
 * @param {string[]} o.migrationFiles                         migration files shipped with this version
 * @param {string[]} o.expectedBuckets                        storage buckets the schema creates
 * @param {string|null} [o.browserOrigin]                     the address in the browser (web installer only)
 */
export async function collectFacts({ env, built = null, connectDb = null, migrationFiles, expectedBuckets, browserOrigin = null, fetchImpl = fetch }) {
  const settings = settingsFacts(env, built);
  // The app talks to the Supabase project it was built for.
  const url = (built?.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = (built?.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  const [supabase, database] = await Promise.all([
    probeSupabase({ url, anonKey, serviceKey: String(env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(), fetchImpl }),
    connectDb ? probeDatabase({ url: env.DATABASE_URL, connectDb }) : Promise.resolve({ configured: has(env, "DATABASE_URL"), reachable: false, error: has(env, "DATABASE_URL") ? "no_driver" : null, state: "unknown", applied: null, sites: null }),
  ]);
  return { settings, supabase, database, migrationFiles, expectedBuckets, browserOrigin };
}

/** Is there a site already? null = could not find out. */
export function siteExists(facts) {
  if (facts.database.reachable && facts.database.state !== "unknown") return facts.database.state === "ours" ? facts.database.sites > 0 : false;
  if (facts.supabase.schema === "loaded") return (facts.supabase.sites ?? 0) > 0;
  if (facts.supabase.schema === "missing") return false;
  return null;
}

/** What the database holds, from the direct look when we have one, the API otherwise. */
export function schemaState(facts) {
  const { database: d, supabase: s } = facts;
  if (d.reachable && d.state !== "unknown") return { state: d.state, applied: d.applied };
  if (s.schema === "loaded") return { state: "ours", applied: s.applied };
  if (s.schema === "missing") return { state: "empty_or_foreign", applied: null };
  return { state: "unknown", applied: null };
}

/**
 * The list of results. Pure.
 * @returns {{ id: string, status: "ok"|"warn"|"fail"|"skip", code: string, params: Record<string, string|number> }[]}
 */
export function evaluateChecks(facts) {
  const { settings: st, supabase: sb, database: db } = facts;
  const res = [];
  const add = (id, status, code, params = {}) => res.push({ id, status, code, params });
  const schema = schemaState(facts);
  const loaded = schema.state === "ours";

  // 1. Settings present
  if (st.missing.length) add("settings", "fail", "settings_missing", { names: st.missing.join(", ") });
  else add("settings", "ok", "settings_ok");

  // 2. The app was built with the same public settings as the settings file
  if (st.stale.length) add("build", "fail", "build_stale", { names: st.stale.join(", ") });
  else add("build", "ok", "build_ok");

  // 3. Supabase answers, and the public key is accepted
  if (!st.missing.includes("NEXT_PUBLIC_SUPABASE_URL") && st.supabaseUrlProblem) add("supabase", "fail", `supabase_url_${st.supabaseUrlProblem}`);
  else if (st.missing.includes("NEXT_PUBLIC_SUPABASE_URL")) add("supabase", "skip", "needs_settings");
  else if (!sb.reachable) add("supabase", "fail", "supabase_unreachable");
  else if (st.anonKind === "secret") add("supabase", "fail", "anon_key_is_secret");
  else if (sb.anonOk === false) add("supabase", "fail", "anon_key_invalid");
  else add("supabase", "ok", "supabase_ok");

  // 4. The secret key works
  if (st.missing.includes("SUPABASE_SERVICE_ROLE_KEY")) add("service_key", "fail", "service_key_missing");
  else if (st.serviceKind === "publishable") add("service_key", "fail", "service_key_is_public");
  else if (!sb.reachable) add("service_key", "skip", "needs_supabase");
  else if (sb.serviceOk === false) add("service_key", "fail", "service_key_invalid");
  else if (sb.serviceOk === null) add("service_key", "warn", "service_key_unknown");
  else add("service_key", "ok", "service_key_ok");

  // 5. Direct database connection (needed to load the database and for updates)
  if (!db.configured) add("database", loaded ? "warn" : "fail", loaded ? "database_url_missing_later" : "database_url_missing");
  else if (db.error === "no_driver") add("database", "skip", "database_not_checked");
  else if (!db.reachable) {
    const code = db.error === "format" ? `database_url_${st.databaseUrlProblem ?? "not_a_url"}` : `database_${db.error ?? "other"}`;
    add("database", loaded ? "warn" : "fail", code);
  } else if (st.transactionPooler) add("database", "warn", "database_transaction_pooler");
  else add("database", "ok", "database_ok");

  // 6. Tables loaded, and up to date
  if (schema.state === "empty") add("schema", "fail", "schema_empty");
  else if (schema.state === "foreign") add("schema", "fail", "schema_foreign");
  else if (schema.state === "empty_or_foreign") add("schema", "fail", db.configured ? "schema_missing_no_db" : "schema_missing_no_url");
  else if (schema.state === "unknown") add("schema", "skip", "schema_unknown");
  else if (!schema.applied) add("schema", "warn", "schema_version_unknown");
  else {
    const pending = pendingMigrations(facts.migrationFiles, schema.applied);
    if (pending.length) add("schema", "warn", "schema_pending", { count: pending.length });
    else add("schema", "ok", "schema_ok");
  }

  // 7. Storage buckets
  if (!loaded || sb.buckets === null) add("storage", "skip", loaded ? "storage_unknown" : "needs_schema");
  else {
    const missing = facts.expectedBuckets.filter((b) => !sb.buckets.includes(b));
    // "media" holds every uploaded image; the others belong to single features.
    if (missing.includes("media")) add("storage", "fail", "buckets_missing", { names: missing.join(", ") });
    else if (missing.length) add("storage", "warn", "buckets_missing", { names: missing.join(", ") });
    else add("storage", "ok", "storage_ok");
  }

  // 8. Secrets
  if (st.courierKey === "bad") add("secrets", "fail", "courier_key_bad");
  else if (st.courierKey === "missing") add("secrets", "warn", "courier_key_missing");
  else if (st.appSecret === "missing") add("secrets", "warn", "app_secret_missing");
  else if (st.appSecret === "short") add("secrets", "warn", "app_secret_short");
  else add("secrets", "ok", "secrets_ok");

  // 9. Setup code
  if (st.setupToken) add("setup_code", "ok", "setup_token_ok");
  else add("setup_code", "warn", "setup_token_missing");

  // 10. Scheduled jobs
  if (st.cronSecret) add("cron", "ok", "cron_ok");
  else add("cron", "warn", "cron_secret_missing");

  // 11. Outgoing email (optional)
  if (!st.emailKey) add("email", "skip", "email_not_configured");
  else if (!st.emailFrom) add("email", "warn", "email_from_missing");
  else add("email", "ok", "email_ok");

  // 12. The address in the browser is the address the app was built for
  if (!facts.browserOrigin) add("address", "skip", "address_not_checked");
  else if (!st.appUrl) add("address", "skip", "needs_settings");
  else {
    const want = hostOf(st.appUrl);
    const got = hostOf(facts.browserOrigin);
    const params = { expected: st.appUrl.replace(/\/+$/, ""), actual: facts.browserOrigin.replace(/\/+$/, "") };
    if (bare(want) !== bare(got)) add("address", "fail", "address_mismatch", params);
    else if (want !== got) add("address", "warn", "address_www", params);
    else if (new URL(st.appUrl).protocol !== new URL(facts.browserOrigin).protocol) add("address", "warn", "address_scheme", params);
    else add("address", "ok", "address_ok");
  }

  return res.sort((a, b) => CHECK_IDS.indexOf(a.id) - CHECK_IDS.indexOf(b.id));
}

/** Can the install go on? What can the installer fix by itself? */
export function summarize(facts, results) {
  const schema = schemaState(facts);
  const blocking = results.filter((r) => r.status === "fail").map((r) => r.id);
  const canLoadDatabase = facts.database.reachable && facts.database.state === "empty";
  const pending = schema.state === "ours" && schema.applied ? pendingMigrations(facts.migrationFiles, schema.applied).length : 0;
  return {
    ready: blocking.length === 0,
    blocking,
    // Only the empty database stands in the way, and we can load it.
    onlyDatabaseMissing: blocking.length > 0 && blocking.every((id) => id === "schema") && canLoadDatabase,
    canLoadDatabase,
    canUpdateDatabase: facts.database.reachable && facts.database.state === "ours" && pending > 0,
    pendingMigrations: pending,
    siteExists: siteExists(facts),
  };
}

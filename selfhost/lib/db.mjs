/**
 * Database work for a self-hosted install: look at what is there, load
 * selfhost/schema.sql into an empty database, and apply later migrations.
 *
 * Used by selfhost/setup-db.mjs, selfhost/migrate.mjs, the CLI and the web
 * installer (src/app/api/setup/database). The caller passes the `pg` package
 * and the SQL text / folder, so this file has no imports that a bundler
 * could get wrong and the tests can drive it with a fake client.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/** One lock for every installer and migration run on a database. */
const LOCK_KEY = 7246011;

/** Open a connection. Local databases without TLS, everything else with. */
export async function connect(pg, url, { timeoutMs = 15000 } = {}) {
  const local = /localhost|127\.0\.0\.1/.test(url);
  const Client = pg.Client ?? pg.default?.Client;
  const db = new Client({
    connectionString: url,
    ssl: local ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: timeoutMs,
  });
  // A dropped connection must not crash the process.
  db.on?.("error", () => {});
  await db.connect();
  return db;
}

/** Why a connection failed, in a word the installer can explain. */
export function classifyDbError(err) {
  const msg = String(err?.message ?? err ?? "").toLowerCase();
  const code = String(err?.code ?? "");
  if (code === "28P01" || code === "28000" || /password authentication failed|authentication|sasl/.test(msg)) return "auth";
  if (/tenant or user not found/.test(msg)) return "project";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN" || /getaddrinfo|enotfound/.test(msg)) return "host";
  if (code === "ETIMEDOUT" || code === "ECONNREFUSED" || code === "ENETUNREACH" || code === "EHOSTUNREACH" || /timeout|timed out|econnrefused|enetunreach/.test(msg)) return "network";
  if (/invalid url|invalid connection|connection string/.test(msg)) return "format";
  return "other";
}

/**
 * What is in the database.
 *   empty    no tables in the public schema: ready for schema.sql
 *   ours     the Passive Coder tables are there
 *   foreign  other tables are there and ours are not: never touched
 * All names are schema-qualified: the caller may be inside the schema load,
 * where the search path is empty.
 */
export async function inspect(db) {
  const { rows } = await db.query(
    `select
       (select count(*)::int from pg_catalog.pg_tables where schemaname = 'public') as tables,
       pg_catalog.to_regclass('public.tenants') is not null as has_tenants,
       pg_catalog.to_regclass('public.site_settings') is not null as has_settings,
       pg_catalog.to_regclass('public.selfhost_migrations') is not null as has_migrations`,
  );
  const r = rows[0];
  const ours = r.has_tenants && r.has_settings;
  const state = ours ? "ours" : r.tables === 0 ? "empty" : "foreign";
  let applied = [];
  let sites = 0;
  if (ours) {
    if (r.has_migrations) applied = (await db.query(`select name from public.selfhost_migrations`)).rows.map((x) => x.name);
    sites = (await db.query(`select count(*)::int as n from public.tenants`)).rows[0].n;
  }
  return { state, tables: r.tables, hasMigrationsTable: !!r.has_migrations, applied, sites };
}

/**
 * Split SQL text into statements. Knows single-quoted strings, quoted names,
 * dollar-quoted bodies ($$ ... $$, $tag$ ... $tag$) and both comment styles,
 * so a semicolon inside a function body does not end the statement.
 */
export function splitSql(text) {
  const out = [];
  const n = text.length;
  let i = 0;
  let first = -1; // where the statement's own text starts (after comments)
  const code = () => { if (first === -1) first = i; };
  const push = (end) => {
    if (first !== -1) out.push(text.slice(first, end).trim());
    first = -1;
  };
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (c === "-" && d === "-") {
      const nl = text.indexOf("\n", i);
      i = nl === -1 ? n : nl + 1;
    } else if (c === "/" && d === "*") {
      let depth = 1;
      i += 2;
      while (i < n && depth > 0) {
        if (text[i] === "/" && text[i + 1] === "*") { depth++; i += 2; }
        else if (text[i] === "*" && text[i + 1] === "/") { depth--; i += 2; }
        else i++;
      }
    } else if (c === "'" || c === '"') {
      code();
      // E'...' strings take backslash escapes; plain ones only doubled quotes.
      const esc = c === "'" && /[eE]/.test(text[i - 1] ?? "") && !/[A-Za-z0-9_]/.test(text[i - 2] ?? "");
      i++;
      while (i < n) {
        if (esc && text[i] === "\\") i += 2;
        else if (text[i] === c) {
          if (text[i + 1] === c) i += 2;
          else { i++; break; }
        } else i++;
      }
    } else if (c === "$") {
      code();
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(text.slice(i, i + 80));
      // "$1" (a parameter) and "a$b" (part of a name) are not quotes.
      if (m && !/[A-Za-z0-9_]/.test(text[i - 1] ?? "")) {
        const close = text.indexOf(m[0], i + m[0].length);
        i = close === -1 ? n : close + m[0].length;
      } else i++;
    } else if (c === ";") {
      // A lone ";" is not a statement.
      i++;
      push(i);
    } else {
      if (!/\s/.test(c)) code();
      i++;
    }
  }
  push(n);
  return out;
}

/**
 * pg_dump starts a file with session settings ("SET x = y;" and an empty
 * search path). Make them last only for our transaction, so nothing leaks to
 * other users of a pooled connection.
 */
export function transactionLocal(statement) {
  if (/^SET\s+(?!LOCAL\b|SESSION\b|TRANSACTION\b|CONSTRAINTS\b)/i.test(statement)) return statement.replace(/^SET\s+/i, "SET LOCAL ");
  return statement.replace(/^(SELECT\s+pg_catalog\.set_config\([^;]*?),\s*false\s*\)/i, "$1, true)");
}

/** Group statements so one network round trip carries many of them. */
export function chunkStatements(statements, parts = 40) {
  const total = statements.reduce((n, s) => n + s.length, 0);
  const target = Math.max(1, Math.ceil(total / parts));
  const chunks = [];
  let cur = [];
  let size = 0;
  for (const s of statements) {
    cur.push(s);
    size += s.length;
    if (size >= target) { chunks.push(cur); cur = []; size = 0; }
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

export class DatabaseNotEmptyError extends Error {
  constructor(state) {
    super(state === "ours"
      ? "This database already has the Passive Coder tables."
      : "This database already holds other tables. Use a new, empty Supabase project.");
    this.name = "DatabaseNotEmptyError";
    this.state = state;
  }
}

/**
 * Load the whole schema into an EMPTY database, in one transaction: it either
 * all happens or nothing does, so it is safe to run again after a failure.
 * Refuses when the database is not empty (ours: already done; foreign: not
 * ours to touch). `onProgress(done, total)` is called as statements go in.
 */
/**
 * @param {any} db
 * @param {string} sql
 * @param {{ onProgress?: (done: number, total: number) => void, parts?: number }} [opts]
 */
export async function loadSchema(db, sql, opts = {}) {
  const { onProgress = () => {}, parts = 40 } = opts;
  const statements = splitSql(sql.replace(/\r\n/g, "\n")).map(transactionLocal);
  const chunks = chunkStatements(statements, parts);
  let done = 0;
  await db.query("begin");
  try {
    // Two installers started at once: the second waits here, then sees the
    // tables and stops.
    await db.query(`select pg_catalog.pg_advisory_xact_lock(${LOCK_KEY})`);
    const before = await inspect(db);
    if (before.state !== "empty") throw new DatabaseNotEmptyError(before.state);
    onProgress(0, statements.length);
    for (const chunk of chunks) {
      await db.query(chunk.join("\n"));
      done += chunk.length;
      onProgress(done, statements.length);
    }
    await db.query("commit");
  } catch (e) {
    await db.query("rollback").catch(() => {});
    throw e;
  }
  await db.query("notify pgrst, 'reload schema'").catch(() => {});
  const t = await db.query(`select count(*)::int as n from pg_catalog.pg_tables where schemaname = 'public'`);
  return { statements: statements.length, tables: t.rows[0].n };
}

/** Migration files in a folder, oldest first (001_x.sql, 002_y.sql, ...). */
export function listMigrationFiles(dir) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names.filter((f) => /^\d+_.+\.sql$/.test(f)).sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b));
}

/** Files not yet recorded as applied. */
export function pendingMigrations(files, applied) {
  const done = new Set(applied);
  return files.filter((f) => !done.has(f));
}

/**
 * Apply the migrations that came with a new version: every file in `dir` not
 * yet in public.selfhost_migrations, oldest first, each in its own
 * transaction, and record it. Files marked "-- selfhost: skip" (hosted
 * platform only) are recorded without running.
 */
/**
 * @param {any} db
 * @param {string} dir
 * @param {{ dryRun?: boolean, onStep?: (step: { file: string, index: number, total: number, action: string }) => void }} [opts]
 */
export async function runMigrations(db, dir, opts = {}) {
  const { dryRun = false, onStep = () => {} } = opts;
  const files = listMigrationFiles(dir);
  await db.query(`create table if not exists public.selfhost_migrations (name text primary key, applied_at timestamptz not null default now())`);
  const applied = (await db.query(`select name from public.selfhost_migrations`)).rows.map((r) => r.name);
  const todo = pendingMigrations(files, applied);
  const ran = [];
  for (let i = 0; i < todo.length; i++) {
    const f = todo[i];
    const sql = readFileSync(path.join(dir, f), "utf8");
    const skip = /^-- selfhost: skip/m.test(sql);
    onStep({ file: f, index: i, total: todo.length, action: dryRun ? "would-apply" : skip ? "skip" : "apply" });
    if (dryRun) continue;
    await db.query("begin");
    try {
      await db.query(`select pg_catalog.pg_advisory_xact_lock(${LOCK_KEY})`);
      // Another run may have applied it while we waited for the lock.
      const again = await db.query(`select 1 from public.selfhost_migrations where name = $1`, [f]);
      if (!again.rows.length) {
        if (!skip) await db.query(sql);
        await db.query(`insert into public.selfhost_migrations (name) values ($1)`, [f]);
      }
      await db.query("commit");
      ran.push(f);
    } catch (e) {
      await db.query("rollback").catch(() => {});
      throw new Error(`${f}: ${e.message}`);
    }
  }
  if (ran.length) await db.query("notify pgrst, 'reload schema'").catch(() => {});
  return { pending: todo, applied: ran };
}

/** Bucket ids the schema file creates (storage.buckets inserts). */
export function bucketsInSchema(sql) {
  const out = [];
  const re = /insert into storage\.buckets\s*\([^)]*\)\s*values\s*\(\s*'([^']+)'/gi;
  for (const m of sql.matchAll(re)) out.push(m[1]);
  return [...new Set(out)];
}

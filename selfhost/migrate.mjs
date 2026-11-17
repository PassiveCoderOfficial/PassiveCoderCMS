#!/usr/bin/env node
/**
 * Apply database changes that came with a new version of Passive Coder CMS.
 *   node selfhost/migrate.mjs [--dry-run]
 * Runs every file in supabase/migrations that is not yet recorded in
 * public.selfhost_migrations, oldest first, each in its own transaction, and
 * records it. Files marked "-- selfhost: skip" (hosted platform only) are
 * recorded without running. Needs DATABASE_URL; reads .env.local if present.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import pg from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is required"); process.exit(2); }
const dry = process.argv.includes("--dry-run");
const dir = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "supabase", "migrations");
const files = readdirSync(dir).filter((f) => /^\d+_.+\.sql$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b));

const local = /localhost|127\.0\.0\.1/.test(url);
const db = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
await db.connect();
try {
  await db.query(`create table if not exists public.selfhost_migrations (name text primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await db.query(`select name from public.selfhost_migrations`)).rows.map((r) => r.name));
  const todo = files.filter((f) => !done.has(f));
  if (!todo.length) { console.log("database is up to date"); }
  for (const f of todo) {
    const sql = readFileSync(path.join(dir, f), "utf8");
    const skip = /^-- selfhost: skip/m.test(sql);
    console.log(`${dry ? "would apply" : skip ? "skip (hosted only)" : "apply"}: ${f}`);
    if (dry) continue;
    await db.query("begin");
    try {
      if (!skip) await db.query(sql);
      await db.query(`insert into public.selfhost_migrations (name) values ($1)`, [f]);
      await db.query("commit");
    } catch (e) {
      await db.query("rollback");
      throw new Error(`${f}: ${e.message}`);
    }
  }
  if (todo.length && !dry) await db.query("notify pgrst, 'reload schema'");
} catch (e) {
  console.error(`migrate failed: ${e.message}`);
  process.exitCode = 1;
} finally {
  await db.end();
}

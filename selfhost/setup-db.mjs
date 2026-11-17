#!/usr/bin/env node
/**
 * Load the database into a new, empty Supabase project.
 *   node selfhost/setup-db.mjs
 * Needs DATABASE_URL (Supabase: Project Settings > Database > connection
 * string, "Session pooler"). Reads .env.local if present. Refuses to run on a
 * database that already has the tables. After this, start the app and open
 * /setup (or import a site package with selfhost/import-site.mjs).
 */
import { readFileSync, existsSync } from "node:fs";
import pg from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is required"); process.exit(2); }
const local = /localhost|127\.0\.0\.1/.test(url);
const db = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
try {
  await db.connect();
  const { rows } = await db.query(`select to_regclass('public.tenants') is not null as has`);
  if (rows[0].has) throw new Error("This database already has the Passive Coder tables. Use selfhost/migrate.mjs to update it.");
  const sql = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
  await db.query("begin");
  await db.query(sql);
  await db.query("commit");
  await db.query("notify pgrst, 'reload schema'");
  const t = await db.query(`select count(*)::int n from information_schema.tables where table_schema = 'public'`);
  console.log(`database ready: ${t.rows[0].n} tables. Next: start the app and open /setup.`);
} catch (e) {
  await db.query("rollback").catch(() => {});
  console.error(`setup failed: ${e.message}`);
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}

#!/usr/bin/env node
/**
 * Apply database changes that came with a new version of Passive Coder CMS.
 *   node selfhost/migrate.mjs [--dry-run]
 * Runs every file in supabase/migrations that is not yet recorded in
 * public.selfhost_migrations, oldest first, each in its own transaction, and
 * records it. Files marked "-- selfhost: skip" (hosted platform only) are
 * recorded without running. Needs DATABASE_URL; reads .env.local or .env if
 * present.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { connect, runMigrations } from "./lib/db.mjs";

for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is required"); process.exit(2); }
const dryRun = process.argv.includes("--dry-run");
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");

let db;
try {
  db = await connect(pg, url);
  const res = await runMigrations(db, dir, {
    dryRun,
    onStep: ({ file, action }) => console.log(`${action === "would-apply" ? "would apply" : action === "skip" ? "skip (hosted only)" : "apply"}: ${file}`),
  });
  if (!res.pending.length) console.log("database is up to date");
} catch (e) {
  console.error(`migrate failed: ${e.message}`);
  process.exitCode = 1;
} finally {
  await db?.end().catch(() => {});
}

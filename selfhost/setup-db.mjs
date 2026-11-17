#!/usr/bin/env node
/**
 * Load the database into a new, empty Supabase project.
 *   node selfhost/setup-db.mjs [--if-empty]
 * Needs DATABASE_URL (Supabase: Connect > "Session pooler" connection
 * string). Reads .env.local or .env if present. Refuses to run on a database
 * that already has tables; with --if-empty, a database that already has the
 * Passive Coder tables is fine and nothing is done. All in one transaction,
 * so it is safe to run again after a failure.
 *
 * The web installer (/setup) and `node selfhost/cli/index.mjs init` do the
 * same thing through selfhost/lib/db.mjs.
 */
import { readFileSync, existsSync } from "node:fs";
import pg from "pg";
import { connect, loadSchema, inspect, DatabaseNotEmptyError } from "./lib/db.mjs";

for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is required"); process.exit(2); }
const ifEmpty = process.argv.includes("--if-empty");

let db;
try {
  db = await connect(pg, url);
  if (ifEmpty && (await inspect(db)).state === "ours") {
    console.log("database already set up: nothing to do.");
  } else {
    const sql = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
    let last = -1;
    const res = await loadSchema(db, sql, {
      onProgress: (done, total) => {
        const pct = Math.floor((done / total) * 10) * 10;
        if (pct !== last) { last = pct; process.stdout.write(`  ${pct}%\n`); }
      },
    });
    console.log(`database ready: ${res.tables} tables. Next: start the app and open /setup.`);
  }
} catch (e) {
  console.error(e instanceof DatabaseNotEmptyError && e.state === "ours"
    ? "setup failed: this database already has the Passive Coder tables. Use selfhost/migrate.mjs to update it."
    : `setup failed: ${e.message}`);
  process.exitCode = 1;
} finally {
  await db?.end().catch(() => {});
}

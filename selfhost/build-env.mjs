#!/usr/bin/env node
/**
 * Docker build helper: print a settings file (KEY=value lines) as shell
 * `export` lines, so the Dockerfile can load it with
 *   eval "$(node selfhost/build-env.mjs /run/secrets/build_env)"
 * Values already set in the environment win. Not done with node --env-file:
 * Next.js passes node flags on to its build workers, and Node refuses
 * --env-file* there.
 */
import { readFileSync, existsSync } from "node:fs";
import { parseEnv } from "node:util";

const file = process.argv[2];
if (!file || !existsSync(file)) process.exit(0);
const vars = parseEnv(readFileSync(file, "utf8"));
const quote = (v) => `'${String(v).replace(/'/g, `'\\''`)}'`;
for (const [key, value] of Object.entries(vars)) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key]) continue;
  console.log(`export ${key}=${quote(value)}`);
}

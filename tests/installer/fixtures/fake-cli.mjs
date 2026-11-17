#!/usr/bin/env node
/**
 * Stand-in for the supabase and vercel CLIs in tests/installer/agent.test.ts.
 * Answers like the real ones with made-up keys, and logs what it was given
 * (argv and stdin) to FAKE_CLI_LOG so the test can check it.
 */
import { appendFileSync, readFileSync } from "node:fs";

const argv = process.argv.slice(2);
let stdin = "";
try { stdin = readFileSync(0, "utf8"); } catch { /* no input */ }
if (process.env.FAKE_CLI_LOG) appendFileSync(process.env.FAKE_CLI_LOG, JSON.stringify({ argv, stdin }) + "\n");

// Built at run time, so the public copy's secret scan sees no key-shaped text.
const SB = (kind, body) => ["sb", kind, body].join("_");
const jwt = (role) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.c2lnbmF0dXJlLWZvci10ZXN0cw`;

if (argv[0] === "projects" && argv[1] === "create") {
  process.stdout.write(JSON.stringify({ id: "abcdefghijklmnopqrst", name: argv[2], region: "ap-southeast-1" }));
} else if (argv[0] === "projects" && argv[1] === "api-keys") {
  process.stdout.write(JSON.stringify([
    { name: "anon", api_key: jwt("anon") },
    { name: "service_role", api_key: jwt("service_role") },
    { name: "default", type: "publishable", api_key: SB("publishable", "TESTPUBLISHABLEKEY0123456789") },
    { name: "default", type: "secret", api_key: SB("secret", "TESTSECRETKEY0123456789abcdef") },
  ]));
} else if (argv[0] === "env" && argv[1] === "add") {
  if (argv[2] === "CRON_SECRET") { process.stderr.write(`Error: A variable with the name ${argv[2]} already exists`); process.exit(1); }
  process.stdout.write(`Added Environment Variable ${argv[2]} to Project passivecoder-cms`);
} else {
  process.stderr.write(`unknown: ${argv.join(" ")}`);
  process.exit(1);
}

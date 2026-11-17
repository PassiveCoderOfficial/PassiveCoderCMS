/**
 * Install with AI: the pieces AI agents and the web installer's AI buttons use.
 *   doctor --json / --redact     selfhost/lib/agent-help.mjs buildDoctorReport
 *   "Ask your AI to fix this"   fixPrompt
 *   "Explain this"              explainItems (what may go to Passive Coder AI)
 *   settings-file helpers       selfhost/lib/agent-env.mjs
 *   CLI agent commands          selfhost/cli/agent.mjs, run against a fake supabase / vercel CLI
 * Run: npm run test:installer
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { evaluateChecks, summarize, CHECK_IDS } from "../../selfhost/lib/checks.mjs";
import { CHECK_MESSAGES } from "../../selfhost/lib/check-messages.mjs";
import * as help from "../../selfhost/lib/agent-help.mjs";
import * as agentEnv from "../../selfhost/lib/agent-env.mjs";
import { parseEnv } from "../../selfhost/lib/env.mjs";

// Key-shaped test values are built at run time (the public copy's secret scan).
const SB = (kind: string, body: string) => ["sb", kind, body].join("_");
const SECRET = SB("secret", "VERYSECRETVALUE0123456789abcdef");
const PUBLISHABLE = SB("publishable", "PUBLICVALUE0123456789abcdefgh");
const DB_PASSWORD = "hunter2-db-password-xyz";
const REF = "abcdefghijklmnopqrst";
const SUPA_HOST = `${REF}.supabase.co`;
const DB_URL = `postgresql://postgres.abcdefghijklmnopqrst:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;
const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: `https://${SUPA_HOST}`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: PUBLISHABLE,
  SUPABASE_SERVICE_ROLE_KEY: SECRET,
  DATABASE_URL: DB_URL,
  SETUP_TOKEN: "setup-token-0123456789abcdef",
  CRON_SECRET: "cron-secret-0123456789abcdef",
  NEXT_PUBLIC_APP_URL: "https://www.shop-example.com",
};

/** Facts for a broken install: database refuses the password, address mismatch, no cron secret. */
function brokenFacts() {
  return {
    settings: {
      missing: [], stale: [], supabaseUrlProblem: null, anonKind: "publishable", serviceKind: "secret",
      databaseUrlProblem: null, transactionPooler: false, appSecret: "ok", courierKey: "ok", setupToken: true,
      cronSecret: false, emailKey: false, emailFrom: false, appUrl: ENV.NEXT_PUBLIC_APP_URL, rootDomain: "www.shop-example.com",
    },
    supabase: { reachable: true, anonOk: true, serviceOk: true, schema: "missing", sites: null, applied: null, buckets: null },
    database: { configured: true, reachable: false, error: "auth", state: "unknown", applied: null, sites: null },
    migrationFiles: [], expectedBuckets: ["media"], browserOrigin: "https://other-host.example.org",
  };
}

const noSecrets = (text: string) => {
  for (const v of [SECRET, PUBLISHABLE, DB_PASSWORD, ENV.SETUP_TOKEN, ENV.CRON_SECRET]) assert.ok(!text.includes(v), `leaked ${v.slice(0, 8)}...`);
};

test("every problem code has a fix for agents; ok codes have none", () => {
  for (const code of Object.keys(CHECK_MESSAGES)) {
    if (/_ok$/.test(code)) continue;
    assert.ok(help.CHECK_FIXES[code], `CHECK_FIXES.${code}`);
  }
  for (const code of Object.keys(help.CHECK_FIXES)) assert.ok(CHECK_MESSAGES[code], `fix for unknown code ${code}`);
  // Platform parts are filled in.
  assert.match(help.fixFor("cron_secret_missing", {}, "vercel")!, /vercel deploy --prod/);
  assert.match(help.fixFor("email_from_missing", {}, "docker")!, /\/opt\/passivecoder\/\.env/);
  assert.match(help.fixFor("cron_secret_missing", {}, "node")!, /env-slots/);
  assert.match(help.fixFor("cron_secret_missing", {}, "docker")!, /install\.sh --yes/);
  assert.equal(help.fixFor("schema_ok"), null);
});

test("doctor --json: id, status, message, fix and docs link per check, no secret values", () => {
  const facts = brokenFacts();
  const results = evaluateChecks(facts);
  // A param that somehow carried a secret is scrubbed too.
  results.push({ id: "settings", status: "fail", code: "settings_missing", params: { names: `X ${SECRET} ${DB_URL}` } });
  const report = help.buildDoctorReport({ results, summary: summarize(facts, results), env: ENV, meta: { version: "1.2.3", node: "22.1.0", nodeOk: true, platform: "node" } });
  assert.equal(report.schema, "passivecoder-doctor/1");
  assert.equal(report.ready, false);
  assert.ok(report.blocking.includes("database"));
  assert.equal(report.checks[0].id, "node");
  for (const c of report.checks) {
    for (const k of ["id", "title", "status", "code", "message", "fix", "docs"]) assert.ok(k in c, `${c.id}.${k}`);
    assert.match(c.docs, /AI-INSTALL\.md#fix-/);
    if (c.status === "ok") assert.equal(c.fix, null);
    else if (c.status !== "skip") assert.ok(c.fix, `fix for ${c.id}`);
  }
  for (const id of CHECK_IDS) assert.ok(report.checks.some((c: { id: string }) => c.id === id), id);
  const text = JSON.stringify(report);
  noSecrets(text);
  // Not redacted: addresses stay (they help a local agent).
  assert.ok(text.includes("www.shop-example.com"));
});

test("doctor --redact hides addresses, hosts, refs and emails but keeps the docs links", () => {
  const facts = brokenFacts();
  const results = evaluateChecks(facts);
  results.push({ id: "email", status: "warn", code: "email_from_missing", params: { names: "owner@shop-example.com" } });
  const report = help.buildDoctorReport({ results, summary: summarize(facts, results), env: ENV, redact: true, meta: { node: "22.1.0", nodeOk: true } });
  const text = JSON.stringify(report);
  noSecrets(text);
  assert.ok(!text.includes("shop-example.com"), "site host");
  assert.ok(!text.includes("other-host.example.org"), "browser host");
  assert.ok(!text.includes("abcdefghijklmnopqrst"), "project ref");
  assert.ok(text.includes("https://github.com/PassiveCoderOfficial/PassiveCoderCMS/blob/main/selfhost/AI-INSTALL.md#fix-database"));
  assert.equal(help.redactPublic("see https://www.shop-example.com/setup and 203.0.113.9"), "see [address] and [ip]");
});

test("scrubSecrets removes known values, key shapes and database passwords", () => {
  const s = help.scrubSecrets(`a ${SECRET} b ${DB_URL} c custom-value-123456`, ["custom-value-123456"]);
  noSecrets(s);
  assert.ok(!s.includes("custom-value-123456"));
  assert.ok(s.includes("postgresql://postgres.abcdefghijklmnopqrst:[redacted]@"));
});

test("Ask your AI to fix this: the prompt has the check id, problem, fix and runbook, never a secret", () => {
  const facts = brokenFacts();
  const failed = evaluateChecks(facts).filter((r) => r.status === "fail");
  assert.ok(failed.length >= 2);
  for (const r of failed) {
    for (const platform of ["node", "docker", "vercel"]) {
      const p = help.fixPrompt({ ...r, platform, version: "1.0.0" });
      assert.ok(p.includes(`check id: ${r.id}`), "id");
      assert.ok(p.includes(`code: ${r.code}`), "code");
      assert.ok(p.includes("Problem: "), "problem");
      assert.ok(p.includes("Fix steps: "), "fix");
      assert.ok(p.includes("selfhost/AI-INSTALL.md") && p.includes(`#fix-${r.id}`), "runbook");
      assert.match(p, /never ask me to paste keys/);
      noSecrets(p);
    }
  }
  // Even a param holding a secret does not get through.
  noSecrets(help.fixPrompt({ id: "settings", code: "settings_missing", params: { names: SECRET } }));
});

test("Explain this: only known ids and English messages; addresses and odd params are hidden", () => {
  const items = help.explainItems([
    { id: "address", code: "address_mismatch", params: { expected: "https://www.shop-example.com", actual: "https://x.example.org" } },
    { id: "settings", code: "settings_missing", params: { names: "NEXT_PUBLIC_SUPABASE_URL, DATABASE_URL" } },
    { id: "settings", code: "settings_missing", params: { names: SECRET } },
    { id: "database", code: "made_up_code" },
    { id: "../../etc", code: "settings_missing" },
    "junk",
  ]);
  assert.equal(items.length, 3);
  const text = JSON.stringify(items);
  assert.ok(!text.includes("shop-example.com") && !text.includes("x.example.org"));
  assert.ok(text.includes("NEXT_PUBLIC_SUPABASE_URL, DATABASE_URL"));
  noSecrets(text);
  assert.deepEqual(help.explainItems("nope"), []);
  assert.equal(help.explainItems(Array.from({ length: 50 }, () => ({ id: "cron", code: "cron_secret_missing" }))).length, 20);
});

test("settings-file helpers: slots, secrets, Supabase keys, pooler strings", () => {
  const first = agentEnv.ensureSlots("", { address: "localhost:3000" });
  const env = parseEnv(first.text);
  assert.equal(env.NEXT_PUBLIC_CMS_MODE, "standalone");
  assert.equal(env.NEXT_PUBLIC_APP_URL, "http://localhost:3000");
  assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, "");
  assert.deepEqual(first.made.sort(), ["APP_SECRET", "COURIER_SECRET_KEY", "CRON_SECRET", "SETUP_TOKEN"]);
  // Second run keeps every value and adds nothing.
  const second = agentEnv.ensureSlots(first.text);
  assert.deepEqual(second.made, []);
  assert.deepEqual(second.added, []);
  assert.equal(parseEnv(second.text).APP_SECRET, env.APP_SECRET);
  // A pasted value survives.
  const pasted = first.text.replace("SUPABASE_SERVICE_ROLE_KEY=", `SUPABASE_SERVICE_ROLE_KEY=${SECRET}`);
  assert.equal(parseEnv(agentEnv.ensureSlots(pasted).text).SUPABASE_SERVICE_ROLE_KEY, SECRET);
  assert.deepEqual(agentEnv.slotStatus(parseEnv(pasted)).find((s) => s.name === "SUPABASE_SERVICE_ROLE_KEY")?.state, "set");

  const keys = agentEnv.parseApiKeys(JSON.stringify([
    { name: "anon", api_key: "eyJhbGciOiJIUzI1NiJ9." + Buffer.from('{"role":"anon"}').toString("base64url") + ".c2ln" },
    { type: "publishable", api_key: PUBLISHABLE },
    { type: "secret", api_key: SB("secret", "abc····") },
    { name: "service_role", api_key: "eyJhbGciOiJIUzI1NiJ9." + Buffer.from('{"role":"service_role"}').toString("base64url") + ".c2lnbmF0dXJl" },
  ]));
  assert.equal(keys.anon, PUBLISHABLE, "new-style publishable preferred");
  assert.match(String(keys.service), /^eyJ/, "masked secret skipped, legacy service_role used");
  assert.deepEqual(agentEnv.parseApiKeys("not json"), { anon: null, service: null });

  assert.equal(agentEnv.parseProjectRef('{"id":"abcdefghijklmnopqrst"}'), "abcdefghijklmnopqrst");
  assert.equal(agentEnv.parseProjectRef('{"id":"short"}'), null);
  const urls = agentEnv.poolerCandidates("abcdefghijklmnopqrst", "ap-southeast-1", "p@ss");
  assert.equal(urls.length, 2);
  const u = new URL(urls[0]);
  assert.deepEqual([u.protocol, u.username, u.password, u.host], ["postgresql:", `postgres.${REF}`, "p%40ss", "aws-0-ap-southeast-1.pooler.supabase.com:5432"]);
  assert.deepEqual(agentEnv.poolerCandidates("abcdefghijklmnopqrst", "bad region", "x"), []);
});

/* ── The CLI commands, against a fake supabase / vercel CLI ─────────────── */

const CLI = path.resolve("selfhost/cli/index.mjs");
const FAKE = path.resolve("tests/installer/fixtures/fake-cli.mjs");

function cli(dir: string, args: string[], extraEnv: Record<string, string> = {}) {
  const res = spawnSync(process.execPath, [CLI, ...args, "--settings-file", path.join(dir, ".env.test")], {
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", PC_SUPABASE_CMD: JSON.stringify([process.execPath, FAKE]), PC_VERCEL_CMD: JSON.stringify([process.execPath, FAKE]), FAKE_CLI_LOG: path.join(dir, "log.jsonl"), ...extraEnv },
  });
  return { status: res.status, out: `${res.stdout}\n${res.stderr}` };
}

test("CLI: env-slots, supabase-create, supabase-keys, vercel-env never print a value", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "pc-agent-"));
  try {
    const file = path.join(dir, ".env.test");
    const read = () => parseEnv(readFileSync(file, "utf8"));
    const log = () => readFileSync(path.join(dir, "log.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));

    let r = cli(dir, ["env-slots"]);
    assert.equal(r.status, 0, r.out);
    const made = read();
    assert.ok(made.SETUP_TOKEN && made.CRON_SECRET && made.APP_SECRET && made.COURIER_SECRET_KEY);
    assert.match(r.out, /NEXT_PUBLIC_SUPABASE_URL: EMPTY/);
    for (const k of ["SETUP_TOKEN", "CRON_SECRET", "APP_SECRET", "COURIER_SECRET_KEY"]) assert.ok(!r.out.includes(made[k]), k);

    r = cli(dir, ["env-status", "--json"]);
    assert.equal(r.status, 1, "required settings still empty");
    assert.ok(JSON.parse(r.out.trim()).settings.some((s: { name: string; state: string }) => s.name === "SUPABASE_SERVICE_ROLE_KEY" && s.state === "empty"));

    // No --confirm: nothing happens, exit 3.
    r = cli(dir, ["supabase-create", "--org-id", "org123", "--region", "ap-southeast-1"]);
    assert.equal(r.status, 3, r.out);
    assert.match(r.out, /--confirm/);
    assert.ok(!read().SUPABASE_PROJECT_REF);

    r = cli(dir, ["supabase-create", "--org-id", "org123", "--region", "ap-southeast-1", "--confirm"]);
    assert.equal(r.status, 0, r.out);
    const afterCreate = read();
    assert.equal(afterCreate.SUPABASE_PROJECT_REF, "abcdefghijklmnopqrst");
    assert.match(afterCreate.SUPABASE_DB_PASSWORD, /^[0-9a-f]{48}$/);
    assert.ok(!r.out.includes(afterCreate.SUPABASE_DB_PASSWORD), "db password printed");
    const create = log().find((e) => e.argv[1] === "create");
    assert.ok(create.argv.includes(afterCreate.SUPABASE_DB_PASSWORD), "password passed to the CLI");

    // A second create is refused (one project per install).
    r = cli(dir, ["supabase-create", "--org-id", "org123", "--region", "ap-southeast-1", "--confirm"]);
    assert.equal(r.status, 2);

    r = cli(dir, ["supabase-keys", "--region", "ap-southeast-1", "--wait", "0"], { PC_SKIP_DB_VERIFY: "1" });
    const keys = read();
    assert.equal(keys.NEXT_PUBLIC_SUPABASE_URL, `https://${SUPA_HOST}`);
    assert.ok(keys.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith("sb_publishable_"));
    assert.ok(keys.SUPABASE_SERVICE_ROLE_KEY.startsWith("sb_secret_"));
    assert.ok(keys.DATABASE_URL.includes("pooler.supabase.com:5432"));
    for (const v of [keys.NEXT_PUBLIC_SUPABASE_ANON_KEY, keys.SUPABASE_SERVICE_ROLE_KEY, keys.SUPABASE_DB_PASSWORD]) assert.ok(!r.out.includes(v), "key printed");

    r = cli(dir, ["vercel-env"]);
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /CRON_SECRET: already in Vercel/);
    const adds = log().filter((e) => e.argv[0] === "env");
    const svc = adds.find((e) => e.argv[2] === "SUPABASE_SERVICE_ROLE_KEY");
    assert.equal(svc.stdin, keys.SUPABASE_SERVICE_ROLE_KEY, "value goes through stdin");
    assert.ok(!svc.argv.includes(keys.SUPABASE_SERVICE_ROLE_KEY), "never on the command line");
    assert.ok(!adds.some((e) => e.argv[2] === "NEXT_PUBLIC_APP_URL"), "Vercel takes the address from its own domain");
    for (const v of Object.values(keys)) if (v.length >= 12 && v !== "standalone") assert.ok(!r.out.includes(v), "value printed");

    r = cli(dir, ["open-setup", "--url", "https://site.example.com"], { CI: "1" });
    assert.equal(r.status, 0);
    assert.ok(!r.out.includes(keys.SETUP_TOKEN), "setup code printed");

    // doctor --redact on this file: valid JSON with no values (the network checks just fail).
    writeFileSync(file, readFileSync(file, "utf8")
      .replace(/NEXT_PUBLIC_SUPABASE_URL=.*/, "NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9")
      .replace(/DATABASE_URL=.*/, `DATABASE_URL=postgresql://postgres:${keys.SUPABASE_DB_PASSWORD}@127.0.0.1:9/postgres`));
    r = cli(dir, ["doctor", "--redact"]);
    const report = JSON.parse(r.out.slice(r.out.indexOf("{"), r.out.lastIndexOf("}") + 1));
    assert.equal(report.schema, "passivecoder-doctor/1");
    for (const v of Object.values(read())) if (v.length >= 12 && !/^(standalone|http)/.test(v)) assert.ok(!r.out.includes(v), "value in doctor output");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

#!/usr/bin/env node
/**
 * Passive Coder CMS, self-hosted: the command-line installer.
 *
 *   node selfhost/cli/index.mjs init      set up a new install (asks a few questions)
 *   node selfhost/cli/index.mjs doctor    check an install and say how to fix what is wrong
 *   node selfhost/cli/index.mjs start     build if needed, then run the site
 *   node selfhost/cli/index.mjs update    get the new version and update the database
 *
 * Needs Node.js 20.12 or newer. No packages of its own: it uses the app's
 * (the `pg` database driver, installed by `npm ci`).
 *
 * Run outside a copy of the code (for example later through
 * `npx create-passivecoder my-site`) it first downloads the code into the
 * folder you name, then carries on inside it.
 */
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { c, say, step, ok, warn, bad, note, wrap, createPrompter, progressBar, parseArgs } from "./ui.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const REPO = process.env.PC_REPO || "https://github.com/PassiveCoderOfficial/PassiveCoderCMS.git";
const isWin = process.platform === "win32";
const inCheckout = existsSync(path.join(root, "selfhost", "lib", "env.mjs")) && existsSync(path.join(root, "package.json"));

const args = parseArgs(process.argv.slice(2));
// No command: help inside a copy of the code, a new install outside one.
const command = args._[0] ?? (inCheckout ? "help" : "init");
const assumeYes = !!args.yes || !!args.y;
// The setup code is not printed for AI agents (their output lands in a chat):
// with --hide-code, or when the output is not a terminal.
const hideCode = !!args["hide-code"] || !process.stdout.isTTY;

const HELP = `
${c.bold("Passive Coder CMS: self-hosted installer")}

  init      Set up a new install: asks for your Supabase details and site
            address, checks them, writes .env.local, makes the secret keys,
            loads the database, and can start the site for you.
  doctor    Check an install. Says what is wrong and how to fix it.
  start     Build the app if needed, then run it. --detach: run it in the
            background and return once it answers (log: selfhost/site.log).
  update    Get the new version, update the database, rebuild.

For AI agents (selfhost/AI-INSTALL.md); none of these prints a secret:
  doctor --json      the checks as JSON: id, status, message, fix, docs
  doctor --redact    the same, with addresses and hosts hidden (for an issue)
  env-slots          empty slots + missing secrets in .env.local [--address]
  env-status         which settings are set or empty [--json]
  supabase-create    --org-id <id> --region <region> [--name] --confirm
  supabase-keys      [--ref <ref>] [--region <region>] writes URL, keys, DATABASE_URL
  vercel-env         copy the settings to the linked Vercel project [--replace]
  open-setup         open /setup with the setup code [--url https://site]

Options for init (all optional; anything missing is asked):
  --supabase-url <url>      Project URL (https://xxxx.supabase.co)
  --anon-key <key>          publishable key (sb_publishable_...)
  --service-key <key>       secret key (sb_secret_...)
  --database-url <string>   "Session pooler" connection string
  --address <address>       where the site will live (default http://localhost:3000)
  --yes                     do not ask; use the options, the environment and defaults
  --no-start                do not build and start at the end
  --hide-code               do not print the setup code (default when the
                            output is not a terminal, e.g. an AI agent)
  --settings-file <path>    settings file to use (default .env.local)

The same values can come from the environment: NEXT_PUBLIC_SUPABASE_URL,
NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL,
NEXT_PUBLIC_APP_URL.
`;

function fail(message, code = 1) {
  say(`\n${c.red("Stopped:")} ${wrap(message, 9)}`);
  process.exit(code);
}

function run(cmd, cmdArgs, opts = {}) {
  // npm and npx are .cmd files on Windows and need a shell there.
  const res = spawnSync(cmd, cmdArgs, { stdio: "inherit", cwd: root, shell: isWin && /^(npm|npx|git)$/.test(cmd), ...opts });
  return res.status === 0;
}

function nodeVersionOk() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  return major > 20 || (major === 20 && minor >= 12);
}

/* ── Run from outside a copy of the code: download it first ───────────── */
async function bootstrap() {
  const target = path.resolve(process.cwd(), String(args._[1] && command === "init" ? args._[1] : args._[0] && !["init", "help"].includes(command) ? args._[0] : "passivecoder-cms"));
  step("Getting Passive Coder CMS");
  if (existsSync(path.join(target, "selfhost", "cli", "index.mjs"))) {
    note(`Using the copy in ${target}`);
  } else {
    if (spawnSync("git", ["--version"], { stdio: "ignore", shell: isWin }).status !== 0) fail("git is needed to download the code. Install git (https://git-scm.com), then run this again.");
    if (!run("git", ["clone", "--depth", "1", REPO, target], { cwd: process.cwd() })) fail(`Could not download the code from ${REPO}.`);
  }
  const rest = process.argv.slice(2).filter((a) => a !== args._[0] && a !== args._[1]);
  const res = spawnSync(process.execPath, [path.join(target, "selfhost", "cli", "index.mjs"), "init", ...rest], { stdio: "inherit" });
  process.exit(res.status ?? 1);
}

/* ── Shared pieces ─────────────────────────────────────────────────────── */
const lib = (name) => import(pathToFileURL(path.join(root, "selfhost", "lib", name)).href);

function envFilePath() {
  // --settings-file: Node itself grabs "--env-file" even after the script name.
  const given = [args["settings-file"], args["env-file"]].find((v) => typeof v === "string");
  return path.resolve(root, given ?? ".env.local");
}

/** Settings from the file(s), with the real environment on top. */
async function readSettings() {
  const { parseEnv } = await lib("env.mjs");
  const out = {};
  for (const f of [path.join(root, ".env"), envFilePath()]) {
    if (existsSync(f)) Object.assign(out, parseEnv(readFileSync(f, "utf8")));
  }
  for (const [k, v] of Object.entries(process.env)) if (v && /^(NEXT_PUBLIC_|SUPABASE_|DATABASE_URL$|APP_SECRET$|CRON_SECRET$|COURIER_SECRET_KEY$|SETUP_TOKEN$|RESEND_API_KEY$|SMTP_|EMAIL_FROM)/.test(k)) out[k] = v;
  return out;
}

/** The pg driver, or null when the app's packages are not installed yet. */
async function loadPg() {
  try {
    return (await import("pg")).default;
  } catch {
    return null;
  }
}

async function ensurePackages(prompt) {
  if (existsSync(path.join(root, "node_modules", "next", "package.json")) && (await loadPg())) return true;
  step("Installing the app's packages");
  note("This runs `npm ci` and takes a few minutes the first time.");
  if (!assumeYes && prompt && !(await prompt.confirm("Install them now?", true))) return false;
  if (!run("npm", ["ci", "--no-audit", "--no-fund"])) fail("`npm ci` did not finish. Read the messages above, fix what they say, and run this again.");
  return true;
}

const stampFile = () => path.join(root, ".next", "passivecoder-build.txt");

/** Does the app need building (never built, or public settings changed)? */
async function buildNeeded(settings) {
  const { publicSettingsStamp } = await lib("env.mjs");
  if (!existsSync(path.join(root, ".next", "BUILD_ID")) || !existsSync(stampFile())) return true;
  const version = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
  return readFileSync(stampFile(), "utf8") !== `${version}\n${publicSettingsStamp(settings)}`;
}

async function build(settings) {
  const { publicSettingsStamp } = await lib("env.mjs");
  step("Building the app");
  const gb = os.totalmem() / 1024 ** 3;
  note(`This takes 10 to 20 minutes. This machine has ${gb.toFixed(1)} GB of memory${gb < 6 ? "; the build needs about 6 GB, so it may be slow or stop" : ""}.`);
  const heap = Math.max(2048, Math.min(6144, Math.floor((gb * 1024 * 0.7) / 512) * 512));
  const env = { ...process.env, ...settings, NEXT_PUBLIC_CMS_MODE: "standalone", NEXT_TELEMETRY_DISABLED: "1" };
  const res = spawnSync(process.execPath, [`--max-old-space-size=${heap}`, path.join(root, "node_modules", "next", "dist", "bin", "next"), "build", "--webpack"], { stdio: "inherit", cwd: root, env });
  if (res.status !== 0) fail("The build did not finish. If it says \"heap out of memory\" or \"Killed\", the machine needs more memory (about 6 GB free). Otherwise read the messages above.");
  const version = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
  mkdirSync(path.dirname(stampFile()), { recursive: true });
  writeFileSync(stampFile(), `${version}\n${publicSettingsStamp(settings)}`);
  ok("App built.");
}

function openBrowser(url) {
  if (process.env.SSH_CONNECTION || process.env.CI) return false;
  try {
    const child = isWin ? spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true })
      : spawn(process.platform === "darwin" ? "open" : "xdg-open", [url], { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function portOf(settings) {
  if (args.port) return Number(args.port);
  try {
    const u = new URL(settings.NEXT_PUBLIC_APP_URL);
    if (/^(localhost|127\.0\.0\.1)$/.test(u.hostname) && u.port) return Number(u.port);
  } catch { /* default below */ }
  return Number(process.env.PORT) || 3000;
}

async function printResults(results) {
  const { CHECK_TITLES, checkText } = await lib("check-messages.mjs");
  for (const r of results) {
    const line = `${c.bold(CHECK_TITLES[r.id] ?? r.id)}: ${checkText(r.code, r.params)}`;
    if (r.status === "ok") ok(wrap(line));
    else if (r.status === "warn") warn(wrap(line));
    else if (r.status === "fail") bad(wrap(line));
    else note(`later  ${wrap(line)}`);
  }
}

async function gather(settings) {
  const { collectFacts, evaluateChecks, summarize } = await lib("checks.mjs");
  const db = await lib("db.mjs");
  const pg = await loadPg();
  let built = null;
  if (existsSync(stampFile())) {
    const { parseEnv } = await lib("env.mjs");
    built = parseEnv(readFileSync(stampFile(), "utf8"));
  }
  let buckets = ["media"];
  try { buckets = db.bucketsInSchema(readFileSync(path.join(root, "selfhost", "schema.sql"), "utf8")); } catch { /* keep the default */ }
  const facts = await collectFacts({
    env: settings,
    built,
    connectDb: pg ? (url) => db.connect(pg, url, { timeoutMs: 10000 }) : null,
    migrationFiles: db.listMigrationFiles(path.join(root, "supabase", "migrations")),
    expectedBuckets: buckets,
    browserOrigin: null,
  });
  const results = evaluateChecks(facts);
  return { facts, results, summary: summarize(facts, results) };
}

/* ── doctor ────────────────────────────────────────────────────────────── */
async function doctor() {
  const settings = await readSettings();
  if (!args.json) {
    step("Checking this install");
    if (!nodeVersionOk()) bad(`Node.js ${process.versions.node} is too old. Use Node.js 20.12 or newer (22 is best).`);
    else ok(`${c.bold("Node.js")}: ${process.versions.node}`);
  }
  const { results, summary } = await gather(settings);
  if (args.json || args.redact) {
    // Machine-readable, for AI agents and issue reports. Never holds a
    // setting's value; --redact also hides addresses, hosts and emails.
    const { buildDoctorReport } = await lib("agent-help.mjs");
    const report = buildDoctorReport({
      results,
      summary,
      env: settings,
      redact: !!args.redact,
      meta: {
        version: JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version,
        node: process.versions.node,
        nodeOk: nodeVersionOk(),
        os: `${process.platform} ${os.release()} ${process.arch}`,
        platform: args.platform ?? (existsSync("/.dockerenv") || process.env.PC_INSTALL_KIND === "docker" ? "docker" : "node"),
      },
    });
    say(JSON.stringify(report, null, 2));
    process.exitCode = report.ready || report.onlyDatabaseMissing ? 0 : 1;
    return;
  } else {
    await printResults(results);
    say();
    if (summary.ready) say(c.green(summary.siteExists ? "All good. The site is set up." : "All good. Open /setup in your browser to finish."));
    else if (summary.onlyDatabaseMissing) say(c.yellow("Only the database is missing. Run `node selfhost/cli/index.mjs init` (or open /setup) to load it."));
    else say(c.red(`${summary.blocking.length} thing(s) to fix. Change the settings in ${path.relative(root, envFilePath()) || ".env.local"}, then run doctor again.`));
  }
  process.exitCode = summary.ready || summary.onlyDatabaseMissing ? 0 : 1;
}

/* ── database ──────────────────────────────────────────────────────────── */
async function setUpDatabase(url) {
  const db = await lib("db.mjs");
  const pg = await loadPg();
  if (!pg) fail("The database driver is not installed. Run `npm ci` in the code folder first.");
  let client;
  try {
    client = await db.connect(pg, url);
  } catch (e) {
    const { checkText } = await lib("check-messages.mjs");
    fail(checkText(`database_${db.classifyDbError(e)}`));
  }
  try {
    const info = await db.inspect(client);
    if (info.state === "foreign") fail("This database already holds other tables. Passive Coder CMS needs its own, new Supabase project. Nothing was changed.");
    if (info.state === "empty") {
      const sql = readFileSync(path.join(root, "selfhost", "schema.sql"), "utf8");
      const res = await db.loadSchema(client, sql, { onProgress: progressBar("Creating tables") });
      ok(`Database ready: ${res.tables} tables.`);
    } else {
      note(`The database already has the tables${info.sites ? ` and ${info.sites} site` : ""}.`);
    }
    const res = await db.runMigrations(client, path.join(root, "supabase", "migrations"), { onStep: ({ file, action }) => note(`${action === "skip" ? "skip (hosted only)" : "apply"}: ${file}`) });
    if (res.applied.length) ok(`${res.applied.length} database update(s) applied.`);
    return (await db.inspect(client)).sites > 0;
  } catch (e) {
    fail(`The database could not be set up: ${e.message}. Nothing was left half done; fix the cause and run this again.`);
  } finally {
    await client.end().catch(() => {});
  }
}

/* ── init ──────────────────────────────────────────────────────────────── */
async function init() {
  const env = await lib("env.mjs");
  const checks = await lib("checks.mjs");
  const { checkText } = await lib("check-messages.mjs");
  const prompt = createPrompter();
  const unattended = assumeYes || !prompt.interactive;
  const existing = await readSettings();

  say(`\n${c.bold("Passive Coder CMS: new install")}`);
  say(c.dim(wrap("You need a Supabase project (supabase.com, the free plan works). Keep its dashboard open: the next questions say where each value is.", 0)));
  if (!nodeVersionOk()) fail(`Node.js ${process.versions.node} is too old. Install Node.js 22 (https://nodejs.org), then run this again.`);

  const given = {
    supabaseUrl: args["supabase-url"] ?? existing.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: args["anon-key"] ?? existing.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceKey: args["service-key"] ?? existing.SUPABASE_SERVICE_ROLE_KEY ?? "",
    databaseUrl: args["database-url"] ?? existing.DATABASE_URL ?? "",
    address: args.address ?? existing.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  };
  const a = { ...given };

  // 1. Supabase project: asked together, checked together, asked again until it works.
  step("1. Your Supabase project");
  for (let attempt = 0; ; attempt++) {
    if (!unattended) {
      a.supabaseUrl = await prompt.ask("Project URL", { fallback: a.supabaseUrl, hint: attempt ? "" : "Supabase > Project Settings > API > Project URL. Looks like https://abcdefgh.supabase.co" });
      a.anonKey = await prompt.ask("Publishable key", { fallback: a.anonKey, hint: attempt ? "" : "Project Settings > API keys > publishable key (sb_publishable_...). The old \"anon\" key works too." });
      a.serviceKey = await prompt.ask("Secret key", { fallback: a.serviceKey, hidden: true, hint: attempt ? "" : "Same page: secret key (sb_secret_...). Never share it. What you type shows as stars." });
    }
    const problems = [];
    const urlProblem = env.checkSupabaseUrl(a.supabaseUrl);
    if (urlProblem) problems.push(urlProblem === "empty" ? "The Project URL is needed." : checkText(`supabase_url_${urlProblem}`));
    else if (env.supabaseKeyKind(a.anonKey) === "secret") problems.push(checkText("anon_key_is_secret"));
    else if (env.supabaseKeyKind(a.serviceKey) === "publishable") problems.push(checkText("service_key_is_public"));
    else {
      note("Asking Supabase…");
      const probe = await checks.probeSupabase({ url: a.supabaseUrl, anonKey: a.anonKey, serviceKey: a.serviceKey });
      if (!probe.reachable) problems.push(checkText("supabase_unreachable"));
      else if (probe.anonOk === false || !a.anonKey) problems.push(checkText("anon_key_invalid"));
      else if (!a.serviceKey) problems.push(checkText("service_key_missing"));
      else if (probe.serviceOk === false) problems.push(checkText("service_key_invalid"));
      else if (probe.serviceOk === null) warn(checkText("service_key_unknown"));
    }
    if (!problems.length) { ok("Supabase answers and accepts both keys."); break; }
    for (const p of problems) bad(wrap(p));
    if (unattended) fail("Fix the Supabase values and run this again.");
  }

  // 2. Database connection (creates the tables)
  step("2. Database connection");
  if (!(await ensurePackages(prompt))) fail("The app's packages are needed to go on. Run `npm ci`, then this again.");
  const dbLib = await lib("db.mjs");
  const pg = await loadPg();
  for (let attempt = 0; ; attempt++) {
    if (!unattended) {
      a.databaseUrl = await prompt.ask("Connection string", { fallback: a.databaseUrl, hidden: true, hint: attempt ? "" : "Supabase > Connect (top of the project) > \"Session pooler\". Copy it and replace [YOUR-PASSWORD] with your database password." });
    }
    const problem = env.checkDatabaseUrl(a.databaseUrl);
    let message = problem ? checkText(problem === "empty" ? "database_url_missing" : `database_url_${problem}`) : null;
    if (!message) {
      note("Connecting…");
      let client;
      try {
        client = await dbLib.connect(pg, a.databaseUrl);
        const info = await dbLib.inspect(client);
        if (info.state === "foreign") message = checkText("schema_foreign");
      } catch (e) {
        message = checkText(`database_${dbLib.classifyDbError(e)}`);
      } finally {
        await client?.end().catch(() => {});
      }
    }
    if (!message) { ok("Connected to the database."); break; }
    bad(wrap(message));
    if (unattended) fail("Fix DATABASE_URL and run this again.");
  }

  // 3. Where the site will live
  step("3. Site address");
  for (;;) {
    if (!unattended) a.address = await prompt.ask("Address of the site", { fallback: a.address, hint: "For a try-out on this computer keep http://localhost:3000. For a real site type its domain, like www.example.com." });
    if (env.siteAddress(a.address)) break;
    bad("That does not look like an address. Examples: localhost:3000, www.example.com");
    if (unattended) fail("Give a valid --address and run this again.");
  }

  // 4. Settings file
  step("4. Settings");
  const file = envFilePath();
  const before = existsSync(file) ? readFileSync(file, "utf8") : "";
  const settings = env.buildSettings(a, { ...env.parseEnv(before), ...existing });
  let text;
  try {
    text = env.mergeEnv(before, settings.values, { header: env.ENV_HEADER });
  } catch (e) {
    fail(`${e.message}. Check the values you pasted (the database password may hold a quote: change the password in Supabase, or URL-encode it).`);
  }
  writeFileSync(file, text, { mode: 0o600 });
  try { chmodSync(file, 0o600); } catch { /* Windows */ }
  ok(`Saved to ${path.relative(root, file) || file}${settings.newSecrets.length ? ` (made ${settings.newSecrets.length} new secret keys)` : ""}.`);
  note("Keep this file private and keep a copy somewhere safe.");

  // 5. Database
  step("5. Database");
  const siteExists = await setUpDatabase(a.databaseUrl);
  prompt.close();

  // 6. Start
  const all = { ...env.parseEnv(readFileSync(file, "utf8")) };
  const setupUrl = `${all.NEXT_PUBLIC_APP_URL}/setup#code=${all.SETUP_TOKEN}`;
  const local = settings.address.local;
  let startNow = !args["no-start"] && args.start !== "false";
  if (startNow && !unattended) {
    const again = createPrompter();
    startNow = await again.confirm(local ? "Build and start the site now? (10 to 20 minutes the first time)" : "Build the app now? (10 to 20 minutes the first time)", true);
    again.close();
  } else if (unattended && !args.start) startNow = false;

  say();
  if (!startNow) {
    say(c.bold("Almost there."));
    say(`  Start the site:   ${c.cyan("node selfhost/cli/index.mjs start")}`);
    if (!siteExists) {
      if (hideCode) {
        say(`  Then open:        ${c.cyan(`${all.NEXT_PUBLIC_APP_URL}/setup`)}  (or: node selfhost/cli/index.mjs open-setup)`);
        say(`  Setup code:       the SETUP_TOKEN line in ${path.relative(root, file) || file} (not shown here)`);
      } else {
        say(`  Then open:        ${c.cyan(setupUrl)}`);
        say(`  Setup code:       ${c.bold(all.SETUP_TOKEN)}`);
      }
    }
    return;
  }
  await start({ settings: all, announce: !siteExists });
}

/* ── start ─────────────────────────────────────────────────────────────── */
async function start({ settings = null, announce = null } = {}) {
  settings ??= await readSettings();
  const { REQUIRED_SETTINGS } = await lib("env.mjs");
  const missing = REQUIRED_SETTINGS.filter((k) => !settings[k]);
  if (missing.length) fail(`These settings are missing: ${missing.join(", ")}. Run \`node selfhost/cli/index.mjs init\` first.`);
  if (!(await ensurePackages(null))) fail("Run `npm ci` first.");
  if (await buildNeeded(settings)) await build(settings);

  const port = portOf(settings);
  const setupUrl = `${settings.NEXT_PUBLIC_APP_URL}/setup${settings.SETUP_TOKEN ? `#code=${settings.SETUP_TOKEN}` : ""}`;
  if (announce === null) {
    const { probeSupabase } = await lib("checks.mjs");
    const probe = await probeSupabase({ url: settings.NEXT_PUBLIC_SUPABASE_URL, anonKey: settings.NEXT_PUBLIC_SUPABASE_ANON_KEY, serviceKey: settings.SUPABASE_SERVICE_ROLE_KEY });
    announce = probe.sites === 0 || probe.schema === "missing";
  }

  step(`Starting the site on port ${port}`);
  const env = { ...process.env, ...settings, NEXT_PUBLIC_CMS_MODE: "standalone", NEXT_TELEMETRY_DISABLED: "1", PORT: String(port) };
  const nextArgs = [path.join(root, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(port)];
  // --detach: the site runs in its own background process and this command
  // returns once the site answers (for AI agents and scripts, whose shell
  // would otherwise wait forever). Output goes to selfhost/site.log.
  const detach = !!args.detach;
  let child = null;
  if (detach) {
    const { openSync } = await import("node:fs");
    const log = openSync(path.join(root, "selfhost", "site.log"), "a");
    const bg = spawn(process.execPath, nextArgs, { detached: true, stdio: ["ignore", log, log], cwd: root, env, windowsHide: true });
    bg.unref();
    note(`Running in the background (process ${bg.pid}). Log: selfhost/site.log. Stop it with your system's task manager or \`kill ${bg.pid}\`.`);
  } else {
    child = spawn(process.execPath, nextArgs, { stdio: "inherit", cwd: root, env });
    for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
    child.on("exit", (code) => process.exit(code ?? 0));
  }

  // Wait until it answers, then say where to go.
  const base = `http://127.0.0.1:${port}`;
  let up = false;
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const res = await fetch(`${base}/login`, { redirect: "manual", signal: AbortSignal.timeout(3000) });
      if (res.status < 500) { up = true; break; }
    } catch { /* not up yet */ }
  }
  if (detach && !up) fail(`The site did not answer on port ${port} within 90 seconds. Read selfhost/site.log for the reason.`);
  say();
  if (announce) {
    say(c.green(c.bold("The site is running. Finish in your browser:")));
    if (hideCode) {
      say(`  ${c.cyan(`${settings.NEXT_PUBLIC_APP_URL}/setup`)}`);
      if (settings.SETUP_TOKEN) say("  Setup code: the SETUP_TOKEN line in the settings file (not shown here; `open-setup` opens the page with it).");
    } else {
      say(`  ${c.cyan(setupUrl)}`);
      if (settings.SETUP_TOKEN) say(`  Setup code: ${c.bold(settings.SETUP_TOKEN)}`);
    }
    const localUrl = /localhost|127\.0\.0\.1/.test(settings.NEXT_PUBLIC_APP_URL ?? "");
    if (localUrl && !args["no-open"]) openBrowser(setupUrl);
    else if (!localUrl) note(`The app listens on port ${port} of this machine. Point your web server or proxy for ${settings.NEXT_PUBLIC_ROOT_DOMAIN} at it (HTTPS).`);
  } else {
    say(c.green(c.bold(`The site is running: ${settings.NEXT_PUBLIC_APP_URL}`)));
  }
  if (detach) process.exit(0);
  say(c.dim("  Press Ctrl+C to stop."));
}

/* ── update ────────────────────────────────────────────────────────────── */
async function update() {
  const settings = await readSettings();
  if (existsSync(path.join(root, ".git"))) {
    step("Getting the new version");
    if (!run("git", ["pull", "--ff-only"])) fail("`git pull` did not work. If you changed files in this folder, save or undo those changes first.");
  } else {
    note("This folder is not a git copy: put the new version's files here yourself, then run update again.");
  }
  step("Installing packages");
  if (!run("npm", ["ci", "--no-audit", "--no-fund"])) fail("`npm ci` did not finish.");
  step("Updating the database");
  if (!settings.DATABASE_URL) warn("DATABASE_URL is not set, so the database was not updated. Add it to .env.local and run update again.");
  else await setUpDatabase(settings.DATABASE_URL);
  if (!args["no-build"]) await build(settings);
  say();
  say(c.green(c.bold("Updated.")) + " Restart the site: stop it (Ctrl+C or your process manager), then `node selfhost/cli/index.mjs start`.");
}

const AGENT_COMMANDS = ["env-slots", "env-status", "supabase-create", "supabase-keys", "vercel-env", "open-setup"];

/* ── main ──────────────────────────────────────────────────────────────── */
try {
  if (command === "help" || args.help || args.h) say(HELP);
  else if (!inCheckout) await bootstrap();
  else if (command === "init") await init();
  else if (command === "doctor") await doctor();
  else if (command === "start") await start();
  else if (command === "update") await update();
  else if (AGENT_COMMANDS.includes(command)) {
    const { runAgentCommand } = await import(pathToFileURL(path.join(here, "agent.mjs")).href);
    const code = await runAgentCommand(command, { root, args, envFile: envFilePath() });
    if (typeof code === "number") process.exitCode = code;
  }
  else { say(HELP); process.exitCode = 2; }
} catch (e) {
  fail(e?.message ?? String(e));
}

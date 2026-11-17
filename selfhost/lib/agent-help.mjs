/**
 * Help for AI coding agents (Claude Code, Codex, Cursor, Gemini CLI, Copilot)
 * that install or repair a self-hosted install. Shared by:
 *   - `doctor --json` / `doctor --redact` in the CLI (machine-readable checks)
 *   - the web installer's "Ask your AI to fix this" button (a ready prompt)
 *   - /api/setup/explain (what may be sent to Passive Coder AI)
 *
 * Pure: no Node built-ins, so a client component can import it too.
 *
 * Nothing built here ever holds a setting's value. Check results carry only
 * names, counts and addresses; on top of that every string goes through
 * scrubSecrets(), and --redact also hides addresses, hosts and emails.
 */
import { CHECK_TITLES, checkText } from "./check-messages.mjs";

export const REPO_URL = "https://github.com/PassiveCoderOfficial/PassiveCoderCMS";
export const AI_INSTALL_URL = `${REPO_URL}/blob/main/selfhost/AI-INSTALL.md`;
export const ISSUES_URL = `${REPO_URL}/issues`;
export const REPORT_SCHEMA = "passivecoder-doctor/1";

/** Where to read about a check: its section in the agent runbook. */
export const docsFor = (id) => `${AI_INSTALL_URL}#fix-${id}`;

/** How settings are changed and applied, per kind of install. */
export const PLATFORM_HOWTO = {
  node: {
    file: ".env.local in the code folder",
    makeSecret: "Run `node selfhost/cli/index.mjs env-slots` (it writes the missing secret into .env.local, never shown).",
    apply: "Run `node selfhost/cli/index.mjs doctor` until it passes, then restart with `node selfhost/cli/index.mjs start` (it rebuilds by itself when a NEXT_PUBLIC_ setting changed).",
  },
  docker: {
    file: "/opt/passivecoder/.env on the server",
    makeSecret: "Run `sudo sh /opt/passivecoder/install.sh --yes` on the server (it makes missing secrets in /opt/passivecoder/.env).",
    apply: "Run `sudo sh /opt/passivecoder/install.sh --yes` on the server (it keeps every other value and restarts the site).",
  },
  vercel: {
    file: "the Vercel project's Environment Variables (Settings > Environment Variables, or `node selfhost/cli/index.mjs vercel-env` from .env.local)",
    makeSecret: "In the local copy run `node selfhost/cli/index.mjs env-slots`, then `node selfhost/cli/index.mjs vercel-env` (copies it to Vercel without printing it).",
    apply: "Redeploy: `vercel deploy --prod --yes` (or Deployments > newest > Redeploy).",
  },
};

/**
 * What to do, for each problem code: steps an agent (or a person) can follow.
 * {file} and {apply} are filled per platform. ok codes have no fix.
 * @type {Record<string, string>}
 */
export const CHECK_FIXES = {
  settings_missing: "Add the missing settings ({names}) to {file}. Run `node selfhost/cli/index.mjs env-slots` to write empty slots, then ask the user to paste each value into the file (never into the chat). {apply}",
  needs_settings: "Fix the \"Settings\" check first.",
  build_stale: "The app was built with other values of {names}. Rebuild: on Vercel redeploy; with the CLI run `node selfhost/cli/index.mjs start` (it rebuilds); on the server image run `sudo sh /opt/passivecoder/install.sh --yes`.",

  supabase_url_not_a_url: "Set NEXT_PUBLIC_SUPABASE_URL in {file} to https://<project-ref>.supabase.co (or run `node selfhost/cli/index.mjs supabase-keys --ref <project-ref>`). {apply}",
  supabase_url_dashboard_link: "NEXT_PUBLIC_SUPABASE_URL is a dashboard link. Replace it with https://<project-ref>.supabase.co in {file}. {apply}",
  supabase_url_has_path: "Remove everything after .supabase.co from NEXT_PUBLIC_SUPABASE_URL in {file}. {apply}",
  supabase_unreachable: "Check the project exists and is not paused: `supabase projects list` (status must be ACTIVE_HEALTHY). A paused free project: ask the user to open it in the Supabase dashboard and click Restore. Then check NEXT_PUBLIC_SUPABASE_URL in {file}.",
  anon_key_invalid: "Rewrite the keys from the same project: `node selfhost/cli/index.mjs supabase-keys --ref <project-ref>` (or ask the user to paste the publishable key into NEXT_PUBLIC_SUPABASE_ANON_KEY in {file}). {apply}",
  anon_key_is_secret: "The secret key is in the public slot. Run `node selfhost/cli/index.mjs supabase-keys --ref <project-ref>` to rewrite both keys, and tell the user to rotate the secret key in Supabase (Project Settings > API Keys) because it may have leaked. {apply}",

  service_key_missing: "Run `node selfhost/cli/index.mjs supabase-keys --ref <project-ref>` (writes SUPABASE_SERVICE_ROLE_KEY without printing it), or ask the user to paste the secret key into SUPABASE_SERVICE_ROLE_KEY in {file}. {apply}",
  service_key_is_public: "The publishable key is in SUPABASE_SERVICE_ROLE_KEY. Run `node selfhost/cli/index.mjs supabase-keys --ref <project-ref>` to rewrite both keys. {apply}",
  service_key_invalid: "Run `node selfhost/cli/index.mjs supabase-keys --ref <project-ref>` for the project in NEXT_PUBLIC_SUPABASE_URL. {apply}",
  service_key_unknown: "Wait a minute and run the check again.",
  needs_supabase: "Fix the \"Supabase project\" check first.",

  database_not_checked: "Run `npm ci` in the code folder, then run the check again.",
  database_url_missing: "Run `node selfhost/cli/index.mjs supabase-keys --ref <project-ref> --region <region>` (builds DATABASE_URL from the saved SUPABASE_DB_PASSWORD), or ask the user to paste the Session pooler string (Supabase > Connect > Session pooler, password filled in) into DATABASE_URL in {file}.",
  database_url_missing_later: "Optional now. Add DATABASE_URL to {file} before the next update.",
  database_url_not_a_url: "DATABASE_URL must look like postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres. Rebuild it with `node selfhost/cli/index.mjs supabase-keys --ref <project-ref> --region <region>` or ask the user to paste the Session pooler string into {file}.",
  database_url_not_postgres: "Replace DATABASE_URL in {file} with the Session pooler string (starts with postgresql://).",
  database_url_password_placeholder: "DATABASE_URL still holds [YOUR-PASSWORD]. Ask the user to replace it in {file} with the database password (no brackets). Never ask for the password in the chat.",
  database_url_no_password: "Ask the user to put the database password into DATABASE_URL in {file} (postgresql://user:PASSWORD@host...).",
  database_auth: "The database password is wrong. Ask the user to reset it (Supabase > Project Settings > Database > Reset database password) and paste the new one into DATABASE_URL in {file}; URL-encode special characters (@ is %40). Or set SUPABASE_DB_PASSWORD in the file and run `node selfhost/cli/index.mjs supabase-keys --ref <project-ref> --region <region>`.",
  database_project: "The pooler does not know this user. The user name must be postgres.<project-ref>. A brand-new project needs 1 to 3 minutes before the pooler knows it: wait, then check again. Else rebuild DATABASE_URL with `supabase-keys --region`.",
  database_host: "The pooler host is wrong for this project's region. Run `node selfhost/cli/index.mjs supabase-keys --ref <project-ref> --region <region>` (tries aws-0 and aws-1 hosts), or ask the user to copy the Session pooler string from Supabase > Connect.",
  database_network: "Use the Session pooler (host *.pooler.supabase.com, port 5432), not the direct db.<ref>.supabase.co host (IPv6 only). Check outgoing port 5432 is not blocked.",
  database_other: "Copy the Session pooler connection string again (Supabase > Connect) into DATABASE_URL in {file}, then check again.",
  database_transaction_pooler: "Change the port in DATABASE_URL from 6543 to 5432 (Session pooler) in {file}.",

  schema_empty: "Load the database: `node selfhost/cli/index.mjs init --yes --no-start` (or the \"Set up the database\" button on /setup). It is all or nothing and safe to retry.",
  schema_foreign: "STOP: this database holds other tables. Never drop them. Ask the user to create a new, empty Supabase project for Passive Coder CMS and use its values.",
  schema_missing_no_url: "Add DATABASE_URL (see the \"Database connection\" check), then load the database: `node selfhost/cli/index.mjs init --yes --no-start`.",
  schema_missing_no_db: "Fix the \"Database connection\" check first, then load the database.",
  schema_unknown: "Fix the checks above first.",
  schema_version_unknown: "Once the database connection works, run `node selfhost/cli/index.mjs update --no-build`.",
  schema_pending: "Apply the {count} database update(s): `node selfhost/cli/index.mjs update --no-build` (or the \"Update the database\" button on /setup).",
  needs_schema: "Load the database first.",

  storage_unknown: "Wait a minute and check again.",
  buckets_missing: "Wait a minute (Supabase Storage may still be starting) and check again. If {names} stay missing, run `node selfhost/cli/index.mjs update --no-build` once.",

  courier_key_missing: "Optional (needed for saved payment and courier keys). {makeSecret} {apply}",
  courier_key_bad: "Only if no payment or courier keys were saved yet: delete the COURIER_SECRET_KEY line from {file}, then make a new one. {makeSecret} If keys were saved, ask the user first: a new key makes them unreadable. {apply}",
  app_secret_missing: "{makeSecret} {apply}",
  app_secret_short: "Ask the user before changing it (signed links stop working). To replace: delete the APP_SECRET line from {file}. {makeSecret} {apply}",

  setup_token_missing: "{makeSecret} {apply}",
  cron_secret_missing: "Add CRON_SECRET. {makeSecret} {apply}",

  email_not_configured: "Optional. The user can add outgoing email on the /setup Extras step or later.",
  email_from_missing: "Add EMAIL_FROM to {file}, for example: Your Business <hello@yourdomain.com>. {apply}",

  address_not_checked: "Nothing to do in the terminal: the setup page checks this in the browser.",
  address_mismatch: "Open {expected} instead, or change NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_ROOT_DOMAIN in {file} to the address in use. {apply}",
  address_www: "Pick one address (with or without www) and redirect the other to it.",
  address_scheme: "Use the https address. For a real domain, make sure HTTPS works (server install: Caddy does it once DNS points at the server).",
};

/** Fill {name} parts; unknown parts stay as they are. */
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));

/** The fix for one result, or null when there is nothing to do. */
export function fixFor(code, params = {}, platform = "node") {
  const how = PLATFORM_HOWTO[platform] ?? PLATFORM_HOWTO.node;
  const text = CHECK_FIXES[code];
  return text ? fill(text, { ...params, file: how.file, apply: how.apply, makeSecret: how.makeSecret }) : null;
}

/* ── Keeping secrets out ──────────────────────────────────────────────── */

const SECRET_PATTERNS = [
  /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, // JWT (legacy Supabase keys)
  /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{8,}/g,                // Supabase API keys
  /\bsbp_[A-Za-z0-9]{16,}/g,                                        // Supabase access token
  /\bsk-[A-Za-z0-9_-]{16,}/g,                                       // OpenAI / OpenRouter / Anthropic
  /\b(?:re|pc)_[A-Za-z0-9]{8,}_[A-Za-z0-9]{8,}/g,                   // Resend and similar keys
  /\b(?:ghp|gho|ghs|github_pat)_[A-Za-z0-9_]{16,}/g,                // GitHub tokens
];

/**
 * Replace secret-looking text, and every value given in `known` (the
 * install's own settings), with [redacted]. Postgres URLs lose their password.
 */
export function scrubSecrets(text, known = []) {
  let s = String(text ?? "");
  for (const v of known) {
    const value = String(v ?? "").trim();
    if (value.length >= 8) s = s.split(value).join("[redacted]");
  }
  s = s.replace(/(postgres(?:ql)?:\/\/[^\s:/@]+:)[^\s@]+@/gi, "$1[redacted]@");
  for (const re of SECRET_PATTERNS) s = s.replace(re, "[redacted]");
  return s;
}

/** Links that say nothing about the install (docs, downloads). */
const PUBLIC_URL = /^https:\/\/(?:github\.com\/PassiveCoderOfficial\/|nodejs\.org|(?:www\.)?passivecoder\.com|supabase\.com|vercel\.com)/i;

const PUBLIC_HOST = /^(?:(?:www\.)?(?:supabase\.(?:co|com)|vercel\.(?:app|com)|passivecoder\.com|github\.com|nodejs\.org|raw\.githubusercontent\.com|get\.docker\.com)|pooler\.supabase\.com|[a-z0-9-]+\.pooler\.supabase\.com)$/i;

/** For issue reports: also hide addresses, hosts, Supabase refs and emails. */
export function redactPublic(text) {
  return scrubSecrets(text)
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/\bhttps?:\/\/[^\s"'<>)]+/gi, (m) => (PUBLIC_URL.test(m) ? m : "[address]"))
    .replace(/\b[a-z0-9]{20}\.supabase\.(?:co|in)\b/gi, "[project].supabase.co")
    .replace(/\bpostgres\.[a-z0-9]{20}\b/gi, "postgres.[project]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[ip]")
    .replace(/\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|app|dev|xyz|info|biz|me|sg|bd|ae|qa|sa|my|uk|in|de|us)\b/gi, (m) => (PUBLIC_HOST.test(m) ? m : "[host]"));
}

/** Every string inside a JSON-like value, through `fn`. */
function mapStrings(value, fn) {
  if (typeof value === "string") return fn(value);
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)]));
  return value;
}

/** Setting values worth hiding: anything secret, plus every value that could identify the install. */
export function secretValuesOf(env = {}) {
  return Object.entries(env)
    .filter(([k, v]) => v && /KEY|SECRET|TOKEN|PASSWORD|PASS$|DATABASE_URL|LICENCE|SMTP_USER/i.test(k))
    .map(([, v]) => String(v));
}

/* ── doctor --json ────────────────────────────────────────────────────── */

/**
 * The machine-readable doctor report.
 * @param {object} o
 * @param {{ id: string, status: string, code: string, params: Record<string, string|number> }[]} o.results
 * @param {object} o.summary   from summarize()
 * @param {{ version?: string, node?: string, nodeOk?: boolean, os?: string, platform?: string }} [o.meta]
 * @param {Record<string, string|undefined>} [o.env]  the settings, used ONLY to scrub their values out
 * @param {boolean} [o.redact]  hide addresses, hosts and emails too (for a public issue)
 */
export function buildDoctorReport({ results, summary, meta = {}, env = {}, redact = false }) {
  const platform = meta.platform ?? "node";
  const checks = [];
  if (meta.node) {
    checks.push({
      id: "node", title: "Node.js", status: meta.nodeOk === false ? "fail" : "ok", code: meta.nodeOk === false ? "node_old" : "node_ok",
      message: meta.nodeOk === false ? `Node.js ${meta.node} is too old. Node.js 20.12 or newer is needed (22 is best).` : `Node.js ${meta.node}.`,
      fix: meta.nodeOk === false ? "Install Node.js 22 LTS (Windows: `winget install OpenJS.NodeJS.LTS`; macOS: `brew install node@22`; Linux: https://nodejs.org or nvm), open a new terminal, run doctor again." : null,
      docs: docsFor("node"),
    });
  }
  for (const r of results) {
    checks.push({
      id: r.id,
      title: CHECK_TITLES[r.id] ?? r.id,
      status: r.status,
      code: r.code,
      message: checkText(r.code, r.params),
      fix: r.status === "ok" ? null : fixFor(r.code, r.params, platform),
      docs: docsFor(r.id),
    });
  }
  const blocking = checks.filter((c) => c.status === "fail").map((c) => c.id);
  const report = {
    schema: REPORT_SCHEMA,
    version: meta.version ?? null,
    os: meta.os ?? null,
    platform,
    ready: blocking.length === 0,
    onlyDatabaseMissing: !!summary?.onlyDatabaseMissing,
    siteExists: summary?.siteExists ?? null,
    pendingMigrations: summary?.pendingMigrations ?? 0,
    blocking,
    checks,
    help: { runbook: AI_INSTALL_URL, issues: ISSUES_URL },
  };
  const known = secretValuesOf(env);
  return mapStrings(report, (s) => (redact ? redactPublic(scrubSecrets(s, known)) : scrubSecrets(s, known)));
}

/* ── "Ask your AI to fix this" ────────────────────────────────────────── */

/**
 * A ready prompt for one failed check. English (the agents' language).
 * Holds the check id, the problem, the fix steps and the runbook link; never
 * a setting's value.
 * @param {{ id: string, code: string, params?: Record<string, string|number>, platform?: string, version?: string }} r
 */
export function fixPrompt({ id, code, params = {}, platform = "node", version = "" }) {
  const title = CHECK_TITLES[id] ?? id;
  const where = platform === "vercel" ? "on Vercel + Supabase" : platform === "docker" ? "on my own server (selfhost/install.sh, Docker)" : "with the Node.js CLI (selfhost/cli)";
  const lines = [
    `My self-hosted Passive Coder CMS${version ? ` (v${version})` : ""} install ${where} fails the setup check "${title}" (check id: ${id}, code: ${code}).`,
    `Problem: ${checkText(code, params)}`,
    `Fix steps: ${fixFor(code, params, platform) ?? "See the runbook section for this check."}`,
    `Follow ${docsFor(id)} (selfhost/AI-INSTALL.md in the repo, section fix-${id}); verify with \`node selfhost/cli/index.mjs doctor --json\`.`,
    "Rules: never ask me to paste keys or passwords into this chat; write empty slots in the settings file and tell me where to paste each value. Stop and ask before anything that costs money, needs a login, or deletes data.",
  ];
  return scrubSecrets(lines.join("\n"));
}

/* ── "Explain this" (Passive Coder AI) ────────────────────────────────── */

const SAFE_PARAM = { names: /^[A-Z0-9_, ]{1,400}$/, count: /^\d{1,5}$/ };

/**
 * What /api/setup/explain may send: check ids and their English messages,
 * nothing else. Unknown ids or codes are dropped; params other than setting
 * names and counts (for example addresses) are not filled in.
 * @param {unknown} input  [{ id, code, params? }]
 * @returns {{ id: string, title: string, message: string }[]}
 */
export function explainItems(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const raw of input.slice(0, 20)) {
    if (!raw || typeof raw !== "object") continue;
    const { id, code, params } = /** @type {any} */ (raw);
    if (typeof id !== "string" || !CHECK_TITLES[id] || typeof code !== "string" || !/^[a-z_]{2,60}$/.test(code)) continue;
    const message = checkText(code, {});
    if (message === code) continue; // not a known code
    const safe = {};
    for (const [k, re] of Object.entries(SAFE_PARAM)) {
      const v = params && typeof params === "object" ? String(/** @type {any} */ (params)[k] ?? "") : "";
      safe[k] = re.test(v) ? v : "(hidden)";
    }
    out.push({ id, title: CHECK_TITLES[id], message: scrubSecrets(checkText(code, safe)) });
  }
  return out;
}

export const EXPLAIN_SYSTEM = [
  "You help a non-technical small-business owner finish installing Passive Coder CMS (self-hosted, Next.js + Supabase).",
  "You get the failed setup checks: an id, a title and the installer's own message for each.",
  "Explain in plain English what each problem means and the simplest way to fix it, in short numbered steps.",
  "Never ask for keys, passwords or connection strings, and never tell the owner to paste them into a chat.",
  "Settings live in .env.local (CLI install), /opt/passivecoder/.env (server install) or the Vercel project's Environment Variables (Vercel).",
  "If the fix needs a terminal, say they can ask an AI coding agent and point to selfhost/AI-INSTALL.md.",
  "Keep it under 220 words. No markdown headings.",
].join(" ");

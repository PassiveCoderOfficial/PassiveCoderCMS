/**
 * Settings for a self-hosted install: what is required, how values are
 * checked, how secrets are made and how the settings file is written.
 *
 * Pure (no network, no file access), plain Node, no packages: the web
 * installer, the CLI (selfhost/cli) and the tests all use this one file.
 */
import { randomBytes as nodeRandomBytes } from "node:crypto";

/** Public settings: Next.js writes these into the app when it is built. */
export const PUBLIC_SETTINGS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_ROOT_DOMAIN",
  "NEXT_PUBLIC_APP_URL",
];
/** Needed by the running app, besides the public ones. */
export const REQUIRED_SETTINGS = [...PUBLIC_SETTINGS, "SUPABASE_SERVICE_ROLE_KEY"];
/** Secrets the installer makes up itself. */
export const GENERATED_SECRETS = ["APP_SECRET", "CRON_SECRET", "COURIER_SECRET_KEY", "SETUP_TOKEN"];

/**
 * Make the secrets that are not set yet. Existing values are never replaced:
 * COURIER_SECRET_KEY encrypts saved payment keys, APP_SECRET signs links.
 * @param {Record<string, string | undefined>} existing
 * @param {(n: number) => Buffer} [randomBytes]
 * @returns {Record<string, string>} only the newly made ones
 */
export function generateSecrets(existing = {}, randomBytes = nodeRandomBytes) {
  const out = {};
  const missing = (k) => !String(existing[k] ?? "").trim();
  if (missing("APP_SECRET")) out.APP_SECRET = randomBytes(32).toString("base64");
  if (missing("CRON_SECRET")) out.CRON_SECRET = randomBytes(32).toString("hex");
  // Exactly 32 bytes, base64: the app refuses any other length.
  if (missing("COURIER_SECRET_KEY")) out.COURIER_SECRET_KEY = randomBytes(32).toString("base64");
  if (missing("SETUP_TOKEN")) out.SETUP_TOKEN = randomBytes(16).toString("hex");
  return out;
}

/** True when the value is base64 for exactly 32 bytes. */
export function isCourierKey(value) {
  const v = String(value ?? "").trim();
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(v)) return false;
  try {
    return Buffer.from(v, "base64").length === 32;
  } catch {
    return false;
  }
}

/**
 * "example.com", "https://www.Example.com/", "localhost:3000" ->
 * { rootDomain: "www.example.com", appUrl: "https://www.example.com" }.
 * Local addresses get http, everything else https. Returns null when the
 * text is not a usable address.
 */
export function siteAddress(input) {
  let text = String(input ?? "").trim();
  if (!text) return null;
  const hadScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text);
  if (!hadScheme) text = `x://${text}`;
  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  const host = url.host.toLowerCase();
  if (!host || /[\s_]/.test(host) || url.username || url.password) return null;
  const name = url.hostname.toLowerCase();
  const local = name === "localhost" || name.endsWith(".localhost") || /^(127\.|10\.|192\.168\.|\[::1\])/.test(name);
  if (!local && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(name)) return null;
  const scheme = hadScheme && /^https?:$/.test(url.protocol) ? url.protocol.slice(0, -1) : local ? "http" : "https";
  return { rootDomain: host, appUrl: `${scheme}://${host}`, local };
}

/** null when fine, otherwise a short reason code. */
export function checkSupabaseUrl(value) {
  const v = String(value ?? "").trim();
  if (!v) return "empty";
  let url;
  try {
    url = new URL(v);
  } catch {
    return "not_a_url";
  }
  if (!/^https?:$/.test(url.protocol)) return "not_a_url";
  if (/supabase\.com$/i.test(url.hostname) && /dashboard|app\./i.test(v)) return "dashboard_link";
  if (url.pathname.replace(/\/+$/, "") !== "") return "has_path";
  return null;
}

/** What kind of Supabase API key this looks like. */
export function supabaseKeyKind(value) {
  const v = String(value ?? "").trim();
  if (!v) return "empty";
  if (v.startsWith("sb_publishable_")) return "publishable";
  if (v.startsWith("sb_secret_")) return "secret";
  const parts = v.split(".");
  if (parts.length === 3 && v.startsWith("eyJ")) {
    try {
      const role = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")).role;
      if (role === "anon") return "publishable";
      if (role === "service_role") return "secret";
    } catch { /* not a token we can read */ }
    return "unknown";
  }
  return "unknown";
}

/** null when fine, otherwise a short reason code. */
export function checkDatabaseUrl(value) {
  const v = String(value ?? "").trim();
  if (!v) return "empty";
  let url;
  try {
    url = new URL(v);
  } catch {
    return "not_a_url";
  }
  if (!/^postgres(ql)?:$/.test(url.protocol)) return "not_postgres";
  if (/\[YOUR[-_ ]PASSWORD\]|\[password\]/i.test(decodeURIComponent(v))) return "password_placeholder";
  if (!url.password) return "no_password";
  return null;
}

/** Supabase's short-lived pooler (port 6543) keeps no session: updates need
 *  the "Session pooler" (port 5432) or the direct connection. */
export function isTransactionPooler(value) {
  try {
    const url = new URL(String(value ?? "").trim());
    return url.port === "6543" && /pooler\.supabase\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}

/* ── The settings file (.env / .env.local) ─────────────────────────────── */

/** Read KEY=value lines. Quotes are removed; comments and blanks skipped. */
/** @returns {Record<string, string>} */
export function parseEnv(text) {
  const out = {};
  for (const raw of String(text ?? "").split(/\r?\n/)) {
    const m = raw.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (/^'.*'$/.test(v)) v = v.slice(1, -1).replace(/'\\''/g, "'");
    else if (/^".*"$/.test(v)) v = v.slice(1, -1).replace(/\\(["\\$`])/g, "$1");
    else v = v.replace(/\s+#.*$/, "").trim();
    out[m[1]] = v;
  }
  return out;
}

/**
 * One value, safe for every reader of the file (Docker Compose, Node's
 * --env-file, a shell): plain when it only has safe characters, otherwise in
 * single quotes, which none of them look inside. A value with a single quote
 * or a line break cannot be written safely and is refused.
 */
export function envValue(value) {
  const v = String(value ?? "");
  if (/[\r\n]/.test(v)) throw new Error("a setting cannot hold a line break");
  if (/^[A-Za-z0-9_@%+=:,./-]*$/.test(v)) return v;
  if (v.includes("'")) throw new Error("a setting cannot hold a single quote (')");
  return `'${v}'`;
}

/**
 * Put `values` into the text of a settings file. Lines that already set one
 * of the keys are replaced in place (comments and order are kept); new keys
 * are added at the end. Empty values are skipped unless the key is in
 * `keepEmpty`.
 */
export function mergeEnv(existingText, values, { header = "" } = {}) {
  const todo = new Map(Object.entries(values).filter(([, v]) => v !== undefined && v !== null && String(v) !== ""));
  const lines = existingText ? String(existingText).replace(/\r\n/g, "\n").split("\n") : header ? header.split("\n") : [];
  const out = lines.map((line) => {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!m || !todo.has(m[1])) return line;
    const next = `${m[1]}=${envValue(todo.get(m[1]))}`;
    todo.delete(m[1]);
    return next;
  });
  while (out.length && out[out.length - 1] === "") out.pop();
  for (const [k, v] of todo) out.push(`${k}=${envValue(v)}`);
  return out.join("\n") + "\n";
}

export const ENV_HEADER = [
  "# Passive Coder CMS (self-hosted, one site): settings.",
  "# Written by the installer. Keep this file private: it holds secret keys.",
  "# Every setting is explained in selfhost/.env.example.",
  "",
].join("\n");

/**
 * The full set of settings for a new or updated install.
 * @param {{ supabaseUrl: string, anonKey: string, serviceKey: string, databaseUrl?: string, address: string }} answers
 * @param {Record<string, string | undefined>} [existing] values already in the file
 * @param {(n: number) => Buffer} [randomBytes]
 */
export function buildSettings(answers, existing = {}, randomBytes = nodeRandomBytes) {
  const addr = siteAddress(answers.address);
  if (!addr) throw new Error("The site address is not valid.");
  const values = {
    NEXT_PUBLIC_CMS_MODE: "standalone",
    NEXT_PUBLIC_SUPABASE_URL: String(answers.supabaseUrl).trim().replace(/\/+$/, ""),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: String(answers.anonKey).trim(),
    SUPABASE_SERVICE_ROLE_KEY: String(answers.serviceKey).trim(),
    NEXT_PUBLIC_ROOT_DOMAIN: addr.rootDomain,
    NEXT_PUBLIC_APP_URL: addr.appUrl,
    ...(answers.databaseUrl ? { DATABASE_URL: String(answers.databaseUrl).trim() } : {}),
  };
  const secrets = generateSecrets({ ...existing }, randomBytes);
  return { values: { ...values, ...secrets }, newSecrets: Object.keys(secrets), address: addr };
}

/** Short print of the public settings a build was made with, so a later
 *  change is noticed and the app is built again without being asked. */
export function publicSettingsStamp(env) {
  return PUBLIC_SETTINGS.map((k) => `${k}=${String(env[k] ?? "").trim()}`).join("\n");
}

/* ── Deploy to Vercel ──────────────────────────────────────────────────── */

export const PUBLIC_REPO = "https://github.com/PassiveCoderOfficial/PassiveCoderCMS";

/**
 * Settings the Vercel "Deploy" page asks for, in order. The site address is
 * not asked: on Vercel the build takes it from the project's own domain
 * (next.config.ts). APP_SECRET falls back to the Supabase secret key and
 * COURIER_SECRET_KEY is only needed for online payments and couriers; the web
 * installer offers a ready-made value for it.
 */
export const VERCEL_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "SETUP_TOKEN",
  "CRON_SECRET",
];

/** The "Deploy to Vercel" address for a repository. */
export function vercelDeployUrl(repo = PUBLIC_REPO) {
  const q = new URLSearchParams({
    "repository-url": repo,
    "project-name": "passivecoder-cms",
    "repository-name": "passivecoder-cms",
    env: VERCEL_ENV.join(","),
    envDescription: "Four values from your Supabase project, and two passwords you make up now. The guide shows where each one is.",
    envLink: `${repo}/blob/main/selfhost/INSTALL-CLOUD.md#2-click-deploy`,
  });
  return `https://vercel.com/new/clone?${q.toString()}`;
}

/**
 * Settings-file helpers for AI agents (the CLI's env-slots, env-status,
 * supabase-create, supabase-keys and vercel-env commands). Pure: no files,
 * no network; the CLI does the reading, writing and spawning.
 *
 * The rule they serve: a secret never passes through the chat. Values go
 * from a CLI's output straight into the settings file; what is printed is
 * only setting names and "set" / "empty".
 */
import { REQUIRED_SETTINGS, GENERATED_SECRETS, generateSecrets, siteAddress, supabaseKeyKind, envValue, parseEnv } from "./env.mjs";

/** Slots an agent writes, in order. "user" = the user pastes it (or a CLI fills it). */
export const SLOTS = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", from: "supabase-keys, or Supabase > Project Settings > API > Project URL (https://<ref>.supabase.co)" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", from: "supabase-keys, or Supabase > Project Settings > API Keys > publishable key (sb_publishable_...)" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", from: "supabase-keys, or Supabase > Project Settings > API Keys > secret key (sb_secret_...)" },
  { name: "DATABASE_URL", from: "supabase-keys --region, or Supabase > Connect > Session pooler, with the database password in place of [YOUR-PASSWORD]" },
  { name: "NEXT_PUBLIC_APP_URL", from: "the site address, e.g. http://localhost:3000 or https://www.example.com" },
  { name: "NEXT_PUBLIC_ROOT_DOMAIN", from: "the site address without https://, e.g. www.example.com" },
];

/** Status of each important setting: "set" or "empty" (never the value). */
export function slotStatus(env) {
  const names = [...SLOTS.map((s) => s.name), ...GENERATED_SECRETS];
  return names.map((name) => ({ name, state: String(env[name] ?? "").trim() ? "set" : "empty", from: SLOTS.find((s) => s.name === name)?.from ?? "made by env-slots" }));
}

/**
 * Add empty `KEY=` lines for every slot missing from the file, make the
 * secrets that are missing (never replaces one), set standalone mode, and
 * the site address when given. Existing values are kept.
 * @param {string} text  the settings file as it is ("" when there is none)
 * @param {{ address?: string | null, randomBytes?: (n: number) => Buffer }} [opts]
 * @returns {{ text: string, added: string[], made: string[] }}
 */
export function ensureSlots(text, { address = null, randomBytes } = {}) {
  const before = parseEnv(text);
  const lines = text ? String(text).replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n") : [
    "# Passive Coder CMS (self-hosted, one site): settings.",
    "# Keep this file private: it holds secret keys. Never paste these values into a chat.",
    "# Every setting is explained in selfhost/.env.example.",
    "",
  ];
  const present = (k) => lines.some((l) => new RegExp(`^\\s*(?:export\\s+)?${k}\\s*=`).test(l));
  const set = (k, v) => {
    const i = lines.findIndex((l) => new RegExp(`^\\s*(?:export\\s+)?${k}\\s*=`).test(l));
    const line = `${k}=${envValue(v)}`;
    if (i >= 0) lines[i] = line; else lines.push(line);
  };
  const added = [];
  if (!String(before.NEXT_PUBLIC_CMS_MODE ?? "").trim()) set("NEXT_PUBLIC_CMS_MODE", "standalone");
  if (address) {
    const a = siteAddress(address);
    if (!a) throw new Error("The site address is not valid.");
    set("NEXT_PUBLIC_APP_URL", a.appUrl);
    set("NEXT_PUBLIC_ROOT_DOMAIN", a.rootDomain);
  }
  for (const { name } of SLOTS) if (!present(name)) { lines.push(`${name}=`); added.push(name); }
  const made = generateSecrets(before, randomBytes);
  for (const [k, v] of Object.entries(made)) set(k, v);
  return { text: lines.join("\n") + "\n", added, made: Object.keys(made) };
}

/** Set values in the file text (in place, or appended). */
export function setValues(text, values) {
  const lines = String(text ?? "").replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n").filter((l, i, a) => !(a.length === 1 && l === ""));
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined || v === null || v === "") continue;
    const line = `${k}=${envValue(v)}`;
    const i = lines.findIndex((l) => new RegExp(`^\\s*(?:export\\s+)?${k}\\s*=`).test(l));
    if (i >= 0) lines[i] = line; else lines.push(line);
  }
  return lines.join("\n") + "\n";
}

/** A Supabase project ref: 20 lowercase letters/digits. */
export const isProjectRef = (v) => /^[a-z0-9]{20}$/.test(String(v ?? ""));

/** A key Supabase returned masked ("sb_secret_abc····"), which is useless. */
const masked = (v) => /[·•*]/.test(v) || v.length < 30;

/**
 * Keys from `supabase projects api-keys -o json`. Accepts the old list
 * ([{ name: "anon", api_key }, { name: "service_role", api_key }]) and the
 * new one ({ type: "publishable" | "secret", api_key }). New-style keys are
 * preferred; masked ones are skipped.
 * @returns {{ anon: string|null, service: string|null }}
 */
export function parseApiKeys(json) {
  let list = json;
  if (typeof json === "string") {
    try { list = JSON.parse(json); } catch { return { anon: null, service: null }; }
  }
  if (!Array.isArray(list)) return { anon: null, service: null };
  const pick = (kind) => {
    const keys = list.map((e) => String(e?.api_key ?? "").trim()).filter((v) => v && !masked(v) && supabaseKeyKind(v) === kind);
    return keys.find((v) => v.startsWith("sb_")) ?? keys[0] ?? null;
  };
  return { anon: pick("publishable"), service: pick("secret") };
}

/** The project ref from `supabase projects create -o json` (or a list entry). */
export function parseProjectRef(json) {
  let o = json;
  if (typeof json === "string") {
    try { o = JSON.parse(json); } catch {
      const m = /\b([a-z0-9]{20})\b/.exec(json);
      return m ? m[1] : null;
    }
  }
  const ref = o?.ref ?? o?.id ?? o?.project_ref;
  return isProjectRef(ref) ? ref : null;
}

/** Session pooler connection strings to try, newest host style last. */
export function poolerCandidates(ref, region, password) {
  if (!isProjectRef(ref) || !/^[a-z]{2}-[a-z]+-\d$/.test(String(region ?? "")) || !password) return [];
  const pw = encodeURIComponent(password);
  return ["aws-0", "aws-1"].map((p) => `postgresql://postgres.${ref}:${pw}@${p}-${region}.pooler.supabase.com:5432/postgres`);
}

/** Settings sent to Vercel, in order. Values come from the settings file. */
export const VERCEL_SETTINGS = [
  "NEXT_PUBLIC_CMS_MODE",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "SETUP_TOKEN",
  "CRON_SECRET",
  "APP_SECRET",
  "COURIER_SECRET_KEY",
];

/** Required settings still empty. */
export const missingRequired = (env) => REQUIRED_SETTINGS.filter((k) => !String(env[k] ?? "").trim());

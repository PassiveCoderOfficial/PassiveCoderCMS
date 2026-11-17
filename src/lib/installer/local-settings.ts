import { accessSync, constants, existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import path from "node:path";
import { mergeEnv, parseEnv } from "../../../selfhost/lib/env.mjs";

/*
 * Optional settings the web installer saves on a self-hosted install that has
 * a disk (Docker, a plain Node server): outgoing email (Resend key or SMTP
 * server) and sender,
 * and the Passive Coder AI key. They live in <data folder>/settings.env, next
 * to licence.json, and are put into the process environment at start-up
 * (src/instrumentation.ts) and again right after saving, so nothing needs a
 * restart. A value already set in the real environment always wins.
 *
 * Only the names in ALLOWED are ever read from or written to that file.
 * Vercel has no disk: there the installer shows which settings to add in the
 * project instead. Hosted (SaaS) mode never calls any of this.
 */

export const LOCAL_SETTING_NAMES = ["RESEND_API_KEY", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM", "EMAIL_FROM_ADDRESS", "PASSIVECODER_AI_KEY"] as const;
export type LocalSettingName = (typeof LOCAL_SETTING_NAMES)[number];
const ALLOWED = new Set<string>(LOCAL_SETTING_NAMES);

/** Where the install keeps its own files (Docker: /app/data). */
export function dataDir(): string {
  const set = process.env.PASSIVECODER_DATA_DIR?.trim();
  if (set) return set;
  const licence = process.env.PASSIVECODER_LICENCE_FILE?.trim();
  if (licence) return path.dirname(licence);
  return path.join(process.cwd(), "data");
}

export const localSettingsFile = () => path.join(dataDir(), "settings.env");
export const licenceFilePath = () => process.env.PASSIVECODER_LICENCE_FILE?.trim() || path.join(process.cwd(), "licence.json");

/** Can this install keep files between restarts? */
export function hasWritableDisk(): boolean {
  if (process.env.VERCEL) return false;
  try {
    const dir = dataDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    accessSync(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/** Put saved settings into the environment. Never throws. */
export function loadLocalSettings(): string[] {
  const applied: string[] = [];
  try {
    const file = localSettingsFile();
    if (!existsSync(file)) return applied;
    const values = parseEnv(readFileSync(file, "utf8")) as Record<string, string>;
    for (const [k, v] of Object.entries(values)) {
      if (!ALLOWED.has(k) || !v || process.env[k]?.trim()) continue;
      process.env[k] = v;
      applied.push(k);
    }
  } catch (e) {
    console.warn(`[installer] could not read saved settings: ${e instanceof Error ? e.message : e}`);
  }
  return applied;
}

/**
 * Save settings to the data folder and use them at once. Returns false when
 * the install has no disk to write to (nothing is changed then).
 */
export function saveLocalSettings(values: Partial<Record<LocalSettingName, string>>): boolean {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    const text = String(v ?? "").trim();
    if (!ALLOWED.has(k) || !text) continue;
    // A quote or line break cannot be written safely: the caller shows the
    // owner which setting to add by hand instead.
    if (/[\r\n']/.test(text)) return false;
    clean[k] = text;
  }
  if (!Object.keys(clean).length) return true;
  if (!hasWritableDisk()) return false;
  try {
    const file = localSettingsFile();
    const before = existsSync(file) ? readFileSync(file, "utf8") : "";
    const header = "# Saved by the Passive Coder CMS web installer. Keep this file private.\n# A value set in the real environment (.env) wins over the one here.\n";
    writeFileSync(file, mergeEnv(before, clean, { header }), { mode: 0o600 });
    try { chmodSync(file, 0o600); } catch { /* not every file system has modes */ }
    for (const [k, v] of Object.entries(clean)) process.env[k] = v;
    return true;
  } catch (e) {
    console.warn(`[installer] could not save settings: ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

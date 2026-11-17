import { createPublicKey, verify as edVerify, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { LICENCE_FORMAT, LICENCE_VERSION, normalizeDomain, signingBytes, type LicenceFile, type LicencePayload } from "./format";
import { LICENCE_PUBLIC_KEY } from "./public-key";

/*
 * Offline module licence for the self-hosted (standalone) edition.
 *
 * A licence.json signed by Passive Coder (scripts/licence/sign-licence.mjs)
 * turns on the paid modules it lists, for one site: its domain and site id
 * must match this install. Verified here with the embedded public key, with
 * no network call of any kind, so it keeps working if Passive Coder is gone.
 *
 * Where the licence is read from (first one found):
 *   PASSIVECODER_LICENCE       the file's contents (JSON, or the JSON in base64);
 *                              for hosts without a disk, such as Vercel
 *   PASSIVECODER_LICENCE_FILE  a path to the file
 *   ./licence.json             in the app's folder
 *
 * Read once per process and cached: restart the app after installing one.
 * A missing, damaged or wrong licence never throws: the site runs with the
 * core modules only. Hosted (SaaS) mode never calls this (see modules.ts).
 */

export type LicenceState =
  | { state: "missing" }
  | { state: "invalid"; reason: string }
  | { state: "valid"; licence: LicencePayload; source: string };

/** Check one licence file against a public key. Pure: no env, no cache. */
export function verifyLicenceText(text: string, publicKey: KeyObject): { ok: true; licence: LicencePayload } | { ok: false; reason: string } {
  let file: LicenceFile;
  try {
    file = JSON.parse(text) as LicenceFile;
  } catch {
    return { ok: false, reason: "not valid JSON" };
  }
  if (!file || typeof file !== "object" || file.format !== LICENCE_FORMAT) return { ok: false, reason: "not a Passive Coder licence file" };
  if (file.version !== LICENCE_VERSION) return { ok: false, reason: `licence format version ${String(file.version)} is not supported by this version of the app` };
  const l = file.licence;
  if (
    !l || typeof l !== "object" ||
    typeof l.licence_id !== "string" || !l.licence_id ||
    typeof l.domain !== "string" || !l.domain ||
    typeof l.tenant_id !== "string" || !l.tenant_id ||
    typeof l.issued_at !== "string" ||
    !Array.isArray(l.modules) || !l.modules.every((m) => typeof m === "string")
  ) return { ok: false, reason: "licence fields are missing or malformed" };
  if (typeof file.signature !== "string" || !file.signature) return { ok: false, reason: "licence is not signed" };

  let good = false;
  try {
    good = edVerify(null, signingBytes(l), publicKey, Buffer.from(file.signature, "base64url"));
  } catch {
    good = false;
  }
  if (!good) return { ok: false, reason: "signature does not match (the file was changed, or was not issued by Passive Coder)" };
  return { ok: true, licence: l };
}

/** Raw 32-byte Ed25519 key in base64url (or base64) as a KeyObject. */
export function publicKeyFromRaw(raw: string): KeyObject {
  const x = Buffer.from(raw.trim(), raw.includes("+") || raw.includes("/") ? "base64" : "base64url");
  if (x.length !== 32) throw new Error("licence public key must be 32 bytes");
  return createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: x.toString("base64url") }, format: "jwk" });
}

function configuredPublicKey(): KeyObject | null {
  const raw = LICENCE_PUBLIC_KEY.trim() || process.env.PASSIVECODER_LICENCE_PUBLIC_KEY?.trim() || "";
  if (!raw) return null;
  try {
    return publicKeyFromRaw(raw);
  } catch {
    return null;
  }
}

/** Check a licence file's text with this build's public key: no file, no
 *  environment, no cache. The web installer uses it for an uploaded file. */
export function checkLicenceText(text: string): { ok: true; licence: LicencePayload } | { ok: false; reason: string } {
  const key = configuredPublicKey();
  if (!key) return { ok: false, reason: "this build has no licence public key" };
  return verifyLicenceText(text, key);
}

function readLicenceText(): { text: string; source: string } | null {
  const inline = process.env.PASSIVECODER_LICENCE?.trim();
  if (inline) {
    const text = inline.startsWith("{") ? inline : Buffer.from(inline, "base64").toString("utf8");
    return { text, source: "PASSIVECODER_LICENCE" };
  }
  const file = process.env.PASSIVECODER_LICENCE_FILE?.trim() || path.join(process.cwd(), "licence.json");
  try {
    return { text: readFileSync(file, "utf8"), source: file };
  } catch {
    return null;
  }
}

let cached: LicenceState | null = null;

/** The install's licence, checked once per process. Never throws. */
export function loadLicence(): LicenceState {
  if (cached) return cached;
  try {
    const found = readLicenceText();
    if (!found) {
      cached = { state: "missing" };
    } else {
      const key = configuredPublicKey();
      if (!key) {
        cached = { state: "invalid", reason: "this build has no licence public key (see src/lib/licence/public-key.ts)" };
      } else {
        const res = verifyLicenceText(found.text, key);
        cached = res.ok ? { state: "valid", licence: res.licence, source: found.source } : { state: "invalid", reason: res.reason };
      }
    }
  } catch (e) {
    cached = { state: "invalid", reason: e instanceof Error ? e.message : "could not read the licence" };
  }
  if (cached.state === "invalid") console.warn(`[licence] ignored, core modules only: ${cached.reason}`);
  return cached;
}

/** Does the licence belong to this site? Domain is compared with the
 *  install's own address (www. ignored), site id with the site's tenant id. */
export function licenceMatchesSite(licence: LicencePayload, site: { tenantId: string; domains: (string | null | undefined)[] }): boolean {
  if (licence.tenant_id !== site.tenantId) return false;
  const want = normalizeDomain(licence.domain);
  return !!want && site.domains.some((d) => normalizeDomain(d) === want);
}

/** For tests. */
export function clearLicenceCache() {
  cached = null;
}

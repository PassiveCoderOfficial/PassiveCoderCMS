/**
 * Small authenticated encryption box (AES-256-GCM, node:crypto) for secrets
 * we store, such as courier API credentials. The key comes from an env var
 * holding 32 random bytes in base64 (`openssl rand -base64 32`).
 *
 * Sealed text looks like `sb1:<iv>:<tag>:<ciphertext>` (base64url parts),
 * so plain values saved before encryption was switched on are told apart
 * and still read. When the key is missing, sealing stores the value plain
 * with a warning, so nothing breaks; set the key and the next save seals it.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "sb1:";

function keyFrom(envName: string): Buffer | null {
  const raw = process.env[envName]?.trim();
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    console.warn(`[secret-box] ${envName} must be 32 bytes in base64; storing secrets unencrypted`);
    return null;
  }
  return key;
}

export const isSealed = (v: unknown): v is string => typeof v === "string" && v.startsWith(PREFIX);

/** Encrypt a string. Without a valid key returns it unchanged (with a warning). */
export function seal(plain: string, envName = "COURIER_SECRET_KEY"): string {
  const key = keyFrom(envName);
  if (!key) {
    // Self-hosted installs must not store secrets in plain text.
    if (process.env.NEXT_PUBLIC_CMS_MODE !== "saas") {
      throw new Error(`${envName} is required: set it to 32 random bytes in base64 (openssl rand -base64 32).`);
    }
    console.warn(`[secret-box] ${envName} not set; storing secret unencrypted`);
    return plain;
  }
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `${PREFIX}${iv.toString("base64url")}:${c.getAuthTag().toString("base64url")}:${ct.toString("base64url")}`;
}

/** Decrypt a sealed string; a plain (older) value is returned as it is. Throws if sealed but unreadable. */
export function open(value: string, envName = "COURIER_SECRET_KEY"): string {
  if (!isSealed(value)) return value;
  const key = keyFrom(envName);
  if (!key) throw new Error(`${envName} is not set, so a saved secret can't be read`);
  const [ivB, tagB, ctB] = value.slice(PREFIX.length).split(":");
  const d = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB ?? "", "base64url"));
  d.setAuthTag(Buffer.from(tagB ?? "", "base64url"));
  return Buffer.concat([d.update(Buffer.from(ctB ?? "", "base64url")), d.final()]).toString("utf8");
}

/** Store a JSON object of secrets: `{ _sealed: "sb1:..." }`, or the object itself without a key. */
export function sealJson(obj: Record<string, unknown>, envName = "COURIER_SECRET_KEY"): Record<string, unknown> {
  const sealed = seal(JSON.stringify(obj), envName);
  return isSealed(sealed) ? { _sealed: sealed } : obj;
}

/** Read what sealJson stored (or an older plain object). */
export function openJson<T extends Record<string, unknown>>(stored: unknown, envName = "COURIER_SECRET_KEY"): T {
  if (!stored || typeof stored !== "object") return {} as T;
  const s = (stored as Record<string, unknown>)._sealed;
  if (isSealed(s)) return JSON.parse(open(s, envName)) as T;
  return stored as T;
}

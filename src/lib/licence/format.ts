/*
 * Module licence file format (licence.json). Shared shape and the exact bytes
 * that get signed. scripts/licence/licence-core.mjs builds the same bytes;
 * keep the two in step (tests/licence/licence.test.ts checks they agree).
 *
 *   {
 *     "format": "pc-licence",
 *     "version": 1,
 *     "licence": {
 *       "licence_id": "lic_...",
 *       "domain": "example.com",
 *       "tenant_id": "<uuid of the site>",
 *       "modules": ["real_estate", "pos"],
 *       "issued_at": "2026-11-16",
 *       "licensee": "Example Ltd"        (optional)
 *     },
 *     "signature": "<base64url Ed25519 signature>"
 *   }
 */

export const LICENCE_FORMAT = "pc-licence";
export const LICENCE_VERSION = 1;
/** Prefix of the signed message, so a signature can never be reused for
 *  anything else signed with the same key. */
export const LICENCE_SIGNING_PREFIX = "pc-licence-v1\n";

export type LicencePayload = {
  licence_id: string;
  domain: string;
  tenant_id: string;
  modules: string[];
  issued_at: string;
  licensee?: string;
};

export type LicenceFile = {
  format: typeof LICENCE_FORMAT;
  version: number;
  licence: LicencePayload;
  signature: string;
};

/** JSON with object keys sorted at every level: the same value always gives
 *  the same text, whatever order the keys were written in. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function signingBytes(payload: LicencePayload): Buffer {
  return Buffer.from(LICENCE_SIGNING_PREFIX + canonicalJson(payload), "utf8");
}

/** "https://www.Example.com:443/x" -> "example.com". A licence for a domain
 *  covers its www. form too. */
export function normalizeDomain(input: string | null | undefined): string {
  let d = String(input ?? "").trim().toLowerCase();
  d = d.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  d = d.split("/")[0].split("?")[0].split("#")[0];
  d = d.replace(/:\d+$/, "").replace(/\.$/, "");
  if (d.startsWith("www.")) d = d.slice(4);
  return d;
}

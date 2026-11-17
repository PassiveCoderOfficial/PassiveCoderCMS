/**
 * Who may use the installer. Pure: the web routes (src/lib/installer/gate.ts)
 * gather the facts and ask this.
 *
 * - Hosted (SaaS) mode: the installer does not exist (404).
 * - A site exists: the installer is locked for good (409).
 * - SETUP_TOKEN is set: every call must carry the same value.
 * - We cannot tell whether a site exists (database down, wrong key): only
 *   the read-only checks run, so the owner can see what is wrong; nothing
 *   that writes is allowed.
 */
import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time compare (hashing first makes the lengths equal). */
export function sameSecret(a, b) {
  const h = (s) => createHash("sha256").update(String(s)).digest();
  return timingSafeEqual(h(a), h(b));
}

/**
 * @param {{ standalone: boolean, siteExists: boolean|null, setupToken?: string|null, givenToken?: string|null, action: "check"|"write" }} o
 * @returns {{ allow: true } | { allow: false, status: number, reason: "not_found"|"installed"|"token_required"|"token_wrong"|"state_unknown" }}
 */
export function installerGate({ standalone, siteExists, setupToken, givenToken, action }) {
  if (!standalone) return { allow: false, status: 404, reason: "not_found" };
  if (siteExists === true) return { allow: false, status: 409, reason: "installed" };
  const want = String(setupToken ?? "").trim();
  if (want) {
    const got = String(givenToken ?? "").trim();
    if (!got) return { allow: false, status: 401, reason: "token_required" };
    if (!sameSecret(got, want)) return { allow: false, status: 403, reason: "token_wrong" };
  }
  if (siteExists === null && action !== "check") return { allow: false, status: 503, reason: "state_unknown" };
  return { allow: true };
}

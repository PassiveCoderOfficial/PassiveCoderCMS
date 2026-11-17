/**
 * One Docker image for every site.
 *
 * Next.js writes NEXT_PUBLIC_* settings into the built code. A normal build
 * therefore works for one site only, and building needs about 8 GB of memory:
 * more than most small servers have. The ready-made image is built instead
 * with the placeholder values below (Dockerfile, PC_GENERIC=1). When the
 * container starts, selfhost/docker-entrypoint.mjs swaps every placeholder in
 * the built files for the site's real value from .env, then starts the app.
 * Changing a value later only needs a restart, never a rebuild.
 *
 * Pure (no file access): the entrypoint and the tests share it.
 */

/** Placeholders the generic image is built with. Long, unique, and made of
 *  characters that never need escaping in JS, JSON or HTML. */
export const PLACEHOLDERS = {
  NEXT_PUBLIC_SUPABASE_URL: "https://pcplaceholdersupabase.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "pcplaceholder_supabase_public_key",
  NEXT_PUBLIC_ROOT_DOMAIN: "pcplaceholderrootdomain.invalid",
  NEXT_PUBLIC_APP_URL: "https://pcplaceholderappurl.invalid",
};

/** Text that marks a file as holding at least one placeholder. */
export const MARKER = "pcplaceholder";

const hostOf = (u) => {
  try { return new URL(u).host; } catch { return ""; }
};

/** Characters the real values may hold. Anything else is refused, so a value
 *  can never break out of the JS string or JSON it is put into. */
const SAFE = /^[A-Za-z0-9._~:/?#@!$&()*+,;=%-]+$/;

/**
 * The real values to put in, checked.
 * @param {Record<string, string|undefined>} env
 * @returns {{ ok: true, values: Record<string,string> } | { ok: false, missing: string[], invalid: string[] }}
 */
export function runtimeValues(env) {
  const values = {};
  const missing = [];
  const invalid = [];
  for (const k of Object.keys(PLACEHOLDERS)) {
    let v = String(env[k] ?? "").trim();
    if (k === "NEXT_PUBLIC_SUPABASE_URL" || k === "NEXT_PUBLIC_APP_URL") v = v.replace(/\/+$/, "");
    if (!v) missing.push(k);
    else if (!SAFE.test(v) || v.includes(MARKER)) invalid.push(k);
    else values[k] = v;
  }
  for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_APP_URL"]) {
    if (values[k] && !/^https?:\/\/[^/]+$/.test(values[k])) { invalid.push(k); delete values[k]; }
  }
  return missing.length || invalid.length ? { ok: false, missing, invalid } : { ok: true, values };
}

/**
 * Every (from, to) pair, longest first: the full URLs, then their bare host
 * names (Next.js also stores the Supabase host on its own, for images), then
 * the regex-escaped forms of those hosts that some manifests hold.
 */
export function replacementPairs(values) {
  const pairs = [];
  for (const [k, placeholder] of Object.entries(PLACEHOLDERS)) {
    const real = values[k];
    if (!real) continue;
    pairs.push([placeholder, real]);
    if (/^https?:\/\//.test(placeholder)) {
      const ph = hostOf(placeholder);
      const rh = hostOf(real);
      pairs.push([ph, rh]);
      // "a\.b" (a regex in JS) and "a\\.b" (the same regex inside JSON).
      pairs.push([ph.replace(/\./g, "\\\\."), rh.replace(/\./g, "\\\\.")]);
      pairs.push([ph.replace(/\./g, "\\."), rh.replace(/\./g, "\\.")]);
    }
  }
  return pairs.sort((a, b) => b[0].length - a[0].length);
}

/** Put the real values into one file's text. */
export function applyValues(text, pairs) {
  let out = text;
  for (const [from, to] of pairs) if (out.includes(from)) out = out.split(from).join(to);
  return out;
}

/** A short fingerprint of the values, so a restart with the same settings
 *  does no work. */
export function valuesStamp(values) {
  return Object.keys(PLACEHOLDERS).map((k) => `${k}=${values[k] ?? ""}`).join("\n");
}

/** Built files that may hold settings (code, data, pages). */
export function isTextAsset(file) {
  return /\.(m?js|cjs|json|html|rsc|body|meta|txt|map|css)$/i.test(file);
}

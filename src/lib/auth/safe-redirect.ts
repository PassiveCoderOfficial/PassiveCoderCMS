/**
 * Where to send someone after sign-in, taken from a query parameter
 * (?redirect=, ?next=). Only a path on the site they are already on is
 * accepted: it must start with exactly one "/", so "javascript:..." links,
 * other sites ("https://evil.com", "//evil.com", "/\evil.com") and host
 * tricks ("@evil.com", ".evil.com" glued onto the origin) all fall back to
 * the default. No dependencies: used by the proxy, routes and client forms.
 */
export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2000) return fallback;
  // One leading slash only; browsers read "/\" the same as "//".
  if (value[0] !== "/" || value[1] === "/" || value[1] === "\\") return fallback;
  // Backslashes and control characters (tab/newline are dropped by URL
  // parsers, which can turn "/\t/evil.com" into "//evil.com").
  if (value.includes("\\") || /[\x00-\x1f\x7f]/.test(value)) return fallback;
  // Belt and braces: it must still be this origin once a URL parser has read it.
  try {
    const base = "http://safe-redirect.invalid";
    if (new URL(value, base).origin !== base) return fallback;
  } catch {
    return fallback;
  }
  return value;
}

/**
 * Validates a `returnTo` query param before it is used for navigation.
 *
 * The value arrives in a URL the user can edit, so it is untrusted. Anything
 * that is not a plain internal dashboard path is discarded rather than
 * sanitized: allowing "//evil.com" or "https://evil.com" through would turn
 * every "back to your page" button into an open redirect, and protocol-relative
 * URLs are the easy one to miss because they look path-like.
 */
export function safeReturnTo(raw: string | undefined | null): string | null {
  if (!raw) return null;

  // Must be a single-slash-rooted path. This rejects absolute URLs with a
  // scheme and protocol-relative "//host" in one check.
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;

  // Backslashes are treated as slashes by some browsers when resolving, so
  // "/\evil.com" can escape the origin. Reject rather than rewrite.
  if (raw.includes("\\")) return null;

  // Confine to the dashboard. There is no legitimate reason for this round
  // trip to land anywhere else, and a narrow allowlist ages better than a
  // blocklist of things that turned out to be dangerous.
  const path = raw.split("?")[0].split("#")[0];
  if (path !== "/dashboard" && !path.startsWith("/dashboard/")) return null;

  return raw;
}

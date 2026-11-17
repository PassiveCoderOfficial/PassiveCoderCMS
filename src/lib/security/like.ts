/**
 * A value for .ilike() / .like() that must match literally.
 *
 * "%" and "_" are wildcards in LIKE, and both are legal in an email address
 * ("a_b@example.com"), so an address typed by a user and passed straight to
 * .ilike("email", ...) can match someone else's row ("a_b" also matches
 * "axb"). Escaped, .ilike() is a case-insensitive exact match, which is what
 * every "find the account with this email" lookup means.
 *
 * No imports: unit-tested in tests/platform/style-text.test.ts.
 */
export function likeExact(value: string): string {
  return String(value ?? "").replace(/[\\%_]/g, (c) => "\\" + c);
}

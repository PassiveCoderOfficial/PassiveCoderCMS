/**
 * After-sign-in redirects (?redirect=, ?next=): only a path on the same site.
 * Run: npx tsx --test tests/platform/safe-redirect.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { safeRedirectPath } from "../../src/lib/auth/safe-redirect";

const FALLBACK = "/dashboard";
const safe = (v: string | null | undefined) => safeRedirectPath(v, FALLBACK);

test("same-site paths pass through unchanged", () => {
  for (const ok of [
    "/dashboard",
    "/dashboard/pages/123?tab=seo#top",
    "/partners/apply?type=agency&lang=bn",
    "/oauth/authorize?client_id=abc&redirect_uri=https%3A%2F%2Fclaude.ai%2Fcb",
    "/api-signup?finish=1",
    "/invoices/9f0c",
    "/",
  ]) assert.equal(safe(ok), ok, ok);
});

test("missing or empty values use the fallback", () => {
  assert.equal(safe(null), FALLBACK);
  assert.equal(safe(undefined), FALLBACK);
  assert.equal(safe(""), FALLBACK);
  assert.equal(safeRedirectPath(null, "/staff"), "/staff");
});

test("script and data links are refused", () => {
  for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(document.cookie)", " javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:x"]) {
    assert.equal(safe(bad), FALLBACK, bad);
  }
});

test("other sites are refused, however they are spelled", () => {
  for (const bad of [
    "https://evil.com",
    "http://evil.com/dashboard",
    "//evil.com",
    "//evil.com/dashboard",
    "/\\evil.com",
    "/\\/evil.com",
    "\\\\evil.com",
    "/dashboard\\..\\..\\evil.com",
    "@evil.com",
    ".evil.com",
    "evil.com",
    "dashboard",
    "?next=/x",
  ]) assert.equal(safe(bad), FALLBACK, bad);
});

test("control characters are refused (parsers drop tab and newline)", () => {
  for (const bad of ["/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "/dashboard\u0000", "/a\u007f", "\t/dashboard"]) {
    assert.equal(safe(bad), FALLBACK, JSON.stringify(bad));
  }
});

test("an accepted path always stays on the origin it is joined to", () => {
  for (const v of ["/dashboard", "/a/..//evil.com", "/%2F%2Fevil.com", "/x?u=https://evil.com", "/@evil.com", "/.evil.com"]) {
    const out = safe(v);
    assert.equal(new URL(out, "https://site.example").origin, "https://site.example", v);
    assert.equal(new URL(`https://site.example${out}`).origin, "https://site.example", v);
  }
});

test("very long values are refused", () => {
  assert.equal(safe("/" + "a".repeat(3000)), FALLBACK);
});

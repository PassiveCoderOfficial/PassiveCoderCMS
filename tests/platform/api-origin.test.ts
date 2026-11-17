/**
 * Cross-site check on API writes (lib/security/api-origin.ts, used by the
 * proxy), the proxy wiring, and the outbound-fetch address rules.
 * Run: npx tsx --test tests/platform/api-origin.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { apiOriginVerdict, hostnameOf, type ApiOriginInput } from "../../src/lib/security/api-origin";
import { privateIp } from "../../src/lib/safe-fetch";
import { ownStorageUrl } from "../../src/lib/backup/files-zip";

const base: ApiOriginInput = {
  method: "POST",
  pathname: "/api/pages",
  origin: "https://evil.example",
  hasCookies: true,
  requestHosts: ["acme.example.com"],
  rootDomain: "example.com",
};
const verdict = (over: Partial<ApiOriginInput>) => apiOriginVerdict({ ...base, ...over }).verdict;

test("a write with cookies from someone else's site is not allowed outright", () => {
  assert.deepEqual(apiOriginVerdict(base), { verdict: "lookup", host: "evil.example" });
  assert.equal(verdict({ method: "DELETE" }), "lookup");
  assert.equal(verdict({ method: "put" }), "lookup");
  assert.equal(verdict({ method: "PATCH" }), "lookup");
});

test("no Origin header always passes: mobile apps, webhooks, cron, the WordPress plugin", () => {
  assert.equal(verdict({ origin: null }), "allow");
  assert.equal(verdict({ origin: undefined }), "allow");
  assert.equal(verdict({ origin: "" }), "allow");
});

test("no cookies always passes: Bearer and API-key callers have nothing to ride on", () => {
  assert.equal(verdict({ hasCookies: false }), "allow");
  assert.equal(verdict({ hasCookies: false, origin: "null" }), "allow");
});

test("reads and non-API paths are never checked", () => {
  for (const method of ["GET", "HEAD", "OPTIONS", "get"]) assert.equal(verdict({ method }), "allow", method);
  assert.equal(verdict({ pathname: "/dashboard/pages" }), "allow");
  assert.equal(verdict({ pathname: "/apix/pages" }), "allow");
});

test("same host passes: custom domains, partner dashboards, localhost, self-hosted installs", () => {
  assert.equal(verdict({ origin: "https://acme.example.com" }), "allow");
  assert.equal(verdict({ origin: "https://www.shop-example.org", requestHosts: ["www.shop-example.org"] }), "allow");
  assert.equal(verdict({ origin: "http://localhost:3000", requestHosts: ["localhost:3000"], rootDomain: "localhost:3000" }), "allow");
  assert.equal(verdict({ origin: "http://acme.localhost:3000", requestHosts: ["acme.localhost:3000"], rootDomain: "localhost:3000" }), "allow");
  // Behind a reverse proxy the Host may be internal; the forwarded host counts too.
  assert.equal(verdict({ origin: "https://shop.example.org", requestHosts: ["127.0.0.1:3000", "shop.example.org"], rootDomain: "shop.example.org" }), "allow");
  assert.equal(verdict({ origin: "https://ACME.example.com", requestHosts: ["Acme.Example.com:443"] }), "allow");
});

test("another site's subdomain cannot write to this site or to the platform's own hosts", () => {
  // Every site has a subdomain and they share the sign-in cookie.
  for (const origin of ["https://other.example.com", "https://a.b.example.com", "https://experts.example.com", "http://other.example.com"]) {
    assert.equal(verdict({ origin }), "deny", origin);
    assert.equal(verdict({ origin, requestHosts: ["example.com"] }), "deny", origin);
    assert.equal(verdict({ origin, requestHosts: ["www.example.com"], appHost: "www.example.com" }), "deny", origin);
  }
  // Its own host is still fine, whichever subdomain that is.
  assert.equal(verdict({ origin: "https://experts.example.com", requestHosts: ["experts.example.com"] }), "allow");
  assert.equal(verdict({ origin: "https://other.example.com", requestHosts: ["other.example.com"] }), "allow");
});

test("the platform's own hosts may call each other, and only each other", () => {
  const hosts = ["example.com", "www.example.com", "app.example.net"];
  for (const from of hosts) for (const to of hosts) {
    assert.equal(verdict({ origin: `https://${from}`, requestHosts: [to], appHost: "app.example.net" }), "allow", `${from} -> ${to}`);
  }
  // The platform's pages do not write to a site's API across hosts...
  for (const from of hosts) assert.equal(verdict({ origin: `https://${from}`, appHost: "app.example.net" }), "deny", from);
  // ...and the app URL's host counts as a platform host only when it is configured.
  assert.equal(verdict({ origin: "https://app.example.net", requestHosts: ["example.com"] }), "lookup");
});

test("look-alike hosts do not count as the root domain", () => {
  for (const origin of ["https://evilexample.com", "https://example.com.evil.test", "https://example.co", "https://example.com.evil.test:443"]) {
    assert.equal(verdict({ origin }), "lookup", origin);
  }
});

test("opaque and non-web origins are refused", () => {
  for (const origin of ["null", "file://", "chrome-extension://abcdef", "not a url", "javascript:alert(1)"]) {
    assert.equal(verdict({ origin }), "deny", origin);
  }
});

test("endpoints other sites call from a browser are exempt", () => {
  for (const pathname of [
    "/api/payments/sslcommerz/success", "/api/payments/sslcommerz/fail", "/api/payments/sslcommerz/cancel", "/api/payments/sslcommerz/ipn",
    "/api/billing/dodo/webhook", "/api/webhooks/pathao", "/api/webhooks/steadfast", "/api/github/webhook",
    "/api/mcp", "/api/oauth/token", "/api/oauth/register", "/api/cron/backups", "/api/v1/contacts",
  ]) {
    assert.equal(verdict({ pathname }), "allow", pathname);
    assert.equal(verdict({ pathname, origin: "null" }), "allow", pathname);
  }
  // Only those: neighbours with similar names are still checked.
  for (const pathname of ["/api/billing/dodo/cancel", "/api/mcp-tokens", "/api/users/password", "/api/webhooksx"]) {
    assert.equal(verdict({ pathname }), "lookup", pathname);
  }
});

test("hostnameOf drops the port and case", () => {
  assert.equal(hostnameOf("Example.com:8080"), "example.com");
  assert.equal(hostnameOf("[::1]:3000"), "[::1]");
  assert.equal(hostnameOf(""), null);
  assert.equal(hostnameOf(null), null);
});

test("proxy: the check runs for /api, and image-like API paths get no early return", () => {
  const src = readFileSync("src/proxy.ts", "utf8");
  assert.match(src, /if \(!isApiPath && FILE_EXT\.test\(pathname\)\)/);
  assert.match(src, /if \(isApiPath\) \{\s*const blocked = await crossSiteApiWrite\(request\);/);
  // "api" is no longer a pass-through public directory.
  assert.doesNotMatch(src, /PUBLIC_DIR = [^\n]*\|api\|/);
  // A single-site install must not treat every origin as a known custom domain.
  assert.match(src, /v\.verdict === "lookup" && isSaaS/);
  // A custom domain may only write to its own site, not to any site it names.
  assert.match(src, /if \(from && to && from\.id === to\.id\) return null;/);
  assert.doesNotMatch(src, /resolveBrandHost\(v\.host\)/);
});

test("outbound fetch: private, loopback and link-local addresses are refused", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1",
    "::1", "::", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:a9fe:a9fe", "not-an-ip"]) {
    assert.equal(privateIp(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "172.32.0.1", "104.18.0.1", "2606:4700::1111", "::ffff:8.8.8.8"]) assert.equal(privateIp(ip), false, ip);
});

test("backup: only this install's public storage counts as its own", () => {
  const S = "https://abc.supabase.co";
  assert.equal(ownStorageUrl(`${S}/storage/v1/object/public/media/t1/a.jpg`, S), `${S}/storage/v1/object/public/media/t1/a.jpg`);
  assert.equal(ownStorageUrl("/media/t1/a.jpg?v=3", S), `${S}/storage/v1/object/public/media/t1/a.jpg?v=3`);
  for (const other of [
    "http://169.254.169.254/latest/meta-data/",
    "http://localhost:5432/",
    "https://abc.supabase.co.evil.example/storage/v1/object/public/media/a.jpg",
    "https://user@abc.supabase.co/storage/v1/object/public/media/a.jpg",
    "http://abc.supabase.co/storage/v1/object/public/media/a.jpg",
    `${S}/rest/v1/tenants`,
    `${S}/storage/v1/object/public/../../../rest/v1/tenants`,
    "/media/../../../rest/v1/tenants",
    "//evil.example/media/a.jpg",
    "/dashboard",
    "",
  ]) assert.equal(ownStorageUrl(other, S), null, other);
  assert.equal(ownStorageUrl(`${S}/storage/v1/object/public/media/a.jpg`, null), null);
});

/**
 * Per-IP rate limit used by the public form routes. Run: npm run test:platform
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimited, tooMany, clientIp } from "../../src/lib/rate-limit";

test("allows max hits in the window, then blocks", () => {
  const key = `t:${Math.random()}`;
  for (let i = 0; i < 5; i++) assert.equal(rateLimited(key, 5, 60_000), false, `hit ${i + 1}`);
  assert.equal(rateLimited(key, 5, 60_000), true, "6th hit blocked");
});

test("keys are independent and the window resets", async () => {
  const a = `a:${Math.random()}`, b = `b:${Math.random()}`;
  assert.equal(rateLimited(a, 1, 50), false);
  assert.equal(rateLimited(a, 1, 50), true);
  assert.equal(rateLimited(b, 1, 50), false, "other key unaffected");
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(rateLimited(a, 1, 50), false, "window passed");
});

test("tooMany reads the forwarded IP and answers 429 with Retry-After", async () => {
  const scope = `s:${Math.random()}`;
  const req = (ip: string) => new Request("https://x.test/api/contact", { method: "POST", headers: { "x-forwarded-for": `${ip}, 10.0.0.1` } });
  assert.equal(clientIp(req("1.2.3.4")), "1.2.3.4");
  assert.equal(tooMany(req("1.2.3.4"), scope, 2), null);
  assert.equal(tooMany(req("1.2.3.4"), scope, 2), null);
  const r = tooMany(req("1.2.3.4"), scope, 2);
  assert.equal(r?.status, 429);
  assert.ok(r?.headers.get("Retry-After"));
  assert.equal(tooMany(req("5.6.7.8"), scope, 2), null, "another IP is fine");
});

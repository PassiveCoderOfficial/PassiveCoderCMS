import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emailKey, isBotSubmission, looksRandom, phoneKey, pickBlock, senderKeys, type BlockRow,
} from "../../src/lib/spam/rules";

const rule = (r: Partial<BlockRow>): BlockRow => ({ id: "1", tenant_id: "t1", kind: "email", value: "a@b.co", effect: "block", expires_at: null, hits: 0, ...r });

test("one mailbox, one key: gmail dots and tags don't make a new person", () => {
  assert.equal(emailKey("Jane.Q.Doe+shop@Gmail.com"), "janeqdoe@gmail.com");
  assert.equal(emailKey("janeqdoe@googlemail.com"), "janeqdoe@gmail.com");
  assert.equal(emailKey("sami.khan@company.com"), "sami.khan@company.com");
  assert.equal(emailKey("nonsense"), null);
  assert.equal(emailKey(null), null);
});

test("local and international spellings of a phone match", () => {
  assert.equal(phoneKey("01711-223344"), phoneKey("+880 1711 223344"));
  assert.equal(phoneKey("123"), null);
});

test("sender keys skip what is missing and an unknown ip", () => {
  assert.deepEqual(senderKeys({ ip: "unknown", session: "s1" }), [{ kind: "visitor", value: "s1" }]);
  assert.deepEqual(senderKeys({}), []);
});

test("random letters are caught; real names and words are not", () => {
  assert.equal(looksRandom("HvDgeyDtVYhfSOPOwoFNhJX"), true);
  assert.equal(looksRandom("QcIzZpMVDZOurqIpWyk"), true);
  assert.equal(looksRandom("Muhammad Abdur Rahman"), false);
  assert.equal(looksRandom("Internationalization"), false);
  assert.equal(looksRandom("McDonaldsBurger"), false);
  assert.equal(looksRandom("PassiveCoder"), false);
  assert.equal(looksRandom(42), false);
});

test("bot pattern: two random fields, or one with a dot-padded gmail", () => {
  assert.equal(isBotSubmission({ Name: "gAHiFvQnjSwhhTqfp", Message: "PzxQYHBhlnPbKFwBAnIZIb", Email: "a.b.a.qezux.o.t.i003@gmail.com" }), true);
  assert.equal(isBotSubmission({ Email: "jo.undpr.ek.s.50@gmail.com", Message: "ZKcBkKnbAiFIUUiv", Product: "Kampung Eggs" }), true);
  assert.equal(isBotSubmission({ Name: "Rahim Uddin", Email: "r.u.uddin@gmail.com", Message: "Did you get my message?" }), false);
  assert.equal(isBotSubmission({ Name: "gAHiFvQnjSwhhTqfp", Email: "real@company.com" }), false);
  assert.equal(isBotSubmission({ Email: "someone@gmail.com" }), false);
});

test("pickBlock: matches kind and value, ignores expired, and a site allow beats a global block", () => {
  const keys = [{ kind: "email" as const, value: "a@b.co" }];
  assert.equal(pickBlock([], keys), null);
  assert.equal(pickBlock([rule({ kind: "phone" })], keys), null);
  assert.equal(pickBlock([rule({})], keys)?.id, "1");
  const now = new Date("2026-10-31T00:00:00Z");
  assert.equal(pickBlock([rule({ expires_at: "2026-10-30T00:00:00Z" })], keys, now), null);
  assert.equal(pickBlock([rule({ expires_at: "2026-11-30T00:00:00Z" })], keys, now)?.id, "1");
  assert.equal(pickBlock([rule({ tenant_id: null }), rule({ id: "2", effect: "allow" })], keys), null);
});

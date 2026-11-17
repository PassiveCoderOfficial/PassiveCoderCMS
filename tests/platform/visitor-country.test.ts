import { test } from "node:test";
import assert from "node:assert/strict";
import { pickCountry } from "../../src/lib/pricing/visitor-country";

test("cookie beats geo header", () => {
  const v = pickCountry({ cookie: "SG", header: "AE" });
  assert.equal(v.country.code, "SG");
  assert.equal(v.currency, "SGD");
  assert.equal(v.source, "cookie");
});

test("geo header used when no cookie", () => {
  const v = pickCountry({ cookie: null, header: "ae" });
  assert.equal(v.country.code, "AE");
  assert.equal(v.currency, "AED");
  assert.equal(v.source, "geo");
});

test("Bangladesh visitor gets taka", () => {
  assert.equal(pickCountry({ header: "BD" }).currency, "BDT");
});

test("unknown or unpriced country falls back to USD", () => {
  for (const h of ["DE", "IN", "", null, undefined, "US"]) {
    const v = pickCountry({ header: h });
    assert.equal(v.currency, "USD", `header ${h}`);
    assert.equal(v.country.code, "US");
  }
  assert.equal(pickCountry({ header: "US" }).source, "default");
});

test("a bad cookie is ignored and geo still applies", () => {
  const v = pickCountry({ cookie: "XX", header: "MY" });
  assert.equal(v.currency, "MYR");
  assert.equal(v.source, "geo");
});

test("cookie US means the visitor chose the international list", () => {
  const v = pickCountry({ cookie: "US", header: "AE" });
  assert.equal(v.currency, "USD");
  assert.equal(v.source, "cookie");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { hreflangFor, locateRootSlug, langForRootSlug, switcherAlternates } from "../../src/lib/pricing/hreflang";

test("locates country, language and sub page from a slug", () => {
  assert.deepEqual(locateRootSlug("ae"), { country: "AE", lang: "en", rest: "" });
  assert.deepEqual(locateRootSlug("ae/ar"), { country: "AE", lang: "ar", rest: "" });
  assert.deepEqual(locateRootSlug("ae/ar/cleaning-website"), { country: "AE", lang: "ar", rest: "cleaning-website" });
  assert.deepEqual(locateRootSlug("ae/cleaning-website"), { country: "AE", lang: "en", rest: "cleaning-website" });
  assert.deepEqual(locateRootSlug("sa/ar"), { country: "SA", lang: "ar", rest: "" });
  assert.deepEqual(locateRootSlug("sa"), { country: "SA", lang: "en", rest: "" });
  assert.deepEqual(locateRootSlug("sg/movers-website"), { country: "SG", lang: "en", rest: "movers-website" });
  assert.deepEqual(locateRootSlug("home"), { country: null, lang: "en", rest: "" });
  assert.deepEqual(locateRootSlug("bn/home"), { country: null, lang: "bn", rest: "" });
  assert.deepEqual(locateRootSlug("bn/pricing"), { country: null, lang: "bn", rest: "pricing" });
  assert.deepEqual(locateRootSlug("pricing"), { country: null, lang: "en", rest: "pricing" });
});

test("Saudi home is Arabic, its /en twin is English", () => {
  assert.equal(langForRootSlug("sa/ar"), "ar");
  assert.equal(langForRootSlug("sa"), "en");
  assert.equal(langForRootSlug("ae/ar"), "ar");
});

test("country home lists both languages and x-default = /", async () => {
  const h = await hreflangFor("ae/ar");
  assert.deepEqual(h, { "en-AE": "/ae", "ar-AE": "/ae/ar", "x-default": "/" });
  const sa = await hreflangFor("sa");
  assert.deepEqual(sa, { "en-SA": "/sa", "ar-SA": "/sa/ar", "x-default": "/" });
});

test("service page pairs with its translation; x-default is the global page when it exists", async () => {
  const exists = async (s: string) => ["ae/cleaning-website", "ae/ar/cleaning-website", "cleaning-website"].includes(s);
  const h = await hreflangFor("ae/cleaning-website", exists);
  assert.deepEqual(h, { "en-AE": "/ae/cleaning-website", "ar-AE": "/ae/ar/cleaning-website", "x-default": "/cleaning-website" });
  const missing = await hreflangFor("ae/cleaning-website", async (s) => s === "ae/cleaning-website");
  assert.deepEqual(missing, { "en-AE": "/ae/cleaning-website", "x-default": "/" });
});

test("global home and /bn list every published country home", async () => {
  const exists = async (s: string) => ["home", "bn/home", "sg", "ae", "ae/ar"].includes(s);
  const h = await hreflangFor("home", exists);
  assert.deepEqual(h, { "x-default": "/", en: "/", "bn-BD": "/bn", "en-AE": "/ae", "ar-AE": "/ae/ar", "en-SG": "/sg" });
  assert.deepEqual(await hreflangFor("bn/home", exists), h);
});

test("switcher shows only this page's own languages", async () => {
  const all = await hreflangFor("home", async () => true);
  assert.deepEqual(switcherAlternates("home", all), { en: "/", bn: "/bn" });
  assert.deepEqual(switcherAlternates("sa", await hreflangFor("sa")), { en: "/sa", ar: "/sa/ar" });
});

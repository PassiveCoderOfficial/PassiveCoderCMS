/**
 * Map location: every Google Maps format a person can paste, the embed URL
 * we save, the byte-for-byte rule for maps that already render, and the
 * server-side share-link resolver (fake fetch, no network).
 * Run: npx tsx --test tests/maps/parse-google-link.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGoogleMapsInput, parseCoordText, looksLikeMapLink, isGoogleHost, isResolveFetchHost } from "../../src/lib/maps/parse-google-link";
import { keylessEmbedUrl, mapEmbedSrc, googleMapLinks, openInGoogleMapsUrl, readSavedMap, shortLinkEmbedPath, locationFromParsed } from "../../src/lib/maps/embed";

// "server-only" is supplied by Next's bundler, not installed: stub it for the resolver.
const loader = require("node:module") as { _load: (request: string, ...rest: unknown[]) => unknown };
const load = loader._load;
loader._load = (request, ...rest) => (request === "server-only" ? {} : load(request, ...rest));

const p = (s: string) => parseGoogleMapsInput(s);

/* ------------------------------------------------------------- share links */

test("share links are returned for the server to resolve", () => {
  assert.deepEqual(p("https://maps.app.goo.gl/uF9nNvnfwPy15giM7"), { kind: "short", shortUrl: "https://maps.app.goo.gl/uF9nNvnfwPy15giM7" });
  // Saved without https (seen on a live site), phone share suffix kept.
  assert.deepEqual(p("maps.app.goo.gl/FfdHQ82tWjFn5XGT6?g_st=ac"), { kind: "short", shortUrl: "https://maps.app.goo.gl/FfdHQ82tWjFn5XGT6?g_st=ac" });
  assert.deepEqual(p("http://maps.app.goo.gl/AbC123"), { kind: "short", shortUrl: "https://maps.app.goo.gl/AbC123" });
  assert.deepEqual(p("https://goo.gl/maps/AbCdEf123"), { kind: "short", shortUrl: "https://goo.gl/maps/AbCdEf123" });
  assert.equal(p("https://g.page/r/CQx-example/review")?.kind, "short");
  // A phone share is the place name plus the link.
  assert.deepEqual(p("Example Trading LLC\nhttps://maps.app.goo.gl/AbC123?g_st=iw"), { kind: "short", shortUrl: "https://maps.app.goo.gl/AbC123?g_st=iw" });
  // goo.gl without /maps is some other short link.
  assert.equal(p("https://goo.gl/abc"), null);
  assert.equal(p("https://maps.app.goo.gl/"), null);
});

/* ------------------------------------------------------------- place pages */

test("desktop place URL: the !3d!4d pin wins over the @ camera; name, zoom and place id read", () => {
  const r = p("https://www.google.com/maps/place/Marina+Bay+Sands/@1.2847,103.8580,17z/data=!3m1!4b1!4m6!3m5!1s0x31da1911f12c9a6f:0x8b9a9d1f2b4f1e2a!8m2!3d1.2836!4d103.8607!16s%2Fm%2F0bwd3pb?entry=ttu");
  assert.deepEqual(r, { kind: "place", lat: 1.2836, lng: 103.8607, zoom: 17, label: "Marina Bay Sands", cid: "10059525474881576490" });
});

test("resolved desktop share link (metres camera) reads the pin and an approximate zoom", () => {
  const r = p("https://www.google.com/maps/place/117+Defu+Lane+10,+Singapore+539229/@1.3558836,103.8927397,759m/data=!3m2!1e3!4b1!4m6!3m5!1s0x31da17c847477c4d:0xdcded7d1b0114d3b!8m2!3d1.3558836!4d103.8927397!16s%2Fg%2F11c43xqxjv?entry=tts&g_ep=EgoyMDI2MDgwNS4xIPu8ASoASAFQAw%3D%3D&skid=e2422562");
  assert.deepEqual(r, { kind: "place", lat: 1.3558836, lng: 103.8927397, zoom: 18, label: "117 Defu Lane 10, Singapore 539229", cid: "15915395428775972155" });
});

test("resolved phone share link: name and place id, no coordinates", () => {
  const r = p("https://www.google.com/maps/place/785J%2BGPW+Example+Trading+LLC+-+Al+Ittihad+Rd+-+Deira+-+Dubai/data=!4m2!3m1!1s0x3e5f5d0022ec6e31:0x4fc51ed73054377b!18m1!1e1?utm_source=mstt_1&entry=gps&coh=192189");
  assert.deepEqual(r, { kind: "place", label: "785J+GPW Example Trading LLC - Al Ittihad Rd - Deira - Dubai", cid: "5748034408985933691" });
  assert.equal(keylessEmbedUrl(r), "https://www.google.com/maps?cid=5748034408985933691&output=embed");
});

test("place URL without data uses the camera as the pin", () => {
  assert.deepEqual(p("https://www.google.com.sg/maps/place/Merlion+Park/@1.2868,103.8545,17z"), { kind: "coords", lat: 1.2868, lng: 103.8545, zoom: 17, label: "Merlion Park" });
});

test("dropped-pin share: the name is DMS coordinates, the pin is exact", () => {
  const r = p("https://www.google.com/maps/place/1%C2%B017'01.0%22N+103%C2%B051'38.5%22E/@1.2836111,103.8584751,17z/data=!3m1!4b1!4m4!3m3!8m2!3d1.2836111!4d103.8606944");
  assert.deepEqual(r, { kind: "coords", lat: 1.2836111, lng: 103.8606944, zoom: 17 });
});

test("encoded place names decode (Arabic, accents, ampersand, plus, broken escapes)", () => {
  assert.equal(p("https://www.google.com/maps/place/%D8%A8%D8%B1%D8%AC+%D8%AE%D9%84%D9%8A%D9%81%D8%A9/@25.197,55.274,17z")?.label, "برج خليفة");
  assert.equal(p("https://www.google.com/maps/place/Caf%C3%A9+de+Flore/@48.854,2.333,18z")?.label, "Café de Flore");
  assert.equal(p("https://www.google.com/maps/place/Tom+%26+Jerry+Tools/@1.3,103.8,16z")?.label, "Tom & Jerry Tools");
  assert.equal(p("https://www.google.com/maps/place/Unit+%2312-01+Tower/@1.3,103.8,16z")?.label, "Unit #12-01 Tower");
  assert.equal(p("https://www.google.com/maps/place/Bad%E0%A4+Name/@1.3,103.8,16z")?.label, "Bad%E0%A4 Name");
});

/* ------------------------------------------------------------ query forms */

test("?q= with coordinates, loc:, a label in brackets, or an address", () => {
  assert.deepEqual(p("https://www.google.com/maps?q=1.2836,103.8607"), { kind: "coords", lat: 1.2836, lng: 103.8607 });
  assert.deepEqual(p("https://maps.google.com/maps?q=loc:1.2836+103.8607&z=15"), { kind: "coords", lat: 1.2836, lng: 103.8607, zoom: 15 });
  assert.deepEqual(p("https://maps.google.com/maps?q=1.2836,103.8607+(Head+Office)"), { kind: "coords", lat: 1.2836, lng: 103.8607, label: "Head Office" });
  assert.deepEqual(p("https://maps.google.com/?q=67+Ubi+Crescent,+Singapore+408560"), { kind: "query", label: "67 Ubi Crescent, Singapore 408560" });
  assert.deepEqual(p("https://maps.google.ae/maps?q=Dubai%20Mall&hl=en"), { kind: "query", label: "Dubai Mall" });
  // A place_id search alone cannot be shown without an API key.
  assert.equal(p("https://www.google.com/maps/place/?q=place_id:ChIJexample123"), null);
});

test("search pages: words stay words (the camera is not the place), coordinates are a pin", () => {
  assert.deepEqual(p("https://www.google.com/maps/search/marina+bay+sands/@1.28,103.85,15z"), { kind: "query", zoom: 15, label: "marina bay sands" });
  assert.deepEqual(p("https://www.google.com/maps/search/1.2836,+103.8607?entry=tts"), { kind: "coords", lat: 1.2836, lng: 103.8607 });
  assert.deepEqual(p("https://www.google.com/maps/search/?api=1&query=Gardens%20by%20the%20Bay"), { kind: "query", label: "Gardens by the Bay" });
  assert.deepEqual(p("https://www.google.com/maps/search/?api=1&query=1.2816%2C103.8636"), { kind: "coords", lat: 1.2816, lng: 103.8636 });
  assert.deepEqual(p("https://www.google.com/maps/search/?api=1&query=Example+Cafe&query_place_id=ChIJexample"), { kind: "query", label: "Example Cafe" });
  assert.deepEqual(p("https://www.google.com/search?q=example+trading+llc+dubai"), { kind: "query", label: "example trading llc dubai" });
});

test("map views: plain camera, street view, satellite metres", () => {
  assert.deepEqual(p("https://www.google.com/maps/@1.2838,103.8591,15z?entry=ttu"), { kind: "coords", lat: 1.2838, lng: 103.8591, zoom: 15 });
  assert.deepEqual(p("https://www.google.com/maps/@1.2838,103.8591,3a,75y,90t/data=!3m6!1e1!3m4!1sabc!2e0!7i16384!8i8192"), { kind: "coords", lat: 1.2838, lng: 103.8591 });
  assert.deepEqual(p("https://www.google.com/maps/@1.2838,103.8591,500m/data=!3m1!1e3"), { kind: "coords", lat: 1.2838, lng: 103.8591, zoom: 18 });
  assert.deepEqual(p("https://www.google.co.uk/maps/@51.5072,-0.1276,12z"), { kind: "coords", lat: 51.5072, lng: -0.1276, zoom: 12 });
  assert.deepEqual(p("https://www.google.com/maps/@?api=1&map_action=map&center=-33.712206,150.311941&zoom=12"), { kind: "coords", lat: -33.712206, lng: 150.311941, zoom: 12 });
});

test("directions: the destination is the place", () => {
  assert.deepEqual(p("https://www.google.com/maps/dir/Current+Location/Changi+Airport/@1.35,103.98,13z/data=!4m8!4m7!1m0!1m5!1m1!1s0x31da3d1e5:0x7ec8!2m2!1d103.98!2d1.36"), { kind: "query", zoom: 13, label: "Changi Airport" });
  assert.deepEqual(p("https://www.google.com/maps/dir//1.3644,103.9915/@1.36,103.99,15z"), { kind: "coords", lat: 1.3644, lng: 103.9915, zoom: 15 });
  assert.deepEqual(p("https://maps.google.com/maps?saddr=Home&daddr=Raffles+Place"), { kind: "query", label: "Raffles Place" });
});

test("cid links", () => {
  assert.deepEqual(p("https://maps.google.com/?cid=5748034408985933691"), { kind: "place", cid: "5748034408985933691" });
  assert.equal(openInGoogleMapsUrl(p("https://maps.google.com/?cid=5748034408985933691")), "https://www.google.com/maps?cid=5748034408985933691");
});

/* ------------------------------------------------------------- embeds */

const PB = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8155!2d103.8585!3d1.2836!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da1904937e1633%3A0xf7e9c6bb18ef8ac6!2sMarina%20Bay%20Sands!5e0!3m2!1sen!2ssg!4v1700000000000!5m2!1sen!2ssg";

test("official embed URL: kept as it is, place details read for the status line", () => {
  assert.deepEqual(p(PB), { kind: "embed", embedSrc: PB, lat: 1.2836, lng: 103.8585, zoom: 15, label: "Marina Bay Sands", cid: "17864027903821318854" });
});

test("whole <iframe> code from Share > Embed a map: its src, entities decoded", () => {
  const code = `<iframe src="${PB.replace(/&/g, "&amp;")}&amp;hl=en" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  const r = p(code);
  assert.equal(r?.kind, "embed");
  assert.equal(r?.embedSrc, `${PB}&hl=en`);
  assert.equal(r?.label, "Marina Bay Sands");
  // Older generator code: single quotes, keyless URL.
  const old = p("<iframe width='600' height='500' src='https://maps.google.com/maps?q=Example%20Clinic&amp;t=&amp;z=13&amp;ie=UTF8&amp;iwloc=&amp;output=embed' frameborder='0'></iframe>");
  assert.deepEqual(old, { kind: "embed", embedSrc: "https://maps.google.com/maps?q=Example%20Clinic&t=&z=13&ie=UTF8&iwloc=&output=embed", zoom: 13, label: "Example Clinic" });
  // Not Google: refused.
  assert.equal(p(`<iframe src="https://evil.example/maps/embed?x=1"></iframe>`), null);
  assert.equal(p(`<iframe src="javascript:alert(1)"></iframe>`), null);
});

test("keyless embeds (the format saved blocks use) and the Embed API", () => {
  assert.deepEqual(p("https://www.google.com/maps?q=27.014443,49.6551893&z=16&output=embed"),
    { kind: "embed", embedSrc: "https://www.google.com/maps?q=27.014443,49.6551893&z=16&output=embed", lat: 27.014443, lng: 49.6551893, zoom: 16 });
  const amp = "https://maps.google.com/maps?q=Example%20Tour%20%26%20Travels&t=m&z=14&output=embed&iwloc=near";
  assert.deepEqual(p(amp), { kind: "embed", embedSrc: amp, zoom: 14, label: "Example Tour & Travels" });
  const v1 = "https://www.google.com/maps/embed/v1/place?key=AIzaFAKE&q=Space+Needle,Seattle+WA&zoom=14";
  assert.deepEqual(p(v1), { kind: "embed", embedSrc: v1, zoom: 14, label: "Space Needle,Seattle WA" });
  // Google's own redirect target of ?q=...&output=embed.
  assert.deepEqual(p("https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s1.2838,103.8591!6i17"),
    { kind: "embed", embedSrc: "https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s1.2838,103.8591!6i17", lat: 1.2838, lng: 103.8591, zoom: 17 });
});

test("Google My Maps: viewer and editor links become the embed", () => {
  assert.deepEqual(p("https://www.google.com/maps/d/viewer?mid=1AbCdEfGh_ijk&ll=1.3,103.8&z=12"), { kind: "embed", embedSrc: "https://www.google.com/maps/d/embed?mid=1AbCdEfGh_ijk" });
  assert.deepEqual(p("https://www.google.com/maps/d/u/0/edit?mid=1AbCdEfGh_ijk"), { kind: "embed", embedSrc: "https://www.google.com/maps/d/embed?mid=1AbCdEfGh_ijk" });
});

/* --------------------------------------------------- coordinates, geo: */

test("plain coordinates and DMS", () => {
  assert.deepEqual(p("1.2836, 103.8607"), { kind: "coords", lat: 1.2836, lng: 103.8607 });
  assert.deepEqual(p(" 23.8103 90.4125 "), { kind: "coords", lat: 23.8103, lng: 90.4125 });
  assert.deepEqual(p("-33.8688,151.2093"), { kind: "coords", lat: -33.8688, lng: 151.2093 });
  assert.deepEqual(p(`1°17'01.0"N 103°51'38.5"E`), { kind: "coords", lat: 1.2836111, lng: 103.8606944 });
  assert.deepEqual(parseCoordText(`33°52'07.7"S 151°12'33.5"E`), { lat: -33.8688056, lng: 151.2093056 });
  assert.equal(p("0, 0"), null);
  assert.equal(p("91, 10"), null);
  assert.equal(p("Road 12, Building 5"), null);
});

test("geo: URIs", () => {
  assert.deepEqual(p("geo:1.2836,103.8607?z=17"), { kind: "coords", lat: 1.2836, lng: 103.8607, zoom: 17 });
  assert.deepEqual(p("geo:0,0?q=1.2836,103.8607(Head+Office)"), { kind: "coords", lat: 1.2836, lng: 103.8607, label: "Head Office" });
  assert.deepEqual(p("geo:0,0?q=Marina+Bay+Sands"), { kind: "query", label: "Marina Bay Sands" });
});

/* ------------------------------------------------------------- refusals */

test("anything that is not Google Maps is refused, including look-alike hosts", () => {
  for (const bad of [
    "", "   ", "Some words", "javascript:alert(1)",
    "https://www.google.com.evil.com/maps?q=1.2,103.8",
    "https://google.com@evil.com/maps?q=1.2,103.8",
    "https://evil.com/?next=https://www.google.com/maps?q=1.2,103.8",
    "https://www.google.com:8443/maps?q=1.2,103.8",
    "https://maps.apple.com/?ll=1.28,103.85",
    "https://www.openstreetmap.org/export/embed.html?bbox=103.8,1.2,103.9,1.3",
    "https://www.google.com/", "https://www.google.com/maps",
    "https://notgoogle.com/maps?q=1,2",
  ]) assert.equal(p(bad), null, bad);
  assert.equal(isGoogleHost("google.com.sg"), true);
  assert.equal(isGoogleHost("maps.google.co.uk"), true);
  assert.equal(isGoogleHost("www.google.cat"), true);
  assert.equal(isGoogleHost("google.evil.com"), false);
  assert.equal(isGoogleHost("www.google.com.evil.com"), false);
  assert.equal(isResolveFetchHost("maps.app.goo.gl"), true);
  assert.equal(isResolveFetchHost("169.254.169.254"), false);
  assert.equal(isResolveFetchHost("localhost"), false);
});

/* ------------------------------------------------------- what we save */

test("keyless embed URL we save: coordinates, place id, words", () => {
  assert.equal(keylessEmbedUrl({ lat: 1.2836, lng: 103.8607, zoom: 16 }), "https://www.google.com/maps?q=1.2836,103.8607&z=16&output=embed");
  assert.equal(keylessEmbedUrl({ lat: 25.25877939999999, lng: 55.331748 }), "https://www.google.com/maps?q=25.258779,55.331748&output=embed");
  assert.equal(keylessEmbedUrl({ cid: "5748034408985933691", lat: 1, lng: 2, zoom: 17 }), "https://www.google.com/maps?cid=5748034408985933691&z=17&output=embed");
  assert.equal(keylessEmbedUrl({ label: "67 Ubi Crescent, Singapore", zoom: 15 }), "https://www.google.com/maps?q=67%20Ubi%20Crescent%2C%20Singapore&z=15&output=embed");
  assert.equal(keylessEmbedUrl({ label: "  " }), null);
  assert.equal(keylessEmbedUrl(null), null);
  // Round trip: what we save parses back to the same place.
  const saved = keylessEmbedUrl({ lat: -33.712206, lng: 150.311941, zoom: 12 })!;
  assert.deepEqual(p(saved), { kind: "embed", embedSrc: saved, lat: -33.712206, lng: 150.311941, zoom: 12 });
});

/* ------------------------------------------- render rules (pixel-identical) */

test("maps that render today keep the exact same src string", () => {
  for (const saved of [
    "https://www.google.com/maps?q=27.014443,49.6551893&z=16&output=embed",
    "https://www.google.com/maps?q=67%20Ubi%20Crescent%2C%20Singapore%20408560&z=16&output=embed",
    "https://www.google.com/maps?q=15+Harper+Road,+Singapore+369678&z=16&output=embed",
    "https://maps.google.com/maps?q=Example%20Tour%20%26%20Travels&t=m&z=14&output=embed&iwloc=near",
    "https://maps.google.com/maps?q=24.7287728,46.8198856&z=17&output=embed",
    "https://www.google.com/maps?q=Metropolitan%20Square%2C%20Damansara%20Perdana&output=embed",
    "https://www.google.com/maps?q=Chamurkhan,+Uttarkhan,+Dhaka+1230&output=embed",
    PB,
    " https://www.google.com/maps?q=Singapore&z=11&output=embed ",
    // Not Google, but it contains "embed": rendered as before.
    "https://www.openstreetmap.org/export/embed.html?bbox=103.8,1.2,103.9,1.3",
  ]) assert.equal(mapEmbedSrc(saved), saved, saved);
  // Not Google and no "embed": ignored as before (address map).
  assert.equal(mapEmbedSrc("https://example.com/map"), undefined);
  assert.equal(mapEmbedSrc(""), undefined);
  assert.equal(mapEmbedSrc(undefined), undefined);
});

test("links that were ignored or broken now show their place", () => {
  assert.equal(mapEmbedSrc("https://maps.app.goo.gl/uF9nNvnfwPy15giM7", null, { fallbackQuery: "Office 10, Deira, Dubai" }),
    "/api/maps/embed?u=https%3A%2F%2Fmaps.app.goo.gl%2FuF9nNvnfwPy15giM7&a=Office+10%2C+Deira%2C+Dubai");
  assert.equal(mapEmbedSrc("https://maps.app.goo.gl/uF9nNvnfwPy15giM7"), shortLinkEmbedPath("https://maps.app.goo.gl/uF9nNvnfwPy15giM7"));
  assert.equal(mapEmbedSrc("https://www.google.com/maps/place/Merlion+Park/@1.2868,103.8545,17z"), "https://www.google.com/maps?q=1.2868,103.8545&z=17&output=embed");
  // A place named "Embedded..." used to go into the iframe as a page Google refuses to frame.
  assert.equal(mapEmbedSrc("https://www.google.com/maps/place/Embedded+Labs/@1.3,103.8,16z"), "https://www.google.com/maps?q=1.3,103.8&z=16&output=embed");
  assert.equal(mapEmbedSrc(`<iframe src="${PB.replace(/&/g, "&amp;")}"></iframe>`), PB);
  assert.equal(mapEmbedSrc("www.google.com/maps?q=Doha&output=embed"), "https://www.google.com/maps?q=Doha&output=embed");
  // No saved URL: the structured location.
  assert.equal(mapEmbedSrc(undefined, { lat: 1.2836, lng: 103.8607, zoom: 16, label: "Marina Bay Sands" }), "https://www.google.com/maps?q=1.2836,103.8607&z=16&output=embed");
  assert.equal(mapEmbedSrc("", { label: "Raffles Place" }), "https://www.google.com/maps?q=Raffles%20Place&output=embed");
});

test("Visit + Map text keeps its search; links get an embed and an open link", () => {
  for (const words of ["Al Inma Tour & Travels", "3.3188736,101.5779654", "53 Kent Road, Singapore 210053", "قطع غيار"]) {
    assert.equal(looksLikeMapLink(words), false, words);
    assert.equal(googleMapLinks(words), null, words);
  }
  assert.deepEqual(googleMapLinks("https://www.google.com/maps?q=1.2836,103.8607&z=17&output=embed"),
    { embed: "https://www.google.com/maps?q=1.2836,103.8607&z=17&output=embed", link: "https://www.google.com/maps/search/?api=1&query=1.2836%2C103.8607" });
  assert.deepEqual(googleMapLinks("https://maps.app.goo.gl/AbC123"),
    { embed: "/api/maps/embed?u=https%3A%2F%2Fmaps.app.goo.gl%2FAbC123", link: "https://maps.app.goo.gl/AbC123" });
  assert.equal(googleMapLinks("https://www.google.com/maps?cid=123&z=16&output=embed")?.link, "https://www.google.com/maps?cid=123");
});

test("the control reads back what was saved", () => {
  const loc = { lat: 1.2836, lng: 103.8607, zoom: 16, label: "Marina Bay Sands", source: "search" as const };
  const url = keylessEmbedUrl(loc)!;
  assert.deepEqual(readSavedMap(loc, url), { location: { ...locationFromParsed(p(url)!, "link"), ...loc }, src: url, embedSrc: url });
  // The phone app changed only the URL: the URL wins.
  const moved = readSavedMap(loc, "https://www.google.com/maps?q=Raffles%20Place&z=15&output=embed");
  assert.equal(moved.location?.label, "Raffles Place");
  assert.equal(moved.location?.lat, undefined);
  // Old block: only a URL, or a share link still to check.
  assert.equal(readSavedMap(undefined, "https://www.google.com/maps?q=27.014443,49.6551893&z=16&output=embed").location?.lat, 27.014443);
  assert.equal(readSavedMap(undefined, "https://maps.app.goo.gl/AbC123").shortUrl, "https://maps.app.goo.gl/AbC123");
  assert.deepEqual(readSavedMap(undefined, ""), { location: null, src: undefined });
});

/* ------------------------------------------------------ share-link resolver */

type Call = { url: string; init: RequestInit };
function fakeFetch(routes: Record<string, { status: number; location?: string }>, calls: Call[]) {
  return async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const r = routes[url];
    if (!r) return new Response("not found", { status: 404 });
    return new Response(null, { status: r.status, headers: r.location ? { location: r.location } : {} });
  };
}

test("resolver follows Google redirects by hand and stops at the Maps page", async () => {
  const { resolveShortLink } = await import("../../src/lib/maps/resolve-link");
  const calls: Call[] = [];
  const place = "https://www.google.com/maps/place/Example/data=!4m2!3m1!1s0x1:0x2!18m1!1e1?entry=gps";
  const out = await resolveShortLink("https://maps.app.goo.gl/AbC123", { fetchImpl: fakeFetch({ "https://maps.app.goo.gl/AbC123": { status: 302, location: place } }, calls) });
  assert.equal(out, place);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.redirect, "manual");
  // http is upgraded; consent wall unwrapped without fetching it.
  const calls2: Call[] = [];
  const consent = `https://consent.google.com/m?continue=${encodeURIComponent(place)}&gl=DE`;
  assert.equal(await resolveShortLink("http://maps.app.goo.gl/AbC123", { fetchImpl: fakeFetch({ "https://maps.app.goo.gl/AbC123": { status: 302, location: consent } }, calls2) }), place);
  assert.deepEqual(calls2.map((c) => c.url), ["https://maps.app.goo.gl/AbC123"]);
});

test("resolver never leaves Google (SSRF), stops loops and dead links", async () => {
  const { resolveShortLink } = await import("../../src/lib/maps/resolve-link");
  const calls: Call[] = [];
  const evil = await resolveShortLink("https://maps.app.goo.gl/x", { fetchImpl: fakeFetch({ "https://maps.app.goo.gl/x": { status: 302, location: "http://169.254.169.254/latest/meta-data" } }, calls) });
  assert.equal(evil, null);
  assert.deepEqual(calls.map((c) => c.url), ["https://maps.app.goo.gl/x"]);
  // Not a share host to begin with: nothing fetched.
  const none: Call[] = [];
  assert.equal(await resolveShortLink("https://evil.example/x", { fetchImpl: fakeFetch({}, none) }), null);
  assert.equal(await resolveShortLink("https://maps.app.goo.gl:8443/x", { fetchImpl: fakeFetch({}, none) }), null);
  assert.equal(none.length, 0);
  // Loop between share hosts: gives up after maxHops.
  const loop: Call[] = [];
  assert.equal(await resolveShortLink("https://maps.app.goo.gl/a", {
    maxHops: 3,
    fetchImpl: fakeFetch({ "https://maps.app.goo.gl/a": { status: 302, location: "https://maps.app.goo.gl/b" }, "https://maps.app.goo.gl/b": { status: 302, location: "https://maps.app.goo.gl/a" } }, loop),
  }), null);
  assert.equal(loop.length, 3);
  // Dead link (404) and a network failure.
  assert.equal(await resolveShortLink("https://maps.app.goo.gl/dead", { fetchImpl: fakeFetch({}, []) }), null);
  assert.equal(await resolveShortLink("https://maps.app.goo.gl/x", { fetchImpl: async () => { throw new Error("offline"); } }), null);
});

/**
 * Trial sites: nothing the owner typed may run as script (lib/security/
 * trial-html.ts), and tracking ids are checked before they reach a script.
 * Run: npx tsx --test tests/platform/trial-html.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sanitizeTrialContent, sanitizeTrialCss, sanitizeTrialHtml } from "../../src/lib/security/trial-html";
import { GA_ID_RE, GTM_ID_RE, safeGaId, safeGtmId } from "../../src/lib/analytics/tracking-ids";
import { META_PIXEL_RE } from "../../src/lib/analytics/meta-pixel-id";

/** Nothing left that a browser would run. */
function assertInert(out: string, from: string) {
  const s = out.toLowerCase();
  for (const bad of ["<script", "<object", "<embed", "<base", "<meta", "<link", "<form", "<svg", "<math", "<style", "<frame", "<applet",
    "javascript:", "vbscript:", "data:text/html", "srcdoc", "formaction"]) {
    assert.ok(!s.includes(bad), `${JSON.stringify(from)} left ${JSON.stringify(bad)} in ${JSON.stringify(out)}`);
  }
  assert.doesNotMatch(out, /<[^>]*\son\w+\s*=/i, `${JSON.stringify(from)} kept an event handler: ${out}`);
  // A frame is either empty or points at one of the allowed video/map hosts.
  for (const frame of out.match(/<iframe[^>]*>/gi) ?? []) {
    const src = / src="([^"]*)"/i.exec(frame)?.[1];
    assert.ok(src === undefined || ALLOWED_FRAME.test(src), `${JSON.stringify(from)} kept a frame: ${frame}`);
  }
}
const ALLOWED_FRAME = new RegExp("^https://(www[.]youtube[.]com|www[.]youtube-nocookie[.]com|player[.]vimeo[.]com|www[.]google[.]com|maps[.]google[.]com|www[.]openstreetmap[.]org)/");

const BYPASSES = [
  `<script>alert(1)</script>`,
  `<SCRIPT SRC=//evil.example/x.js></SCRIPT>`,
  `<scr<script>ipt>alert(1)</scr</script>ipt>`,
  `<script\n>alert(1)</script\n>`,
  `<img src=x onerror=alert(1)>`,
  `<img src="x" OnErRoR="alert(1)">`,
  `<img src=x onerror\n=alert(1)>`,
  `<img/src=x/onerror=alert(1)>`,
  `<a href="javascript:alert(1)">x</a>`,
  `<a href="JaVaScRiPt:alert(1)">x</a>`,
  `<a href="java\tscript:alert(1)">x</a>`,
  `<a href="&#106;avascript:alert(1)">x</a>`,
  `<a href="&#x6A;avascript&colon;alert(1)">x</a>`,
  `<a href=" javascript:alert(1)">x</a>`,
  `<a href="vbscript:msgbox(1)">x</a>`,
  `<a href="data:text/html,<script>alert(1)</script>">x</a>`,
  `<iframe srcdoc="<script>alert(1)</script>"></iframe>`,
  `<iframe src="javascript:alert(1)"></iframe>`,
  `<iframe src="https://evil.example/"></iframe>`,
  `<svg onload=alert(1)>`,
  `<svg><script>alert(1)</script></svg>`,
  `<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>`,
  `<math><mtext><script>alert(1)</script></mtext></math>`,
  `<meta http-equiv="refresh" content="0;url=javascript:alert(1)">`,
  `<meta http-equiv="refresh" content="0;url=https://evil.example">`,
  `<base href="https://evil.example/">`,
  `<object data="javascript:alert(1)"></object>`,
  `<embed src="javascript:alert(1)">`,
  `<form action="javascript:alert(1)"><input type=submit></form>`,
  `<form><button formaction="javascript:alert(1)">x</button></form>`,
  `<link rel="stylesheet" href="https://evil.example/x.css">`,
  `<style>@import "https://evil.example/x.css";</style>`,
  `<style>body{background:url("javascript:alert(1)")}</style>`,
  `<body onload=alert(1)>`,
  `<details open ontoggle=alert(1)>x</details>`,
  `<video><source onerror=alert(1)></video>`,
  `<video src=x onerror=alert(1)></video>`,
  `<audio src=x onerror=alert(1)></audio>`,
  `<input autofocus onfocus=alert(1)>`,
  `<marquee onstart=alert(1)>x</marquee>`,
  `<div style="x" onmouseover="alert(1)">x</div>`,
  `<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>`,
  `<template><script>alert(1)</script></template>`,
  `<textarea></textarea><script>alert(1)</script>`,
  `<!--><script>alert(1)</script>-->`,
  `<![CDATA[<script>alert(1)</script>]]>`,
  `<xmp><script>alert(1)</script></xmp>`,
  `<a href="https://ok.example" target="_blank" onclick="alert(1)">x</a>`,
  `<img src="data:text/html,<script>alert(1)</script>">`,
  `<frameset onload=alert(1)></frameset>`,
  `<applet code="x"></applet>`,
  `<isindex action="javascript:alert(1)" type=submit>`,
  `<img src=x:alert(1) onerror=eval(src)>`,
  `<p>ok</p><script>alert(1)`,
];

test("every known way to run script from HTML is neutralised", () => {
  for (const html of BYPASSES) assertInert(sanitizeTrialHtml(html), html);
});

test("sanitising twice changes nothing more", () => {
  for (const html of BYPASSES) {
    const once = sanitizeTrialHtml(html);
    assert.equal(sanitizeTrialHtml(once), once, html);
  }
});

test("ordinary content survives: text, formatting, images, links, tables, video embeds", () => {
  const keep = [
    `<h2 class="title" id="top">Hello</h2>`,
    `<p style="color:red;text-align:center">A <strong>bold</strong> and <em>soft</em> line<br />next</p>`,
    `<ul><li>One</li><li>Two</li></ul>`,
    `<a href="https://example.com/page?x=1">link</a>`,
    `<a href="/contact">contact</a>`,
    `<a href="mailto:hi@example.com">mail</a>`,
    `<a href="tel:+8801700000000">call</a>`,
    `<img src="https://example.com/a.jpg" alt="A" width="300" loading="lazy" />`,
    `<img src="/media/t1/a.png" alt="" />`,
    `<table><thead><tr><th colspan="2">H</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>`,
    `<div class="grid" data-reveal="up" aria-label="Cards"><span>x</span></div>`,
    `<iframe src="https://www.youtube.com/embed/abc123" allowfullscreen></iframe>`,
    `<details open><summary>More</summary><p>Text</p></details>`,
  ];
  for (const html of keep) assert.equal(sanitizeTrialHtml(html), html, html);
  // A new tab never gets a handle on our window.
  assert.equal(sanitizeTrialHtml(`<a href="https://example.com" target="_blank">x</a>`), `<a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a>`);
  // The custom HTML block shows its markup without the script, not nothing.
  assert.equal(sanitizeTrialHtml(`<div class="promo"><h3>Sale</h3><script>track()</script><p>Today only</p></div>`), `<div class="promo"><h3>Sale</h3><p>Today only</p></div>`);
});

test("CSS cannot close its <style> tag or run script", () => {
  const out = sanitizeTrialCss(`a{color:red}</style><script>alert(1)</script><style>`);
  assert.ok(!out.includes("</style") && !out.includes("<script"), out);
  assert.ok(!sanitizeTrialCss(`</STYLE ><img src=x onerror=alert(1)>`).includes("<"), "tag start survives");
  assert.ok(!/expression\s*\(/i.test(sanitizeTrialCss(`a{width:expression(alert(1))}`)));
  assert.ok(!/javascript\s*:/i.test(sanitizeTrialCss(`a{background:url(javascript:alert(1))}`)));
  // Ordinary CSS is untouched, including child selectors and range queries.
  for (const css of [`.a > .b{color:#fff}`, `@media (width < 600px){.a{display:none}}`, `.a::after{content:"a < b"}`, `a{background:url("https://x.example/i.png")}`]) {
    assert.equal(sanitizeTrialCss(css), css, css);
  }
});

test("the whole block tree is cleaned, wherever the HTML sits", () => {
  const block = {
    id: "b1", type: "container", order: 0, visible: true,
    data: {
      title: "Tom & Jerry: 3 < 5",
      columns: [{ blocks: [
        { id: "b2", type: "custom_html", data: { html: `<div>Hi<script>alert(1)</script></div>`, css: `p{color:red}</style><script>alert(2)</script>` } },
        { id: "b3", type: "columns", data: { columns: 2, content: [`<p onclick="alert(3)">One</p>`, `<p>Two</p>`] } },
        { id: "b4", type: "cta", data: { buttonUrl: "javascript:alert(4)", secondaryUrl: " JaVa\nScript:alert(5)", link: "https://example.com/a?b=1", label: "Go" } },
        { id: "b5", type: "bottom_bar", data: { desktopMaxWidth: `560}</style><script>alert(6)</script>`, hideAt: 1024 } },
      ] }],
    },
  };
  const out = sanitizeTrialContent(block);
  const kids = out.data.columns[0].blocks as Array<{ data: Record<string, unknown> }>;
  // CSS fields end up inside a <style> tag: no "<" may be left to close it.
  assert.ok(!String(kids[0].data.css).includes("<"), String(kids[0].data.css));
  kids[0].data = { ...kids[0].data, css: "" };
  assertInert(JSON.stringify(out), "block tree");
  assert.equal(kids[0].data.html, `<div>Hi</div>`);
  assert.deepEqual(kids[1].data.content, [`<p>One</p>`, `<p>Two</p>`]);
  assert.equal(kids[2].data.buttonUrl, "#");
  assert.equal(kids[2].data.secondaryUrl, "#");
  // Plain text, numbers, ids and ordinary links are exactly as they were.
  assert.equal(out.data.title, "Tom & Jerry: 3 < 5");
  assert.equal(kids[2].data.link, "https://example.com/a?b=1");
  assert.equal(kids[3].data.hideAt, 1024);
  assert.equal(out.id, "b1");
  // The saved block is never changed.
  assert.equal(block.data.columns[0].blocks[0].data.html, `<div>Hi<script>alert(1)</script></div>`);
});

test("content with nothing to remove comes back as the same object", () => {
  const clean = { id: "x", type: "text", data: { content: "Plain words only", items: [{ label: "A", n: 1 }] } };
  assert.equal(sanitizeTrialContent(clean), clean);
  assert.equal(sanitizeTrialContent(null), null);
  assert.equal(sanitizeTrialContent("just text"), "just text");
});

test("tracking ids: only the exact shapes reach a script", () => {
  for (const ok of ["G-ABC123DEF4", "G-1A2B3C4D5E", "g-abc123def4", "AW-123456789", "GT-ABCD123", "DC-1234567", "UA-12345678-1"]) {
    assert.ok(GA_ID_RE.test(ok), ok);
    assert.equal(safeGaId(` ${ok} `), ok);
  }
  for (const bad of [
    "G-ABC');alert(1);//", "G-ABC123'", "G-ABC</script><script>alert(1)</script>", "G-ABC 123", "G-ABC\n123", "G-", "G-ABC", "ABC123", "",
    "G-ABC123&l=x", "UA-1-1", "G-ABC" + String.fromCharCode(0x2028) + "123DEF4", "javascript:alert(1)", "G-" + "A".repeat(40),
  ]) assert.equal(safeGaId(bad), null, JSON.stringify(bad));
  assert.equal(safeGaId(null), null);
  assert.equal(safeGaId(undefined), null);
  assert.equal(safeGaId(123), null);

  for (const ok of ["GTM-ABC1234", "GTM-5X7K2QP"]) { assert.ok(GTM_ID_RE.test(ok), ok); assert.equal(safeGtmId(ok), ok); }
  for (const bad of ["GTM-abc1234", "GTM-ABC'+alert(1)+'", "GTM-", "GTM-ABC 1", "G-ABC1234", "GTM-AB C", "GTM-ABC</script>"]) assert.equal(safeGtmId(bad), null, JSON.stringify(bad));

  for (const ok of ["1234567890", "123456789012345"]) assert.ok(META_PIXEL_RE.test(ok), ok);
  for (const bad of ["123", "1234567890'", "12345678901234567890123", "1234567890\n", "12345 67890", "abc1234567890", "1234567890);alert(1"]) {
    assert.ok(!META_PIXEL_RE.test(bad) || /\n$/.test(bad), JSON.stringify(bad));
  }
});

test("wiring: trial sites skip their own code, ids are checked, both renderers sanitise", () => {
  const layout = readFileSync("src/app/(site)/layout.tsx", "utf8");
  assert.match(layout, /\{!trialSite && settings\?\.custom_js && \(/);
  assert.match(layout, /\{!trialSite && settings\?\.analytics_code && \(/);
  assert.match(layout, /\{!trialSite && <GoogleTagManager/);
  assert.match(layout, /const gaId = safeGaId\(settings\?\.ga_measurement_id\)/);
  assert.doesNotMatch(layout, /\$\{settings\.ga_measurement_id\}/);
  assert.match(layout, /trialSite \? sanitizeTrialCss\(settings\.custom_css\) : styleText\(settings\.custom_css\)/);
  // Trial sites, and signed-in outsiders or staff on a platform subdomain (viewer-trust.test.ts).
  assert.match(layout, /const trialSite = await siteCodeBlocked\(tenantId\);/);

  const marketing = readFileSync("src/app/(marketing)/layout.tsx", "utf8");
  assert.match(marketing, /gaMeasurementId = safeGaId\(/);
  assert.match(marketing, /siteCodeBlocked\(gtagTenantId\)\) \? null/);

  // Public site: every block goes through here. Builder: same, for the viewer's session.
  assert.match(readFileSync("src/components/site/page-renderer.tsx", "utf8"), /if \(await isTrialRequest\(\)\) block = sanitizeTrialContent\(block\);/);
  const builder = readFileSync("src/components/admin/page-builder/canvas/block-renderer.tsx", "utf8");
  assert.match(builder, /trialGuard\.lib\.sanitizeTrialContent\(hydrated\)/);
  assert.match(builder, /if \(!trialGuard\.ready\) return null;/);

  for (const route of ["connect", "purchase", "verify"]) {
    assert.match(readFileSync(`src/app/api/domain/${route}/route.ts`, "utf8"), /await trialDomainRefusal\(req, tenantId\)/, route);
  }
});

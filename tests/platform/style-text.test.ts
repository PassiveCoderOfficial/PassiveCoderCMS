/**
 * Text printed into inline <style> and <script> elements cannot close them
 * (lib/security/style-text.ts), theme values are checked by type before they
 * reach the theme CSS (modules/themes/template-css.ts), and email lookups
 * match literally (lib/security/like.ts).
 * Run: npx tsx --test tests/platform/style-text.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  safeCssColor, safeCssLength, safeFontStack, safeFontWeight, safeLetterSpacing,
  scriptJson, scriptText, strictStyleText, styleText,
} from "../../src/lib/security/style-text";
import { likeExact } from "../../src/lib/security/like";
import { buildTemplateBodyScript, buildTemplateCSSVars } from "../../src/modules/themes/template-css";
import type { SiteDesign, TemplatePalette, TemplateTypography } from "../../src/modules/themes/template-types";

const BREAKOUT = `x}</style><script>alert(document.cookie)</script>`;
const BREAKOUTS = [
  BREAKOUT,
  `</STYLE ><img src=x onerror=alert(1)>`,
  `red;}</style\n><script src=//evil.example/x.js></script>`,
  `"</style><svg onload=alert(1)>`,
  `<!--</style>--><script>alert(1)</script>`,
  `</script><script>alert(1)</script>`,
];

/** What an HTML parser would see: the element is never closed by the text. */
function assertCannotClose(out: string, tag: "style" | "script", from: string) {
  assert.doesNotMatch(out, new RegExp(`</\\s*${tag}`, "i"), `${JSON.stringify(from)} can close <${tag}>: ${out}`);
  assert.ok(!out.includes("<!--"), `${JSON.stringify(from)} opens a comment: ${out}`);
}

test("styleText: tenant CSS cannot close the style element, and stays the same CSS", () => {
  for (const b of BREAKOUTS) assertCannotClose(styleText(`.a{color:red}${b}`), "style", b);
  // Ordinary CSS is untouched, media range queries included.
  const css = `@media (width < 600px){.a>b{content:"<"}}\n.c::after{content:"a/b"}`;
  assert.equal(styleText(css), css);
  // Inside a CSS string "<\/" still means "</".
  assert.equal(styleText(`.a::before{content:"</b>"}`), `.a::before{content:"<\\/b>"}`);
  assert.equal(styleText(null), "");
  assert.equal(styleText(undefined), "");
  assert.equal(styleText(42), "");
});

test("strictStyleText: generated CSS never carries a raw <", () => {
  for (const b of BREAKOUTS) {
    const out = strictStyleText(`:root{--x:${b}}`);
    assert.ok(!out.includes("<"), out);
  }
  assert.equal(strictStyleText(":root{--a:1}"), ":root{--a:1}");
});

test("scriptJson: JSON in a script element keeps its value and cannot close the tag", () => {
  for (const b of BREAKOUTS) {
    const out = scriptJson({ name: b, list: [b] });
    assertCannotClose(out, "script", b);
    assert.ok(!out.includes("<"), out);
    assert.deepEqual(JSON.parse(out), { name: b, list: [b] });
  }
  assert.equal(scriptJson("en"), `"en"`);
  assert.equal(scriptJson(undefined), "null");
  assert.ok(!scriptJson("a b c").includes(" "));
  assert.equal(JSON.parse(scriptJson("a b")), "a b");
});

test("scriptText: our own inline code cannot be closed by a value inside it", () => {
  assertCannotClose(scriptText(`var a="</script><script>alert(1)</script>";`), "script", "inline");
  assert.equal(scriptText("var a=1<2;"), "var a=1<2;");
});

test("CSS value checks accept real values and refuse everything else", () => {
  for (const ok of ["#fff", "#FFFFFF", "#11223344", "rgb(1, 2, 3)", "hsl(210 40% 50% / 0.5)", "rebeccapurple"]) assert.equal(safeCssColor(ok), ok, ok);
  for (const bad of ["", "#ff", "#gggggg", "red;}", "url(x)", "rgb(1,2,3);}</style>", "var(--x)", "expression(1)", null, 5, {}]) assert.equal(safeCssColor(bad), null, String(bad));

  for (const ok of ["0", "18", "0.75rem", ".4px", "-0.02em", "50%", "1.5rem"]) assert.equal(safeCssLength(ok), ok, ok);
  assert.equal(safeCssLength("4px 8px", 4), "4px 8px");
  assert.equal(safeCssLength(18), "18");
  for (const bad of ["", "1rem;}", "calc(1px)", "1px 2px", "1e9px", "12345px", "1px}</style>", null, {}]) assert.equal(safeCssLength(bad), null, String(bad));

  for (const ok of ["400", "700", "900", "650", "bold", "normal"]) assert.equal(safeFontWeight(ok), ok, ok);
  assert.equal(safeFontWeight(600), "600");
  for (const bad of ["", "0", "1001", "700;}", "7e2", BREAKOUT, null]) assert.equal(safeFontWeight(bad), null, String(bad));

  for (const ok of ["-0.01em", "0", "0em", ".4px", "0.1em", "normal"]) assert.equal(safeLetterSpacing(ok), ok, ok);
  for (const bad of ["1px 2px", "0;}", BREAKOUT, null]) assert.equal(safeLetterSpacing(bad), null, String(bad));
});

test("font stacks: named families quoted, generics bare, anything odd dropped", () => {
  assert.equal(safeFontStack("Inter"), "'Inter'");
  assert.equal(safeFontStack("Plus Jakarta Sans"), "'Plus Jakarta Sans'");
  assert.equal(safeFontStack("var(--font-poppins), Poppins"), "'Poppins'");
  assert.equal(safeFontStack(`"Source Sans 3", system-ui, -apple-system, sans-serif`), "'Source Sans 3', system-ui, -apple-system, sans-serif");
  assert.equal(safeFontStack("serif"), "serif");
  assert.equal(safeFontStack(`Inter, x}</style><script>alert(1)</script>`), "'Inter'");
  for (const bad of ["", BREAKOUT, "a;b", "url(x)", "'a'}", "a\\b", null, 3]) assert.equal(safeFontStack(bad), null, String(bad));
});

const PALETTE: TemplatePalette = {
  primary: "#2563EB", primaryFg: "#ffffff", secondary: "#0F172A", accent: "#38BDF8",
  background: "#FFFFFF", foreground: "#0F172A", muted: "#F1F5F9", mutedFg: "#64748B",
  card: "#FFFFFF", border: "#E2E8F0", ring: "#2563EB", borderRadius: "0.75rem",
};
const TYPO: TemplateTypography = { headingFont: "Inter", bodyFont: "Inter", headingWeight: "700", letterSpacing: "-0.02em" };

test("theme CSS: honest values come out exactly as before", () => {
  const css = buildTemplateCSSVars(PALETTE, { ...TYPO, headingFont: "Playfair Display", bodyFont: "var(--font-lato), Lato" }, ":root",
    { motion: "cinematic", roundness: "rounded", headingColor: "#112233", cardHeadingWeight: "600", buttonShape: "pill", imageFocus: "top" });
  assert.match(css, /--pc-motion: cinematic;/);
  assert.match(css, /@keyframes pc-curtain/);
  assert.match(css, /--radius: 0\.75rem;/);
  assert.match(css, /--heading-font: "AED Dirham", 'Playfair Display', /);
  assert.match(css, /--body-font: "AED Dirham", 'Lato', /);
  assert.match(css, /--heading-weight: 700;/);
  assert.match(css, /--letter-spacing-heading: -0\.02em;/);
  assert.match(css, /--brand-gradient: linear-gradient\(135deg, #2563EB 0%, #38BDF8 100%\);/);
  assert.match(css, /fonts\.googleapis\.com\/css2\?family=Playfair\+Display/);
  assert.match(css, /:is\(h1,h2,h3\)[^{]*\{ color: #112233; \}/);
  assert.match(css, /font-weight: 600 !important/);
  assert.ok(!css.includes("<"));
});

test("theme CSS: no value from the database can break out of the style element", () => {
  const evilDesign = {
    motion: BREAKOUT, headingWeight: BREAKOUT, letterSpacing: BREAKOUT, headingFont: BREAKOUT, bodyFont: `Inter, ${BREAKOUT}`,
    headingStyle: BREAKOUT, roundness: BREAKOUT, shadow: BREAKOUT, headingColor: BREAKOUT, imageFocus: BREAKOUT,
    buttonShape: BREAKOUT, cardHeadingWeight: BREAKOUT,
  } as unknown as SiteDesign;
  const evilPalette = Object.fromEntries(Object.keys(PALETTE).map((k) => [k, BREAKOUT])) as unknown as TemplatePalette;
  const evilTypo = { headingFont: BREAKOUT, bodyFont: BREAKOUT, headingWeight: BREAKOUT, letterSpacing: BREAKOUT };
  for (const scope of [":root", ".cms-canvas-light"]) {
    for (const [p, t, d] of [[PALETTE, TYPO, evilDesign], [evilPalette, TYPO, null], [PALETTE, evilTypo, null], [evilPalette, evilTypo, evilDesign]] as const) {
      const css = buildTemplateCSSVars(p, t, scope, d);
      assert.ok(!css.includes("<"), css);
      assert.ok(!/script|alert|cookie/i.test(css), css);
      // The CSS is still whole: the defaults took the place of the bad values.
      assert.match(css, /--pc-motion: none;/);
      assert.match(css, /--heading-weight: (700|\d+);/);
      assert.match(css, /--brand-gradient: linear-gradient\(135deg, (#[0-9A-Fa-f]+|hsl\([^)]*\)) 0%, (#[0-9A-Fa-f]+|hsl\([^)]*\)) 100%\);/);
    }
  }
  // Non-string junk (a JSON column can hold anything) does not throw.
  const junk = { motion: 1, headingFont: {}, headingWeight: [], letterSpacing: 2 } as unknown as SiteDesign;
  assert.doesNotThrow(() => buildTemplateCSSVars({ ...PALETTE, primary: 5 as unknown as string, borderRadius: {} as unknown as string }, TYPO, ":root", junk));
});

test("template body script: the slug cannot leave its string", () => {
  const js = buildTemplateBodyScript(`x');alert(1);//</script>`);
  assert.ok(!js.includes("alert(1);"), js);
  assert.ok(!/<\/script/i.test(js), js);
  assert.match(buildTemplateBodyScript("clean-pro_2"), /cls\.push\('template-clean-pro_2'\)/);
});

test("likeExact: an email matches literally in ilike", () => {
  assert.equal(likeExact("a_b%c@example.com"), "a\\_b\\%c@example.com");
  assert.equal(likeExact("back\\slash@example.com"), "back\\\\slash@example.com");
  assert.equal(likeExact("plain@example.com"), "plain@example.com");
});

/** Every .tsx / .ts under src. */
function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

test("no page prints site data into a style or script element unescaped", () => {
  // What may sit inside __html of an inline <style>/<script>: a call to one of
  // the escaping helpers, the theme CSS (escaped where it is built), or text
  // written in the code itself. A new sink has to be added here on purpose.
  const SAFE = [
    /^(styleText|strictStyleText|scriptText|scriptJson|ldScript|sanitizeTrialCss)\(/,
    /^editorBridgeScript\(\)$/,
    /^(templateCSSVars|cssVars|theme\.css|chrome\.css)$/, // buildTemplateCSSVars / buildSiteTheme output
    /^buildTemplateBodyScript\(templateSlug\)$/, /^templateBodyScript$/,
    /^(MARKETPLACE_TOKENS_CSS|PRODUCT_HTML_CSS|HIDE_GLOBAL_CHROME_CSS|WORLD_THEME_SCRIPT|CSS|themeScript|themeLockScript)$/,
    /^JSON\.stringify\([\s\S]*\)\.replace\(\/<\/g, "\\\\u003c"\)$/,
    /^"[^"]*"$/, /^`[^`$]*`$/, // literals with no interpolation
    /^strictStyleText\(`/, // spans lines: the regex above stops at the first line
  ];
  // Reviewed by hand: interpolates only validated or code-chosen values.
  const REVIEWED = new Set([
    "src/app/(site)/layout.tsx|trialSite ? sanitizeTrialCss(settings.custom_css) : styleText(settings.custom_css)",
    "src/app/(marketing)/page.tsx|(await siteCodeBlocked(tenantId)) ? sanitizeTrialCss(siteSettings.custom_css as string) : styleText(siteSettings.custom_css as string)",
    "src/app/(site)/layout.tsx|settings.custom_js", // the site's own script: its purpose; withheld from untrusted viewers
    "src/components/providers/panel-time-zone.tsx|`(${DEFAULT_TZ_JS})(${scriptJson(tz)})`",
    "src/components/site/tenant-page-with-chrome.tsx|`document.documentElement.lang=${scriptJson(lang)};document.documentElement.dir=${scriptJson(rtl ? \"rtl\" : \"ltr\")}`",
    "src/app/experts-site/[[...path]]/page.tsx|`document.documentElement.lang=${scriptJson(lang)};document.documentElement.dir=${scriptJson(rtl ? \"rtl\" : \"ltr\")}`",
  ]);
  const found: string[] = [];
  for (const file of sources("src")) {
    const rel = file.split(path.sep).join("/");
    const src = readFileSync(file, "utf8");
    const re = /<(style|script)\b[^>]*?dangerouslySetInnerHTML=\{\{\s*__html:\s*/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      // Expression up to the closing "}}" of the prop (templates may span lines).
      let i = re.lastIndex, depth = 0, inTpl = false;
      for (; i < src.length; i++) {
        const c = src[i];
        if (c === "`") inTpl = !inTpl;
        if (inTpl) continue;
        if (c === "{" || c === "(") depth++;
        else if (c === ")") depth--;
        else if (c === "}") { if (depth === 0) break; depth--; }
      }
      const expr = src.slice(re.lastIndex, i).trim();
      if (SAFE.some((s) => s.test(expr))) continue;
      if (REVIEWED.has(`${rel}|${expr}`)) continue;
      found.push(`${rel}: ${expr.slice(0, 120)}`);
    }
  }
  assert.deepEqual(found, [], "unescaped <style>/<script> content:\n" + found.join("\n"));
});

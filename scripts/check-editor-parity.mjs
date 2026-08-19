/**
 * Editor / live-site theming parity check.
 *
 * Renders the same page twice — in the page-builder canvas and on the
 * published site — and compares the CSS custom properties that actually drive
 * block colour. Reports a diff and exits non-zero when they disagree.
 *
 * WHY THIS EXISTS
 * Two real bugs shipped in one day that neither `tsc --noEmit` nor
 * `next build` could see:
 *
 *   1. A wrapper added to stop the canvas following the admin's dark mode
 *      declared concrete colour values. Being deeper in the DOM than the
 *      :root where the tenant palette is injected, it silently replaced every
 *      tenant's brand colours with the default shadcn light palette.
 *   2. Tenant homepages ("/") rendered with no template palette at all,
 *      because the (site) catch-all can't match "/" and the (marketing) route
 *      that serves it never injected the template CSS vars.
 *
 * Both are invisible to types and to the build: the code compiles, the page
 * renders, only the colours are wrong. The only way to catch them is to render
 * both surfaces and compare the computed values.
 *
 * USAGE
 *   node scripts/check-editor-parity.mjs
 *
 * ENV
 *   PARITY_BASE_URL   tenant site root      (default https://freebirdsg.passivecoder.com)
 *   PARITY_EMAIL      dashboard login
 *   PARITY_PASSWORD   dashboard password
 *   PARITY_PAGES      "slug:pageId,slug:pageId" — slug "" means the homepage
 *   PARITY_SHOTS      directory for screenshots (optional; skipped if unset)
 *
 * Credentials are read from the environment only — never committed here.
 */
import { chromium } from "playwright";
import fs from "fs";

const BASE = process.env.PARITY_BASE_URL ?? "https://freebirdsg.passivecoder.com";
const EMAIL = process.env.PARITY_EMAIL;
const PASSWORD = process.env.PARITY_PASSWORD;
const SHOTS = process.env.PARITY_SHOTS ?? null;

/** Vars that decide how a block looks. A mismatch in any of these means the
 *  editor is lying about what the visitor will see. */
const WATCHED = [
  "--background", "--foreground", "--card", "--card-foreground",
  "--muted", "--muted-foreground", "--border", "--primary",
  "--primary-foreground", "--accent", "--radius",
];

function parsePages() {
  const raw = process.env.PARITY_PAGES;
  if (!raw) {
    console.error(
      "PARITY_PAGES is required: \"slug:pageId,slug:pageId\" (empty slug = homepage).\n" +
      "Find ids with: select slug, id from pages where tenant_id = '…' and status = 'published';",
    );
    process.exit(2);
  }
  return raw.split(",").map(entry => {
    const [slug, id] = entry.split(":");
    if (!id) {
      console.error(`Malformed PARITY_PAGES entry: "${entry}" — expected slug:pageId`);
      process.exit(2);
    }
    return { slug: slug.trim(), id: id.trim(), name: slug.trim() || "home" };
  });
}

/** Runs inside the page. Reads the watched vars off an element (or :root). */
function readVars(selector) {
  const el = selector ? document.querySelector(selector) : document.documentElement;
  if (!el) return null;
  const cs = getComputedStyle(el);
  const out = {};
  for (const v of [
    "--background", "--foreground", "--card", "--card-foreground",
    "--muted", "--muted-foreground", "--border", "--primary",
    "--primary-foreground", "--accent", "--radius",
  ]) out[v] = cs.getPropertyValue(v).trim();
  return out;
}

if (!EMAIL || !PASSWORD) {
  console.error("PARITY_EMAIL and PARITY_PASSWORD must be set.");
  process.exit(2);
}

const pages = parsePages();
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const failures = [];

try {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  if (page.url().includes("/login")) throw new Error("login failed — check PARITY_EMAIL / PARITY_PASSWORD");

  for (const target of pages) {
    console.log(`\n=== ${target.name} ===`);

    await page.goto(`${BASE}/dashboard/pages/${target.id}`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(7000); // canvas hydration + block render

    // Both admin themes: the canvas must look identical in each, because the
    // published site has no notion of the admin's dark mode.
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.waitForTimeout(1000);
    const editorLight = await page.evaluate(readVars, ".cms-canvas-light");
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${target.name}-editor-light.png` });

    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(1000);
    const editorDark = await page.evaluate(readVars, ".cms-canvas-light");
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${target.name}-editor-dark.png` });

    const live = await ctx.newPage();
    await live.goto(`${BASE}/${target.slug}`, { waitUntil: "networkidle", timeout: 90000 });
    await live.waitForTimeout(3000);
    const liveVars = await live.evaluate(readVars, null);
    if (SHOTS) await live.screenshot({ path: `${SHOTS}/${target.name}-live.png`, fullPage: true });
    await live.close();

    if (!editorLight || !editorDark) {
      console.log("  FAIL: .cms-canvas-light wrapper not found in the editor");
      failures.push(`${target.name}: canvas wrapper missing`);
      continue;
    }
    if (!liveVars) {
      console.log("  FAIL: could not read variables from the live page");
      failures.push(`${target.name}: live page unreadable`);
      continue;
    }

    const unstable = WATCHED.filter(v => editorLight[v] !== editorDark[v]);
    if (unstable.length) {
      console.log("  FAIL: canvas changes with the admin theme:");
      for (const v of unstable) {
        console.log(`    ${v}: light="${editorLight[v]}" dark="${editorDark[v]}"`);
      }
      failures.push(`${target.name}: canvas follows admin theme (${unstable.join(", ")})`);
    }

    const mismatched = WATCHED.filter(v => editorLight[v] !== liveVars[v]);
    if (mismatched.length) {
      console.log("  FAIL: editor does not match the live page:");
      for (const v of mismatched) {
        console.log(`    ${v}: editor="${editorLight[v]}" live="${liveVars[v]}"`);
      }
      failures.push(`${target.name}: editor/live mismatch (${mismatched.join(", ")})`);
    }

    if (!unstable.length && !mismatched.length) {
      console.log(`  OK — ${WATCHED.length} variables match, stable across admin themes`);
    }
  }
} catch (err) {
  console.error("ERROR:", err.message);
  failures.push(err.message);
} finally {
  await browser.close();
}

console.log("\n=== SUMMARY ===");
if (failures.length) {
  for (const f of failures) console.log("FAIL:", f);
  process.exit(1);
}
console.log(`PASS — ${pages.length} page(s) render identically in the editor and on the live site.`);

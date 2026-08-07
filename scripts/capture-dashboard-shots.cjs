// One-off script: log into the live demo-client account and capture dashboard
// screenshots for the BD-expat landing page's "see the product" section.
// Run manually, not part of build. Output -> public/dashboard-shots/*.png
const { chromium } = require("playwright");
const path = require("path");

const BASE = "https://passivecoder.com";
const OUT_DIR = path.join(__dirname, "..", "public", "dashboard-shots");

// Demo client account: fresh/empty — good for onboarding-wizard + empty-state
// shots. Superadmin's own root-tenant account: has real seeded content
// (scheduler, pages) — use it for shots that need to look alive.
const DEMO = { email: "demo-client@passivecoder.com", password: "DemoClient2026!" };
const SUPERADMIN = { email: "walibdpro@gmail.com", password: "ShotCapture2026!" };

const demoShots = [
  { name: "dashboard-home", path: "/dashboard" },
  { name: "subscription", path: "/dashboard/subscription" },
  { name: "crm", path: "/dashboard/crm" },
  { name: "invoices", path: "/dashboard/invoices" },
  { name: "bookings", path: "/dashboard/bookings" },
  { name: "identity", path: "/dashboard/identity" },
];

// The seeded live scheduler content lives on the "Passive Coder" tenant
// (subdomain passivecoder.passivecoder.com, owned by a different superadmin
// account) — not whichever tenant the switcher defaults to. Hit it directly;
// superadmins bypass per-tenant ownership checks.
const TENANT_BASE = "https://passivecoder.passivecoder.com";
const superadminShots = [
  { name: "pages-builder", path: `${TENANT_BASE}/dashboard/pages` },
  { name: "scheduler", path: `${TENANT_BASE}/dashboard/scheduler` },
  { name: "scheduler-calendar", path: `${TENANT_BASE}/dashboard/scheduler?tab=calendar` },
];

async function login(page, { email, password }) {
  await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(1000);
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput = page.locator('input[type="password"], input[name="password"]').first();
  await emailInput.fill(email);
  await passInput.fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);
  console.log("Post-login URL:", page.url());
}

async function dismissOnboarding(page, { captureAsShot } = {}) {
  try {
    const skipBtn = page.getByText("Skip for now", { exact: true });
    if (await skipBtn.isVisible({ timeout: captureAsShot ? 3000 : 1500 })) {
      if (captureAsShot) {
        await page.screenshot({ path: path.join(OUT_DIR, "onboarding-wizard.png") });
        console.log("OK   onboarding-wizard (modal)");
      }
      await skipBtn.click();
      await page.waitForTimeout(600);
    }
  } catch {
    // modal not present
  }
}

async function captureAll(page, shots) {
  for (const { name, path: p } of shots) {
    const outPath = path.join(OUT_DIR, `${name}.png`);
    const url = p.startsWith("http") ? p : `${BASE}${p}`;
    try {
      await page.goto(url, { waitUntil: "load", timeout: 25000 });
      await page.waitForTimeout(1800);
      await dismissOnboarding(page);
      await page.screenshot({ path: outPath });
      console.log(`OK   ${name} (${url})`);
    } catch (err) {
      console.log(`FAIL ${name} (${url}) — ${err.message.split("\n")[0]}`);
    }
  }
}

(async () => {
  const browser = await chromium.launch();

  console.log("--- Demo client account ---");
  const page1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page1, DEMO);
  await dismissOnboarding(page1, { captureAsShot: true });
  await captureAll(page1, demoShots);
  await page1.close();

  console.log("--- Superadmin (root tenant, live data) ---");
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page2, SUPERADMIN);
  await dismissOnboarding(page2);
  await captureAll(page2, superadminShots);

  // Block editor itself (not just the pages list) — open the Home page.
  try {
    await page2.goto(`${TENANT_BASE}/dashboard/pages`, { waitUntil: "load", timeout: 25000 });
    await page2.waitForTimeout(1200);
    await page2.getByText("Home", { exact: true }).first().click({ timeout: 5000 });
    await page2.waitForTimeout(2500);
    await page2.screenshot({ path: path.join(OUT_DIR, "page-block-editor.png") });
    console.log("OK   page-block-editor");
  } catch (err) {
    console.log("FAIL page-block-editor —", err.message.split("\n")[0]);
  }

  await page2.close();

  await browser.close();
})();

import { chromium } from 'playwright';
const OUT = process.argv[2];
const errors = [];
const results = [];

const TARGETS = [
  { pageId: '1e393fc6-031c-4681-a37b-e022d972f256', label: 'Country Grid', slug: 'country_grid' },
  { pageId: '1e393fc6-031c-4681-a37b-e022d972f256', label: 'Eligibility Checker', slug: 'eligibility_checker' },
  { pageId: '1e393fc6-031c-4681-a37b-e022d972f256', label: 'Visa Status Tracker', slug: 'status_tracker' },
  { pageId: '59b3c588-d098-465e-b36e-4664ae554b59', label: 'Urgent Blood Requests', slug: 'donor_requests' },
  { pageId: 'c74a27e7-9b65-4fa2-99e8-3df19b0bbde9', label: 'Shopping Cart', slug: 'ecommerce_cart' },
];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push(`[${page.url()}] ${m.text()}`); });
page.on('pageerror', e => errors.push(`[PAGEERROR ${page.url()}] ${e.message}`));

await page.goto('https://passivecoder.com/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'walibdpro@gmail.com');
await page.fill('input[type="password"]', 'Itsn0t@p@ssw0rd');
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);

for (const t of TARGETS) {
  const before = errors.length;
  try {
    await page.goto(`https://passivecoder.com/dashboard/pages/${t.pageId}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.locator('button:has-text("Blocks")').nth(1).click({ timeout: 5000 });
    await page.waitForTimeout(400);
    await page.fill('input[placeholder*="Search blocks" i]', t.label);
    await page.waitForTimeout(500);
    await page.locator(`text=${t.label}`).first().click({ timeout: 5000 });
    await page.waitForTimeout(1200);
  } catch (e) {
    results.push({ slug: t.slug, ok: false, stage: 'insert', error: e.message });
    continue;
  }

  await page.locator('button:has-text("Config")').click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  const hasNoSettings = await page.locator('text=No settings for this block type').count();
  await page.screenshot({ path: `${OUT}/gated-${t.slug}-content.png` });
  await page.locator('button:has-text("Style")').first().click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/gated-${t.slug}-style.png` });

  const newErrors = errors.slice(before);
  results.push({ slug: t.slug, ok: hasNoSettings === 0 && newErrors.length === 0, hasNoSettings, newErrors });
}

console.log(JSON.stringify(results, null, 2));
await b.close();

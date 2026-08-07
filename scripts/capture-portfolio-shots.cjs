// One-off script: screenshot each portfolio site's homepage for the BD-expat
// landing page thumbnail grid. Run manually, not part of build.
const { chromium } = require("playwright");
const path = require("path");

const domains = [
  "a-faq.com",
  "alsadafperfumes.com",
  "endeavorrenovation.sg",
  "dkintlsg.com",
  "dubaideepcleaning.ae",
  "bagdaddecor.com",
  "excellenthospitality.ae",
  "hajjji.com",
  "hasanflooringkl.com",
  "homayrahafcha.ae",
  "hvactechnicianksa.com",
  "hwmovers.com",
  "kuraskksa.com",
  "makkahakramlaundry.com",
  "mepcontracting.net",
  "noorhilalbuild.com",
  "samconsg.com",
  "skrarif.com",
  "sunsoonsg.com",
  "uniquerenovationmy.com",
];

const OUT_DIR = path.join(__dirname, "..", "public", "portfolio");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  for (const domain of domains) {
    const outPath = path.join(OUT_DIR, `${domain}.png`);
    try {
      await page.goto(`https://${domain}`, { waitUntil: "load", timeout: 25000 });
      await page.waitForTimeout(1200); // let animations/lazy images settle
      await page.screenshot({ path: outPath });
      console.log(`OK   ${domain}`);
    } catch (err) {
      console.log(`FAIL ${domain} — ${err.message.split("\n")[0]}`);
    }
  }

  await browser.close();
})();

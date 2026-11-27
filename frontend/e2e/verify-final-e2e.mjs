import { chromium } from 'playwright-core';

const URL = 'http://localhost:5173';
const ARTIFACT_DIR =
  'C:\\Users\\kisha\\.gemini\\antigravity\\brain\\e8f5a46f-e659-4e8b-a07a-255e0c692120';

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
    const page = await context.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('response', (res) => {
      if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
    });

    await page.goto(URL, { waitUntil: 'networkidle' });

    // Phase 1: Bhopal hero + alerts + dashboard + map + routine wizard
    await page.waitForSelector('text=Bhopal Overview', { timeout: 10000 });
    await page.locator('button[aria-label*="Govindpura"]').first().click();
    await page.waitForSelector('text=Focused: Govindpura Industrial');

    // Bilingual UI toggle check (EN -> HI -> Hinglish -> EN) across sections
    await page.click('button:has-text("हिं")');
    await page.waitForSelector('text=लाइव भोपाल डैशबोर्ड देखें');
    await page.waitForSelector('text=निर्णय पाइपलाइन');
    await page.waitForSelector('text=परिवार रूटीन प्रोफ़ाइल');
    await page.waitForSelector('text=व्यक्तिगत दैनिक कार्य योजना');
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${ARTIFACT_DIR}\\hindi-hero.png`, fullPage: false });
    await page.click('button:has-text("Hing")');
    await page.waitForSelector('text=Live Bhopal Dashboard Dekhein');
    await page.waitForSelector('text=Save & Plan Banayein').catch(() => {});
    await page.click('button:has-text("EN")');
    await page.waitForSelector('text=Explore Live Bhopal Dashboard');

    // Phase 2: SSE RAG Chat
    await page.locator('#assistant').scrollIntoViewIfNeeded();
    await page.click('button:has-text("Hinglish")');
    await page.click('button:has-text("Bhopal mein aaj morning walk karna safe hai?")');
    await page.waitForSelector('text=BHOPAL-DISPERSION', { timeout: 10000 });

    // Phase 3: Forecast & Simulator (wait for chart draw animation)
    await page.locator('#forecast').scrollIntoViewIfNeeded();
    await page.waitForSelector('text=python-fastapi-ml', { timeout: 12000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${ARTIFACT_DIR}\\phase4-forecast-ready.png`, fullPage: false });

    await page.locator('#simulator').scrollIntoViewIfNeeded();
    await page.waitForSelector('text=Estimated Daily Exposure Proxy Reduction', { timeout: 10000 });
    await page.waitForTimeout(700);

    // Phase 4: Exposure Proxy & Community Dashboard + Pledge + Pagination
    await page.locator('#exposure-community').scrollIntoViewIfNeeded();
    await page.waitForSelector('text=Personal Air Exposure Score', { timeout: 10000 });
    await page.waitForSelector('text=Important Non-Medical Disclaimer', { timeout: 10000 });
    await page.waitForSelector('text=Bhopal Community Clean-Air Pulse', { timeout: 10000 });
    await page.click('button:has-text("+1 Carpool Pledge") >> nth=0');
    await page.waitForSelector('text=Anonymous zone pledge counted', { timeout: 10000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${ARTIFACT_DIR}\\phase4-exposure-community.png`, fullPage: false });

    // Responsive overflow check at 768px and 360px
    for (const vp of [
      { name: 'tablet', width: 768, height: 900 },
      { name: 'mobile', width: 360, height: 780 },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(250);
      const overflowInfo = await page.evaluate(() => {
        const w = window.innerWidth;
        const culprits = [];
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.right > w + 1) {
            culprits.push(`${el.tagName}.${el.className?.toString().slice(0, 40)} right=${Math.round(r.right)}`);
          }
        }
        return {
          overflow: document.documentElement.scrollWidth > w,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: w,
          culprits: culprits.slice(0, 5),
        };
      });
      if (overflowInfo.overflow) {
        throw new Error(`Horizontal overflow on ${vp.name}: ${JSON.stringify(overflowInfo)}`);
      }
    }

    if (consoleErrors.length || pageErrors.length || failedRequests.length) {
      throw new Error(JSON.stringify({ consoleErrors, pageErrors, failedRequests }, null, 2));
    }

    console.log('FINAL_E2E_ALL_PHASES_PASSED');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('FINAL_E2E_FAILED:', err);
  process.exit(1);
});

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

    // 1. Forecast & Historical Trends
    await page.locator('#forecast').scrollIntoViewIfNeeded();
    await page.waitForSelector('text=Forecast Confidence:', { timeout: 12000 });
    await page.waitForSelector('text=python-fastapi-ml', { timeout: 12000 });
    await page.click('button:has-text("24h Forecast")');
    await page.waitForSelector('text=Past 24h Trend & 24-Hour AQI Outlook', { timeout: 10000 });
    await page.screenshot({ path: `${ARTIFACT_DIR}\\phase3-forecast.png`, fullPage: false });

    // 2. What-If Simulator
    await page.locator('#simulator').scrollIntoViewIfNeeded();
    await page.waitForSelector('text=Estimated Daily Exposure Proxy Reduction', { timeout: 10000 });
    const beforePct = await page.locator('#simulator').textContent();
    await page.click('text=Wear fitted N95 mask in transit');
    await page.waitForTimeout(350);
    const afterPct = await page.locator('#simulator').textContent();
    if (beforePct === afterPct) {
      throw new Error('What-if simulator output did not react to toggling N95 mask');
    }
    await page.screenshot({ path: `${ARTIFACT_DIR}\\phase3-simulator.png`, fullPage: false });

    // 3. Mobile 360px overflow check
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    if (overflow) throw new Error('Horizontal overflow at 360px in Phase 3');

    if (consoleErrors.length || pageErrors.length || failedRequests.length) {
      throw new Error(JSON.stringify({ consoleErrors, pageErrors, failedRequests }, null, 2));
    }

    console.log('PHASE_3_E2E_ALL_PASSED');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('PHASE_3_E2E_FAILED:', err);
  process.exit(1);
});

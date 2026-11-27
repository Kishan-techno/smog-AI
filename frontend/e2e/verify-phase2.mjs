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
    await page.locator('#assistant').scrollIntoViewIfNeeded();

    // 1. Test Hinglish chip via SSE
    await page.click('button:has-text("Hinglish")');
    await page.click('button:has-text("Bhopal mein aaj morning walk karna safe hai?")');
    await page.waitForSelector('text=Aapke Family Routine', { timeout: 10000 });
    await page.waitForSelector('text=BHOPAL-DISPERSION', { timeout: 10000 });
    await page.waitForSelector('text=MOHFW-SCHOOL-KIDS', { timeout: 10000 });

    // 2. Test Hindi question via input box
    await page.click('button:has-text("हिन्दी")');
    await page.fill('#saathi-chat-input', 'स्कूल के लिए कौन सा मास्क सही है?');
    await page.click('button:has-text("Ask")');
    await page.waitForSelector('text=ICMR-MASK-COMMUTE', { timeout: 10000 });

    await page.screenshot({ path: `${ARTIFACT_DIR}\\phase2-chat.png`, fullPage: false });

    // 3. Mobile 360px overflow check
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    if (overflow) throw new Error('Horizontal overflow at 360px in Phase 2');

    if (consoleErrors.length || pageErrors.length || failedRequests.length) {
      throw new Error(JSON.stringify({ consoleErrors, pageErrors, failedRequests }, null, 2));
    }

    console.log('PHASE_2_E2E_ALL_PASSED');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('PHASE_2_E2E_FAILED:', err);
  process.exit(1);
});

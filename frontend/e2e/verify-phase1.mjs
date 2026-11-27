import { chromium } from 'playwright-core';

const URL = 'http://localhost:5173';
const ARTIFACT_DIR =
  'C:\\Users\\kisha\\.gemini\\antigravity\\brain\\e8f5a46f-e659-4e8b-a07a-255e0c692120';

async function run() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon')) {
        failedRequests.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1');

    // 1. Verify Bhopal default
    const heroText = await page.textContent('body');
    if (!heroText.includes('Bhopal')) {
      throw new Error('Default city Bhopal not rendered on page');
    }

    // Wait for dashboard data to resolve
    await page.waitForSelector('text=Bhopal Overview', { timeout: 10000 });
    await page.waitForSelector('text=Personalized Daily Action Plan', { timeout: 10000 });
    await page.screenshot({ path: `${ARTIFACT_DIR}\\phase1-hero.png`, fullPage: false });

    // 2. Scroll down through storytelling section
    await page.evaluate(() => window.scrollTo(0, 750));
    await page.waitForTimeout(450);
    await page.click('button:has-text("03")');
    await page.waitForSelector('text=Personalize Routine');

    // 3. Test Map marker click (Govindpura Industrial or TT Nagar)
    await page.locator('#dashboard').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const stationBtn = page.locator('button[aria-label*="Govindpura"]').first();
    await stationBtn.click();
    await page.waitForSelector('text=Focused: Govindpura Industrial');

    // 4. Switch city to Delhi and back to Bhopal
    await page.selectOption('#city-select', 'delhi');
    await page.waitForSelector('text=Delhi Overview', { timeout: 10000 });
    await page.selectOption('#city-select', 'bhopal');
    await page.waitForSelector('text=Bhopal Overview', { timeout: 10000 });

    // 5. Walk through 3-step Family Routine Wizard
    await page.locator('#routine-plan').scrollIntoViewIfNeeded();
    await page.click('button:has-text("Next Step")');
    await page.selectOption('select >> nth=1', 'carpool');
    await page.click('button:has-text("Next Step")');
    await page.click('button:has-text("Save & Generate Plan")');
    await page.waitForSelector('text=Family routine saved', { timeout: 10000 });
    const toastCount = await page.locator('text=Family routine saved').count();
    if (toastCount !== 1) {
      throw new Error(`Expected 1 confirmation toast, found ${toastCount}`);
    }

    // 6. Expand Impact, Source & Assumptions
    const expandBtn = page.locator('button:has-text("Impact, Source & Assumptions")').first();
    await expandBtn.click();
    await page.waitForSelector('text=Assumptions:');

    // 7. Theme toggle
    const themeBtn = page.locator('button[aria-label*="Switch to light mode"]');
    await themeBtn.click();
    const isDarkAfterToggle = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    if (isDarkAfterToggle) {
      throw new Error('Theme did not toggle to light mode');
    }
    await page.locator('button[aria-label*="Switch to dark mode"]').click();

    await page.screenshot({ path: `${ARTIFACT_DIR}\\phase1-desktop.png`, fullPage: false });

    // 8. Check 768px tablet and 360px mobile viewports for overflow
    for (const vp of [
      { name: 'tablet', width: 768, height: 900 },
      { name: 'mobile', width: 360, height: 780 },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(250);
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      if (overflow.scrollWidth > overflow.innerWidth) {
        throw new Error(
          `Horizontal overflow on ${vp.name}: scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`
        );
      }
      if (vp.name === 'mobile') {
        await page.locator('button[aria-label="Toggle navigation menu"]').click();
        await page.waitForSelector('text=Sign In / Save Family Profile');
        await page.screenshot({ path: `${ARTIFACT_DIR}\\phase1-mobile.png`, fullPage: false });
      }
    }

    if (consoleErrors.length || pageErrors.length || failedRequests.length) {
      throw new Error(
        JSON.stringify({ consoleErrors, pageErrors, failedRequests }, null, 2)
      );
    }

    console.log('PHASE_1_E2E_ALL_PASSED');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('PHASE_1_E2E_FAILED:', err);
  process.exit(1);
});

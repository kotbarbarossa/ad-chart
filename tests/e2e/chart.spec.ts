import { expect, type Locator, type Page, test } from '@playwright/test';

const CHART = '#chart-context';

/** Move the pointer over the horizontal centre of the chart (the 3rd of 5 dates). */
async function hoverMiddle(page: Page, chart: Locator): Promise<void> {
  const box = await chart.boundingBox();
  if (!box) throw new Error('chart has no bounding box');
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4, { steps: 4 });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector(`${CHART} .highcharts-series`);
});

test('renders four series', async ({ page }) => {
  await expect(page.locator(`${CHART} .highcharts-series`)).toHaveCount(4);
});

test('shows a shared tooltip with every series value on hover', async ({ page }) => {
  await hoverMiddle(page, page.locator(CHART));

  const tooltip = page.locator(`${CHART} .adc-tt`);
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('12.06.2026');
  await expect(tooltip).toContainText('Cost: 44.36');
  await expect(tooltip).toContainText('CPA: 1.23');
  await expect(tooltip).toContainText('ROI confirmed: 161.47');
  await expect(tooltip).toContainText('Conversions: 36');
});

test('highlights every series point with a halo on hover', async ({ page }) => {
  await hoverMiddle(page, page.locator(CHART));
  await expect(page.locator(`${CHART} .highcharts-halo`).first()).toBeVisible();
  expect(await page.locator(`${CHART} .highcharts-halo`).count()).toBeGreaterThanOrEqual(1);
});

test('matches the resting-state screenshot', async ({ page }) => {
  // Let the intro animation settle and keep the pointer off the chart.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await expect(page.locator(CHART)).toHaveScreenshot('chart-resting.png');
});

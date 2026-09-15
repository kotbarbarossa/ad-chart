/**
 * Regenerate the documentation images from the live demo:
 *   - docs/demo.png       the in-context chart with the 12.06 tooltip open
 *   - docs/comparison.png a resting reference GIF frame beside our resting chart
 *
 * Usage: `pnpm ts:screenshots` (a dev server must be reachable at PORT, or pass
 * a URL as the first arg). Compares against docs/frames/frame-118.png (resting).
 */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const URL = process.argv[2] ?? 'http://localhost:4318/';
const CHART = '#chart-context';
const REST_FRAME = 'docs/frames/frame-118.png';

// Reference plot-box crop (eyedropped from frame-118, 800x529).
const REF_BOX = { left: 111, top: 95, width: 702 - 111, height: 397 - 95 };

async function run(): Promise<void> {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({
    viewport: { width: 900, height: 600 },
    deviceScaleFactor: 2,
  });
  await page.goto(URL);
  await page.waitForSelector(`${CHART} .highcharts-series`);

  const chart = page.locator(CHART);
  const box = await chart.boundingBox();
  if (!box) throw new Error('no chart box');

  // --- demo.png: hover the 3rd of 5 dates (12.06) to open the shared tooltip.
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4, { steps: 4 });
  await page.waitForSelector(`${CHART} .adc-tt`);
  await page.waitForTimeout(400);
  const tmp = mkdtempSync(join(tmpdir(), 'adc-'));
  const demoRaw = join(tmp, 'demo.png');
  await chart.screenshot({ path: demoRaw });
  await sharp(demoRaw).resize({ width: 1520 }).toFile('docs/demo.png');

  // --- comparison.png: resting chart plot beside the resting reference frame.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  const plot = await page.evaluate((sel) => {
    const el = document.querySelector(
      `${sel} .highcharts-plot-background`,
    ) as SVGRectElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, CHART);
  if (!plot) throw new Error('no plot background');
  const ourRaw = join(tmp, 'our.png');
  await page.screenshot({
    path: ourRaw,
    clip: { x: plot.x, y: plot.y, width: plot.width, height: plot.height },
  });
  await browser.close();

  await buildComparison(ourRaw, 'docs/comparison.png');
  console.log('wrote docs/demo.png and docs/comparison.png');
}

/** Compose the reference-frame crop and our chart side by side with captions. */
async function buildComparison(ourPath: string, out: string): Promise<void> {
  const H = 300;
  const ref = await sharp(REST_FRAME)
    .extract(REF_BOX)
    .resize({ height: H })
    .toBuffer({ resolveWithObject: true });
  const our = await sharp(ourPath).resize({ height: H }).toBuffer({ resolveWithObject: true });

  const gap = 24;
  const pad = 16;
  const capH = 34;
  const w = pad * 2 + ref.info.width + gap + our.info.width;
  const h = pad + capH + H + pad;

  const caption = (text: string, x: number, boxW: number) =>
    `<text x="${x + boxW / 2}" y="${pad + 22}" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="18" fill="#333" text-anchor="middle">${text}</text>`;
  const svg = Buffer.from(
    `<svg width="${w}" height="${h}"><rect width="100%" height="100%" fill="#ffffff"/>` +
      caption('Reference (GIF frame)', pad, ref.info.width) +
      caption('ad-chart (this repo)', pad + ref.info.width + gap, our.info.width) +
      `</svg>`,
  );

  await sharp({ create: { width: w, height: h, channels: 4, background: '#ffffff' } })
    .composite([
      { input: svg, top: 0, left: 0 },
      { input: ref.data, top: pad + capH, left: pad },
      { input: our.data, top: pad + capH, left: pad + ref.info.width + gap },
    ])
    .png()
    .toFile(out);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

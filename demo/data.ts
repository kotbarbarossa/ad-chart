import type { AdChartData } from '../src/index';

/** Reference dataset from the brief (section 1.1). */
export const referenceData: AdChartData = {
  cost: [
    ['2026-06-10', 2.04],
    ['2026-06-11', 25.85],
    ['2026-06-12', 44.36],
    ['2026-06-13', 55.65],
    ['2026-06-14', 63.75],
  ],
  cpa: [
    ['2026-06-10', 0.68],
    ['2026-06-11', 0.86],
    ['2026-06-12', 1.23],
    ['2026-06-13', 0.79],
    ['2026-06-14', 0.71],
  ],
  roiConfirmed: [
    ['2026-06-10', 610.78],
    ['2026-06-11', 180.5],
    ['2026-06-12', 161.47],
    ['2026-06-13', 56.33],
    ['2026-06-14', 357.25],
  ],
  conversions: [
    ['2026-06-10', 3],
    ['2026-06-11', 30],
    ['2026-06-12', 36],
    ['2026-06-13', 70],
    ['2026-06-14', 90],
  ],
};

const DAY = 24 * 60 * 60 * 1000;
const BASE = Date.UTC(2026, 5, 10);

function jitter(base: number, spread: number): number {
  return Math.round((base + Math.random() * spread) * 100) / 100;
}

/** Fresh random-but-plausible data, to show the live `update` API. */
export function randomData(points = 5): AdChartData {
  const times = Array.from({ length: points }, (_, i) => BASE + i * DAY);
  return {
    cost: times.map((t, i) => [t, jitter(2 + i * 14, 12)]),
    cpa: times.map((t) => [t, jitter(0.5, 0.9)]),
    roiConfirmed: times.map((t) => [t, jitter(50, 560)]),
    conversions: times.map((t, i) => [t, Math.round(jitter(3 + i * 18, 20))]),
  };
}

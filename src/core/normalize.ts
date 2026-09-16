import { toEpochMs } from './format';
import { SERIES_KEYS, type SeriesKey } from './theme';
import type { AdChartData, NormalizedData, TimePoint } from './types';

function isDev(): boolean {
  return typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
}

function readPoint(point: TimePoint): { t: number; v: number | null } {
  if (Array.isArray(point)) {
    return { t: toEpochMs(point[0]), v: point[1] };
  }
  return { t: toEpochMs(point.date), v: point.value };
}

/**
 * Reduce one series to a `time -> value` map. Points are read in order, so a
 * duplicated timestamp keeps the last value (with a dev warning).
 */
function collectSeries(key: SeriesKey, points: TimePoint[]): Map<number, number | null> {
  const byTime = new Map<number, number | null>();
  for (const point of points) {
    const { t, v } = readPoint(point);
    if (byTime.has(t) && isDev()) {
      console.warn(
        `ad-chart: duplicate date in "${key}" series (${new Date(t).toISOString()}); using the last value.`,
      );
    }
    byTime.set(t, v);
  }
  return byTime;
}

/**
 * Align all four series onto one sorted, de-duplicated time axis. A series with
 * no point at a given time gets `null` there (a gap).
 */
export function normalize(data: AdChartData): NormalizedData {
  const maps: Record<SeriesKey, Map<number, number | null>> = {
    cost: collectSeries('cost', data.cost),
    cpa: collectSeries('cpa', data.cpa),
    roiConfirmed: collectSeries('roiConfirmed', data.roiConfirmed),
    conversions: collectSeries('conversions', data.conversions),
  };

  const times = [...new Set(SERIES_KEYS.flatMap((key) => [...maps[key].keys()]))].sort(
    (a, b) => a - b,
  );

  const series = Object.fromEntries(
    SERIES_KEYS.map((key) => [key, times.map((t) => maps[key].get(t) ?? null)]),
  ) as Record<SeriesKey, (number | null)[]>;

  return { times, series };
}

import type { SeriesKey } from './theme';

/**
 * One time-series point. Two shapes are accepted:
 *   - tuple:  [time, value]
 *   - object: { date, value }
 *
 * `time`/`date` is epoch milliseconds, an ISO date string (`YYYY-MM-DD` is
 * treated as a UTC calendar day), or a `Date`. `value` is a number, or `null`
 * for a gap (line break / missing column).
 */
export type TimePointTuple = [time: number | string, value: number | null];
export interface TimePointObject {
  date: string | number | Date;
  value: number | null;
}
export type TimePoint = TimePointTuple | TimePointObject;

/** The four input series. Each may have a different length and gaps. */
export interface AdChartData {
  cost: TimePoint[];
  cpa: TimePoint[];
  roiConfirmed: TimePoint[];
  conversions: TimePoint[];
}

/** User-facing chart options; every field is optional and falls back to theme. */
export interface AdChartOptions {
  /** Chart height in px (width is fluid). Default 220. */
  height?: number;
  /** Tooltip labels per series (i18n). */
  labels?: Partial<Record<SeriesKey, string>>;
  /** Series colour overrides. */
  colors?: Partial<Record<SeriesKey, string>>;
  /** Per-series axis headroom (hidden axis max = dataMax * headroom). */
  axisHeadroom?: Partial<Record<SeriesKey, number>>;
}

/** Options with every field filled in from the theme defaults. */
export interface ResolvedOptions {
  height: number;
  labels: Record<SeriesKey, string>;
  colors: Record<SeriesKey, string>;
  axisHeadroom: Record<SeriesKey, number>;
}

/** Series values aligned onto a shared, sorted, de-duplicated time axis. */
export interface NormalizedData {
  /** Sorted, unique epoch-ms timestamps shared by every series. */
  times: number[];
  /** Per-series values aligned to `times`; `null` where the series has no point. */
  series: Record<SeriesKey, (number | null)[]>;
}

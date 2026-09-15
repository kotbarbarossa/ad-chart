import type { SeriesKey } from './theme';

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Convert a point's time to epoch milliseconds.
 *
 * A date-only string (`YYYY-MM-DD`) is interpreted as a UTC calendar day so
 * that e.g. `2026-06-12` never slips to the 11th in a negative-offset zone.
 * Everything else goes through the platform parser. Returns `NaN` for
 * unparseable input; callers validate.
 */
export function toEpochMs(time: number | string | Date): number {
  if (time instanceof Date) return time.getTime();
  if (typeof time === 'number') return time;

  if (ISO_DATE_ONLY.test(time)) {
    const [year, month, day] = time.split('-').map(Number) as [number, number, number];
    return Date.UTC(year, month - 1, day);
  }
  return Date.parse(time);
}

/** Format an epoch-ms timestamp as `DD.MM.YYYY` in UTC. */
export function formatDate(ms: number): string {
  const date = new Date(ms);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format a series value for display.
 * Conversions are whole numbers; every other series shows two decimals with a
 * dot separator.
 */
export function formatValue(key: SeriesKey, value: number): string {
  return key === 'conversions' ? String(Math.round(value)) : value.toFixed(2);
}

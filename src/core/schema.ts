import { z } from 'zod';
import { toEpochMs } from './format';
import type { AdChartData } from './types';

const finiteNumber = z.number().refine(Number.isFinite, { message: 'must be a finite number' });

const value = finiteNumber.nullable();

const time = z
  .union([z.number(), z.string(), z.date()])
  .refine((t) => Number.isFinite(toEpochMs(t)), { message: 'is not a valid date or timestamp' });

/**
 * Accept both point shapes by normalising the tuple `[time, value]` into the
 * object `{ date, value }` first. Field validation then reports precise paths
 * (`series[i].value` / `series[i].time`) for either input form.
 */
const timePoint = z.preprocess(
  (point) => (Array.isArray(point) ? { date: point[0], value: point[1] } : point),
  z.object({ date: time, value }),
);

const series = z.array(timePoint).min(1, { message: 'must have at least one point' });

export const adChartDataSchema = z.object({
  cost: series,
  cpa: series,
  roiConfirmed: series,
  conversions: series,
});

/** Turn a Zod issue path into a readable location like `cost[2].value`. */
function describePath(path: readonly PropertyKey[]): string {
  const [seriesKey, index, field] = path;
  let location = seriesKey === undefined ? 'data' : String(seriesKey);
  if (typeof index === 'number') location += `[${index}]`;
  if (field === 1 || field === 'value') location += '.value';
  else if (field === 0 || field === 'date') location += '.time';
  return location;
}

/**
 * Validate raw input and return typed data, or throw an `Error` whose message
 * points at the offending series and index.
 */
export function parseAdChartData(input: unknown): AdChartData {
  const result = adChartDataSchema.safeParse(input);
  if (result.success) {
    return result.data as AdChartData;
  }
  const details = result.error.issues
    .map((issue) => `${describePath(issue.path)} ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid ad-chart data: ${details}`);
}

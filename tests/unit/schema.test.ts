import { describe, expect, it } from 'vitest';
import { parseAdChartData } from '../../src/core/schema';
import type { AdChartData } from '../../src/core/types';
import { referenceData } from './fixtures';

/** Clone the valid reference data and mutate one series for negative tests. */
function withSeries(overrides: Partial<AdChartData>): unknown {
  return { ...referenceData, ...overrides };
}

describe('parseAdChartData', () => {
  it('accepts valid data (tuple form)', () => {
    expect(() => parseAdChartData(referenceData)).not.toThrow();
  });

  it('accepts the object point form', () => {
    const data = withSeries({ cost: [{ date: '2026-06-10', value: 2.04 }] });
    expect(() => parseAdChartData(data)).not.toThrow();
  });

  it('rejects NaN values and names the location', () => {
    const data = withSeries({ cost: [['2026-06-10', Number.NaN]] });
    expect(() => parseAdChartData(data)).toThrow(/cost\[0\]\.value/);
  });

  it('rejects non-numeric values', () => {
    const data = withSeries({ cpa: [['2026-06-10', 'oops' as unknown as number]] });
    expect(() => parseAdChartData(data)).toThrow(/cpa\[0\]\.value/);
  });

  it('rejects empty series', () => {
    const data = withSeries({ conversions: [] });
    expect(() => parseAdChartData(data)).toThrow(/conversions.*at least one point/);
  });

  it('rejects invalid dates and points at the time field', () => {
    const data = withSeries({ roiConfirmed: [['nope', 1]] });
    expect(() => parseAdChartData(data)).toThrow(/roiConfirmed\[0\]\.time/);
  });

  it('allows null values (gaps)', () => {
    const data = withSeries({ cost: [['2026-06-10', null]] });
    expect(() => parseAdChartData(data)).not.toThrow();
  });
});

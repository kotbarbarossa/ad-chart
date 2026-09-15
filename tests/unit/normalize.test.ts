import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalize } from '../../src/core/normalize';
import type { AdChartData } from '../../src/core/types';

const empty: AdChartData = { cost: [], cpa: [], roiConfirmed: [], conversions: [] };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('normalize', () => {
  it('aligns series of different lengths, filling gaps with null', () => {
    const data: AdChartData = {
      ...empty,
      cost: [
        ['2026-06-10', 1],
        ['2026-06-11', 2],
        ['2026-06-12', 3],
      ],
      cpa: [['2026-06-11', 9]],
    };
    const result = normalize(data);

    expect(result.times).toHaveLength(3);
    expect(result.series.cost).toEqual([1, 2, 3]);
    expect(result.series.cpa).toEqual([null, 9, null]);
    expect(result.series.roiConfirmed).toEqual([null, null, null]);
  });

  it('sorts unsorted dates ascending', () => {
    const data: AdChartData = {
      ...empty,
      cost: [
        ['2026-06-13', 3],
        ['2026-06-10', 1],
        ['2026-06-12', 2],
      ],
    };
    const result = normalize(data);

    expect(result.times).toEqual([
      Date.UTC(2026, 5, 10),
      Date.UTC(2026, 5, 12),
      Date.UTC(2026, 5, 13),
    ]);
    expect(result.series.cost).toEqual([1, 2, 3]);
  });

  it('keeps the last value for a duplicated date and warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const data: AdChartData = {
      ...empty,
      cost: [
        ['2026-06-10', 1],
        ['2026-06-10', 5],
      ],
    };
    const result = normalize(data);

    expect(result.times).toHaveLength(1);
    expect(result.series.cost).toEqual([5]);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('stays silent about duplicates in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      normalize({
        ...empty,
        cost: [
          ['2026-06-10', 1],
          ['2026-06-10', 2],
        ],
      });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('treats date-only strings as the same UTC day across series', () => {
    const data: AdChartData = {
      ...empty,
      cost: [['2026-06-12', 1]],
      cpa: [[Date.UTC(2026, 5, 12), 2]],
    };
    const result = normalize(data);

    expect(result.times).toHaveLength(1);
    expect(result.series.cost).toEqual([1]);
    expect(result.series.cpa).toEqual([2]);
  });
});

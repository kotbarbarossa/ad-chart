import { describe, expect, it } from 'vitest';
import { formatDate, formatValue, toEpochMs } from '../../src/core/format';

describe('toEpochMs', () => {
  it('treats a date-only string as a UTC calendar day', () => {
    expect(toEpochMs('2026-06-12')).toBe(Date.UTC(2026, 5, 12));
  });

  it('passes numbers through as epoch ms', () => {
    expect(toEpochMs(1_700_000_000_000)).toBe(1_700_000_000_000);
  });

  it('accepts Date instances', () => {
    const d = new Date(Date.UTC(2026, 5, 12));
    expect(toEpochMs(d)).toBe(d.getTime());
  });

  it('parses full ISO timestamps', () => {
    expect(toEpochMs('2026-06-12T00:00:00Z')).toBe(Date.UTC(2026, 5, 12));
  });

  it('returns NaN for unparseable input', () => {
    expect(Number.isNaN(toEpochMs('not-a-date'))).toBe(true);
  });
});

describe('formatDate', () => {
  it('formats as DD.MM.YYYY in UTC', () => {
    expect(formatDate(Date.UTC(2026, 5, 12))).toBe('12.06.2026');
  });

  it('zero-pads day and month', () => {
    expect(formatDate(Date.UTC(2026, 0, 3))).toBe('03.01.2026');
  });

  it('does not shift the day across the UTC midnight boundary', () => {
    // 2026-06-12T00:00:00Z must stay the 12th regardless of the host zone.
    expect(formatDate(toEpochMs('2026-06-12'))).toBe('12.06.2026');
  });
});

describe('formatValue', () => {
  it('shows two decimals for cost, cpa and roi', () => {
    expect(formatValue('cost', 44.36)).toBe('44.36');
    expect(formatValue('cpa', 1.2)).toBe('1.20');
    expect(formatValue('roiConfirmed', 161.47)).toBe('161.47');
  });

  it('rounds conversions to a whole number', () => {
    expect(formatValue('conversions', 36)).toBe('36');
    expect(formatValue('conversions', 36.7)).toBe('37');
  });
});

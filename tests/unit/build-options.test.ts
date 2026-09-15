import { describe, expect, it } from 'vitest';
import { buildChartOptions, resolveOptions } from '../../src/core/build-options';
import { normalize } from '../../src/core/normalize';
import { referenceData } from './fixtures';

type LooseSeries = {
  id: string;
  type: string;
  yAxis: number;
  zIndex: number;
  color?: unknown;
  lineWidth?: number;
  marker?: { enabled?: boolean; symbol?: string };
  states?: {
    hover?: {
      color?: string;
      brightness?: number;
      halo?: unknown;
      lineWidth?: number;
      lineWidthPlus?: number;
    };
  };
};

const options = buildChartOptions(normalize(referenceData));
const series = options.series as unknown as LooseSeries[];
const byId = (id: string) => series.find((s) => s.id === id) as LooseSeries;

describe('buildChartOptions: series', () => {
  it('builds the four series with the right Highcharts types', () => {
    expect(series).toHaveLength(4);
    expect(byId('cost').type).toBe('areaspline');
    expect(byId('cpa').type).toBe('column');
    expect(byId('roiConfirmed').type).toBe('spline');
    expect(byId('conversions').type).toBe('line');
  });

  it('lists series in tooltip order but draws ROI on top of Conversions', () => {
    expect(series.map((s) => s.id)).toEqual(['cost', 'cpa', 'roiConfirmed', 'conversions']);
    expect(byId('roiConfirmed').zIndex).toBeGreaterThan(byId('conversions').zIndex);
    expect(byId('conversions').zIndex).toBeGreaterThan(byId('cost').zIndex);
  });

  it('gives Conversions an always-visible square marker', () => {
    expect(byId('conversions').marker?.enabled).toBe(true);
    expect(byId('conversions').marker?.symbol).toBe('square');
  });

  it('hides markers on area and spline at rest', () => {
    expect(byId('cost').marker?.enabled).toBe(false);
    expect(byId('roiConfirmed').marker?.enabled).toBe(false);
  });

  it('puts each series on its own Y-axis', () => {
    expect(series.map((s) => s.yAxis)).toEqual([0, 1, 2, 3]);
  });

  it('draws Cost as a strokeless fill that stays flat on hover', () => {
    const cost = byId('cost');
    expect(cost.lineWidth).toBe(0);
    expect(cost.states?.hover?.lineWidth).toBe(0);
    expect(cost.states?.hover?.lineWidthPlus).toBe(0);
  });

  it('draws ROI with a top-to-bottom vertical stroke gradient', () => {
    const color = byId('roiConfirmed').color as {
      linearGradient?: { x1: number; y1: number; x2: number; y2: number };
      stops?: [number, string][];
    };
    expect(color.linearGradient).toEqual({ x1: 0, y1: 0, x2: 0, y2: 1 });
    const stops = color.stops ?? [];
    expect(stops[0]?.[0]).toBe(0);
    expect(stops.at(-1)?.[0]).toBe(1);
    // Bottom stop (the minimum) is lighter than the top stop.
    expect(stops.at(-1)?.[1]).not.toBe(stops[0]?.[1]);
  });

  it('highlights the hovered CPA column in solid blue with no halo', () => {
    const hover = byId('cpa').states?.hover;
    expect(typeof hover?.color).toBe('string');
    expect(hover?.halo).toBeNull();
  });
});

describe('buildChartOptions: axes and chrome', () => {
  it('creates four hidden Y-axes with dataMax * headroom', () => {
    const yAxes = options.yAxis as unknown as Array<{ visible: boolean; min: number; max: number }>;
    expect(yAxes).toHaveLength(4);
    expect(yAxes.every((a) => a.visible === false)).toBe(true);
    expect(yAxes.every((a) => a.min === 0)).toBe(true);
    // Cost axis (index 0): dataMax 63.75 * headroom 1.18.
    expect(yAxes[0]?.max).toBeCloseTo(63.75 * 1.18, 5);
  });

  it('uses an axis max of 1 for an all-null series', () => {
    const empty = buildChartOptions({
      times: [Date.UTC(2026, 5, 10), Date.UTC(2026, 5, 11)],
      series: {
        cost: [null, null],
        cpa: [null, null],
        roiConfirmed: [null, null],
        conversions: [null, null],
      },
    });
    const yAxes = empty.yAxis as unknown as Array<{ max: number }>;
    expect(yAxes[0]?.max).toBe(1);
  });

  it('uses a shared HTML tooltip', () => {
    const tooltip = options.tooltip as { shared?: boolean; useHTML?: boolean };
    expect(tooltip.shared).toBe(true);
    expect(tooltip.useHTML).toBe(true);
  });

  it('disables legend, credits and title', () => {
    expect((options.legend as { enabled?: boolean }).enabled).toBe(false);
    expect((options.credits as { enabled?: boolean }).enabled).toBe(false);
  });

  it('keeps other series active on hover (inactive state off)', () => {
    const states = options.plotOptions?.series?.states as {
      inactive?: { enabled?: boolean };
    };
    expect(states.inactive?.enabled).toBe(false);
  });

  it('renders a transparent canvas with a light plot border', () => {
    const chart = options.chart as { backgroundColor?: string; plotBorderWidth?: number };
    expect(chart.backgroundColor).toBe('transparent');
    expect(chart.plotBorderWidth).toBe(1);
  });
});

describe('buildChartOptions: tooltip formatter', () => {
  type FormatterPoint = {
    index: number;
    y?: number | null;
    color?: string;
    series: { name: string; color: string; userOptions: { id?: string } };
  };
  const formatter = (options.tooltip as unknown as { formatter: () => string }).formatter;
  const call = (points: FormatterPoint[]) => formatter.call({ points });

  it('formats the hovered date and all present series', () => {
    const html = call([
      {
        index: 2,
        y: 44.36,
        color: '#F2E14F',
        series: { name: 'Cost', color: '#F2E14F', userOptions: { id: 'cost' } },
      },
      {
        index: 2,
        y: 36,
        color: '#BC1FDE',
        series: { name: 'Conversions', color: '#BC1FDE', userOptions: { id: 'conversions' } },
      },
    ]);
    expect(html).toContain('12.06.2026');
    expect(html).toContain('Cost: <b>44.36</b>');
    expect(html).toContain('Conversions: <b>36</b>');
  });

  it('falls back to the series colour and skips missing values', () => {
    const html = call([{ index: 0, series: { name: 'Cost', color: '#111111', userOptions: {} } }]);
    // No value -> row skipped; still renders the header for the first date.
    expect(html).toContain('10.06.2026');
    expect(html).not.toContain('<b>');
  });

  it('handles an empty points array', () => {
    expect(call([])).toContain('10.06.2026');
  });

  it('renders the ROI dot as a solid colour even though its series is a gradient', () => {
    const html = call([
      {
        index: 2,
        y: 161.47,
        // A gradient object, as the real ROI series exposes.
        color: { linearGradient: {}, stops: [] } as unknown as string,
        series: {
          name: 'ROI confirmed',
          color: { linearGradient: {}, stops: [] } as unknown as string,
          userOptions: { id: 'roiConfirmed' },
        },
      },
    ]);
    expect(html).toContain('color:#0C8400');
    expect(html).not.toContain('[object Object]');
  });
});

describe('resolveOptions', () => {
  it('falls back to theme defaults', () => {
    const resolved = resolveOptions();
    expect(resolved.height).toBe(220);
    expect(resolved.labels.roiConfirmed).toBe('ROI confirmed');
  });

  it('applies overrides', () => {
    const resolved = resolveOptions({
      height: 300,
      labels: { cost: 'Spend' },
      colors: { cpa: '#000000' },
      axisHeadroom: { cost: 2 },
    });
    expect(resolved.height).toBe(300);
    expect(resolved.labels.cost).toBe('Spend');
    expect(resolved.labels.cpa).toBe('CPA');
    expect(resolved.colors.cpa).toBe('#000000');
    expect(resolved.axisHeadroom.cost).toBe(2);
  });
});

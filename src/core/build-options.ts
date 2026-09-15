import type { Options, Point, SeriesOptionsType } from '../highcharts';
import { formatValue } from './format';
import {
  COLUMN,
  COLUMN_HOVER_COLOR,
  CONVERSIONS_MARKER,
  COST_FILL,
  DEFAULT_AXIS_HEADROOM,
  DEFAULT_COLORS,
  DEFAULT_LABELS,
  FRAME,
  HALO,
  ROI_GRADIENT_STOPS,
  SERIES_KEYS,
  type SeriesKey,
  STROKE,
  TOOLTIP,
} from './theme';
import { renderTooltip, type TooltipRow } from './tooltip';
import type { AdChartOptions, NormalizedData, ResolvedOptions } from './types';

/** Draw order (SVG z-index): Cost (bottom) -> CPA -> Conversions -> ROI (top). */
const Z_INDEX: Record<SeriesKey, number> = {
  cost: 1,
  cpa: 2,
  conversions: 3,
  roiConfirmed: 4,
};

/** Fill in every option from the theme defaults. */
export function resolveOptions(options: AdChartOptions = {}): ResolvedOptions {
  return {
    height: options.height ?? FRAME.height,
    labels: { ...DEFAULT_LABELS, ...options.labels },
    colors: { ...DEFAULT_COLORS, ...options.colors },
    axisHeadroom: { ...DEFAULT_AXIS_HEADROOM, ...options.axisHeadroom },
  };
}

/** Hidden Y-axis maximum for a series: `dataMax * headroom`, min 0. */
function axisMax(values: readonly (number | null)[], headroom: number): number {
  let dataMax = 0;
  for (const v of values) {
    if (v !== null && v > dataMax) dataMax = v;
  }
  return dataMax > 0 ? dataMax * headroom : 1;
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** One hidden Y-axis per series (no ticks, grid, labels or title). */
function buildYAxes(data: NormalizedData, resolved: ResolvedOptions) {
  return SERIES_KEYS.map((key) => ({
    visible: false,
    min: 0,
    max: axisMax(data.series[key], resolved.axisHeadroom[key]),
    gridLineWidth: 0,
    lineWidth: 0,
    tickLength: 0,
    startOnTick: false,
    endOnTick: false,
    title: { text: '' },
    labels: { enabled: false },
  }));
}

/** Build the four series, in tooltip order (Cost, CPA, ROI, Conversions). */
function buildSeries(data: NormalizedData, resolved: ResolvedOptions): SeriesOptionsType[] {
  const { colors, labels } = resolved;
  const yAxisIndex = (key: SeriesKey) => SERIES_KEYS.indexOf(key);
  const common = (key: SeriesKey) => ({
    id: key,
    name: labels[key],
    color: colors[key],
    data: data.series[key],
    yAxis: yAxisIndex(key),
    zIndex: Z_INDEX[key],
  });

  return [
    {
      ...common('cost'),
      // areaspline: a smooth filled curve, matching the reference's rounded top.
      type: 'areaspline',
      // No visible top edge; the fill alone defines the shape.
      lineWidth: 0,
      fillColor: hexToRgba(COST_FILL.color, COST_FILL.opacity),
      threshold: 0,
      // Keep the fill flat on hover (no edge line appearing or thickening).
      states: { hover: { lineWidth: 0, lineWidthPlus: 0 } },
      marker: {
        enabled: false,
        symbol: 'circle',
        states: {
          hover: {
            enabled: true,
            radius: 4,
            fillColor: '#FFFFFF',
            lineColor: colors.cost,
            lineWidth: 2,
          },
        },
      },
    },
    {
      ...common('cpa'),
      type: 'column',
      borderWidth: 0,
      borderRadius: COLUMN.borderRadius,
      pointWidth: COLUMN.pointWidth,
      // Hovered bar turns vivid blue; no grey halo (that belongs to the lines).
      states: { hover: { color: COLUMN_HOVER_COLOR, brightness: 0, halo: null } },
    },
    {
      ...common('roiConfirmed'),
      type: 'spline',
      lineWidth: STROKE.spline,
      // Vertical stroke gradient (dark top -> light bottom over the path's
      // bounding box). The tooltip dot/marker keep the solid `colors.roiConfirmed`.
      color: {
        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
        stops: ROI_GRADIENT_STOPS.map(([stop, hex]) => [stop, hex] as [number, string]),
      },
      marker: {
        enabled: false,
        symbol: 'diamond',
        states: {
          hover: {
            enabled: true,
            radius: 5,
            fillColor: '#FFFFFF',
            lineColor: colors.roiConfirmed,
            lineWidth: 2,
          },
        },
      },
    },
    {
      ...common('conversions'),
      type: 'line',
      lineWidth: STROKE.line,
      marker: {
        enabled: true,
        symbol: CONVERSIONS_MARKER.symbol,
        radius: CONVERSIONS_MARKER.radius,
        states: {
          hover: {
            enabled: true,
            fillColor: '#FFFFFF',
            lineColor: colors.conversions,
            lineWidth: 2,
          },
        },
      },
    },
  ];
}

/**
 * Pure: turn normalized data + resolved options into a full Highcharts config.
 * This is the only place that knows the vendor's option shape, which keeps the
 * chart definition isolated and testable.
 */
export function buildChartOptions(data: NormalizedData, options: AdChartOptions = {}): Options {
  const resolved = resolveOptions(options);
  const { times } = data;

  return {
    chart: {
      height: resolved.height,
      backgroundColor: FRAME.backgroundColor,
      plotBorderColor: FRAME.borderColor,
      plotBorderWidth: FRAME.borderWidth,
      margin: [1, 1, 1, 1],
      animation: { duration: 300 },
      style: { fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
    },
    title: { text: '' },
    credits: { enabled: false },
    legend: { enabled: false },
    // Decorative chart with a custom tooltip; the a11y module isn't needed.
    accessibility: { enabled: false },
    xAxis: {
      type: 'category',
      visible: false,
      categories: times.map(String),
    },
    yAxis: buildYAxes(data, resolved),
    plotOptions: {
      series: {
        animation: { duration: 300 },
        states: {
          inactive: { enabled: false, opacity: 1 },
          hover: { halo: { size: HALO.size, opacity: HALO.opacity } },
        },
      },
    },
    tooltip: {
      shared: true,
      useHTML: true,
      backgroundColor: TOOLTIP.backgroundColor,
      borderColor: TOOLTIP.borderColor,
      borderRadius: TOOLTIP.borderRadius,
      borderWidth: TOOLTIP.borderWidth,
      padding: TOOLTIP.padding,
      shadow: TOOLTIP.shadow,
      style: { color: TOOLTIP.textColor, fontSize: TOOLTIP.fontSize },
      formatter(this: Point): string {
        const points: Point[] = this.points ?? [];
        const index = points[0]?.index ?? 0;
        const timeMs = times[index] ?? 0;
        const rows: TooltipRow[] = points.map((p) => {
          const key = (p.series.userOptions.id ?? '') as SeriesKey;
          return {
            key,
            label: p.series.name,
            // Always the solid series colour: the ROI series `color` is a
            // gradient object, so the dot must come from the resolved palette.
            color: resolved.colors[key],
            value: p.y ?? null,
          };
        });
        return renderTooltip(timeMs, rows);
      },
    },
    series: buildSeries(data, resolved),
  };
}

// Re-exported so callers can format values consistently with the tooltip.
export { formatValue };

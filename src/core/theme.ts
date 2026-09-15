/**
 * Visual constants for the chart.
 *
 * Every value here was measured from the reference GIF frames (see
 * `scripts/extract-frames.ts`): colours were eyedropped from the tooltip
 * legend dots and stroke centres, and the per-series axis headroom was derived
 * from where each series' extreme point lands inside the plot box.
 *
 * Reference frame geometry (frame 591x295 px, baseline y=391, top y=96):
 *   - Cost max (63.75)        -> 85.8% of plot height -> headroom ~1.18
 *   - ROI max (610.78)        -> 82.4%                -> headroom ~1.23
 *   - Conversions max (90)    -> 77.3%                -> headroom ~1.32
 *   - CPA bars are 1-3 px tall -> very large headroom  -> headroom ~90
 *
 * All of these are overridable through `AdChartOptions` so the look can be
 * tuned without touching code.
 */

/** The four data series the chart always renders, in data order. */
export type SeriesKey = 'cost' | 'cpa' | 'roiConfirmed' | 'conversions';

export const SERIES_KEYS: readonly SeriesKey[] = [
  'cost',
  'cpa',
  'roiConfirmed',
  'conversions',
] as const;

/** Highcharts series type used for each key. */
export const SERIES_TYPE: Record<SeriesKey, 'areaspline' | 'column' | 'spline' | 'line'> = {
  cost: 'areaspline',
  cpa: 'column',
  roiConfirmed: 'spline',
  conversions: 'line',
};

/** Default human-readable labels (shown in the tooltip). Overridable for i18n. */
export const DEFAULT_LABELS: Record<SeriesKey, string> = {
  cost: 'Cost',
  cpa: 'CPA',
  roiConfirmed: 'ROI confirmed',
  conversions: 'Conversions',
};

/**
 * Default series colours (eyedropped from the reference). `roiConfirmed` is the
 * solid dark green used for the tooltip dot and hover marker; the ROI line
 * itself is drawn with `ROI_GRADIENT` (see below).
 */
export const DEFAULT_COLORS: Record<SeriesKey, string> = {
  cost: '#F2E14F',
  cpa: '#3B78F5',
  roiConfirmed: '#0C8400',
  conversions: '#BC1FDE',
};

/**
 * Vertical stroke gradient for the ROI spline (over the curve's bounding box):
 * dark green is held across the top ~60% (the peak at ~10.06 and the rising
 * right leg stay dark, as in the reference) and only the bottom — the minimum
 * at ~13.06 — fades to a lighter lime green. Eyedropped from `docs/frames`.
 */
export const ROI_GRADIENT_STOPS: readonly [number, string][] = [
  [0, '#0C8400'],
  [0.62, '#0C8400'],
  [1, '#3AC201'],
];

/** CPA column hover: the bar under the cursor turns a vivid, saturated blue. */
export const COLUMN_HOVER_COLOR = '#1F6BFF';

/**
 * Per-series axis headroom: the hidden Y-axis maximum is `dataMax * headroom`
 * (axis minimum is always 0). Bigger headroom pushes a series lower in the
 * plot. Tuned so each series lands where it does in the reference.
 */
export const DEFAULT_AXIS_HEADROOM: Record<SeriesKey, number> = {
  cost: 1.18,
  cpa: 90,
  roiConfirmed: 1.23,
  conversions: 1.32,
};

/** Cost area fill (semi-transparent yellow over the page background). */
export const COST_FILL = {
  color: '#FFF3B0',
  opacity: 0.85,
} as const;

/** Stroke widths, in px at the default height. */
export const STROKE = {
  spline: 6,
  line: 1.5,
} as const;

/** Conversions line marker (always visible square). */
export const CONVERSIONS_MARKER = {
  symbol: 'square',
  radius: 4,
} as const;

/** Hover halo shared by every series' active point. */
export const HALO = {
  size: 10,
  opacity: 0.25,
} as const;

/** CPA column geometry. */
export const COLUMN = {
  borderRadius: 2,
  pointWidth: 16,
} as const;

/** Plot frame and canvas. */
export const FRAME = {
  /** Default chart height in px; width is fluid to the container. */
  height: 220,
  /** Transparent so the host background (e.g. the pink cell) shows through. */
  backgroundColor: 'transparent',
  borderColor: '#CCCCCC',
  borderWidth: 1,
} as const;

/** Tooltip styling (white card, soft shadow, dark-grey text). */
export const TOOLTIP = {
  backgroundColor: '#FFFFFF',
  borderColor: '#E6E6E6',
  borderRadius: 4,
  borderWidth: 1,
  padding: 10,
  textColor: '#333333',
  fontSize: '13px',
  shadow: true,
} as const;

/** Colours used only by the demo page decoration (not part of the chart). */
export const DEMO_DECOR = {
  pinkCell: '#FCEBEB',
  topBar: '#E5F0FC',
} as const;

import { buildChartOptions } from './core/build-options';
import { normalize } from './core/normalize';
import { parseAdChartData } from './core/schema';
import type { AdChartData, AdChartOptions } from './core/types';
import { type Chart, Highcharts } from './highcharts';

export type { SeriesKey } from './core/theme';
export type {
  AdChartData,
  AdChartOptions,
  TimePoint,
  TimePointObject,
  TimePointTuple,
} from './core/types';

/** Handle returned by {@link createAdChart}. */
export interface AdChartInstance {
  /** Re-render with new data (validated and re-normalized). Options are kept. */
  update(data: AdChartData): void;
  /** Detach listeners and destroy the underlying Highcharts instance. */
  destroy(): void;
  /** The underlying Highcharts chart, for advanced use. */
  readonly highcharts: Chart;
}

function resolveContainer(container: HTMLElement | string): HTMLElement {
  if (typeof container !== 'string') {
    return container;
  }
  const el = document.querySelector(container);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`ad-chart: no element found for selector "${container}".`);
  }
  return el;
}

/**
 * Create the combined time-series chart in `container`.
 *
 * @param container A DOM element or a CSS selector.
 * @param data      The four series (see {@link AdChartData}).
 * @param options   Optional visual overrides.
 */
export function createAdChart(
  container: HTMLElement | string,
  data: AdChartData,
  options: AdChartOptions = {},
): AdChartInstance {
  const el = resolveContainer(container);

  const render = (input: AdChartData) =>
    buildChartOptions(normalize(parseAdChartData(input)), options);

  const chart = Highcharts.chart(el, render(data));

  // Keep the chart in sync with its container's size.
  const resizeObserver = new ResizeObserver(() => chart.reflow());
  resizeObserver.observe(el);

  return {
    update(next: AdChartData): void {
      chart.update(render(next), true, true);
    },
    destroy(): void {
      resizeObserver.disconnect();
      chart.destroy();
    },
    highcharts: chart,
  };
}

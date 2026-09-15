import { type CSSProperties, useEffect, useRef } from 'react';
import type { AdChartData, AdChartOptions } from './core/types';
import { type AdChartInstance, createAdChart } from './index';

export type { AdChartData, AdChartOptions } from './core/types';

export interface AdChartProps extends AdChartOptions {
  /** The four series to render. */
  data: AdChartData;
  className?: string;
  style?: CSSProperties;
}

/**
 * React wrapper around {@link createAdChart} — a thin adapter over the
 * framework-agnostic core, so validation, normalization, resize handling and
 * teardown are shared with the vanilla API.
 *
 * The chart is created on mount; `data` changes call `update`. Visual options
 * are read on mount — change the `key` prop to apply new options.
 */
export function AdChart({ data, className, style, ...options }: AdChartProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<AdChartInstance | null>(null);
  const dataRef = useRef(data);
  const optionsRef = useRef(options);
  dataRef.current = data;
  optionsRef.current = options;

  // Create on mount, destroy on unmount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = createAdChart(container, dataRef.current, optionsRef.current);
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  // Re-render when the data changes.
  useEffect(() => {
    chartRef.current?.update(data);
  }, [data]);

  return <div ref={containerRef} className={className} style={style} />;
}

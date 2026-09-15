/**
 * Single place where Highcharts and its modules are imported.
 *
 * Keeping every Highcharts import here means the rest of the codebase never
 * touches the vendor directly, so swapping the charting library later only
 * changes this file plus `createAdChart`.
 */
import Highcharts from 'highcharts';

export type {
  Chart,
  Options,
  Point,
  PointOptionsObject,
  SeriesOptionsType,
  XAxisOptions,
  YAxisOptions,
} from 'highcharts';
export { Highcharts };

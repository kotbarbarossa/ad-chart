import { describe, expect, it } from 'vitest';
import { renderTooltip, type TooltipRow } from '../../src/core/tooltip';

const rows: TooltipRow[] = [
  { key: 'cost', label: 'Cost', color: '#F2E14F', value: 44.36 },
  { key: 'cpa', label: 'CPA', color: '#3B78F5', value: 1.23 },
  { key: 'roiConfirmed', label: 'ROI confirmed', color: '#149400', value: 161.47 },
  { key: 'conversions', label: 'Conversions', color: '#BC1FDE', value: 36 },
];

describe('renderTooltip', () => {
  const html = renderTooltip(Date.UTC(2026, 5, 12), rows);

  it('renders the date header as DD.MM.YYYY', () => {
    expect(html).toContain('12.06.2026');
  });

  it('shows two decimals for cost, cpa and roi', () => {
    expect(html).toContain('Cost: <b>44.36</b>');
    expect(html).toContain('CPA: <b>1.23</b>');
    expect(html).toContain('ROI confirmed: <b>161.47</b>');
  });

  it('shows conversions as a whole number', () => {
    expect(html).toContain('Conversions: <b>36</b>');
  });

  it('colours each dot with the series colour', () => {
    expect(html).toContain('style="color:#149400"');
  });

  it('skips series that have no value at this date', () => {
    const partial = renderTooltip(Date.UTC(2026, 5, 12), [
      { key: 'cost', label: 'Cost', color: '#F2E14F', value: 44.36 },
      { key: 'roiConfirmed', label: 'ROI confirmed', color: '#149400', value: null },
    ]);
    expect(partial).toContain('Cost:');
    expect(partial).not.toContain('ROI confirmed');
  });

  it('escapes HTML in labels', () => {
    const html2 = renderTooltip(Date.UTC(2026, 5, 12), [
      { key: 'cost', label: '<img src=x>', color: '#000', value: 1 },
    ]);
    expect(html2).not.toContain('<img');
    expect(html2).toContain('&lt;img');
  });
});

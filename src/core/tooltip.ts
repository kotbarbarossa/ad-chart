import { formatDate, formatValue } from './format';
import type { SeriesKey } from './theme';

export interface TooltipRow {
  key: SeriesKey;
  label: string;
  color: string;
  value: number | null;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/**
 * Render the shared tooltip as HTML: a `DD.MM.YYYY` header followed by one
 * coloured-dot row per series. Rows without a value at this date are skipped.
 */
export function renderTooltip(timeMs: number, rows: TooltipRow[]): string {
  const header = `<div class="adc-tt__date">${formatDate(timeMs)}</div>`;

  const body = rows
    .filter((row): row is TooltipRow & { value: number } => row.value !== null)
    .map((row) => {
      const dot = `<span class="adc-tt__dot" style="color:${row.color}">●</span>`;
      const name = escapeHtml(row.label);
      const val = formatValue(row.key, row.value);
      return `<div class="adc-tt__row">${dot} ${name}: <b>${val}</b></div>`;
    })
    .join('');

  return `<div class="adc-tt">${header}${body}</div>`;
}

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { type AdChartInstance, createAdChart } from '../src/index';
import { AdChart } from '../src/react';
import { randomData, referenceData } from './data';

// The in-context chart (pink table row) always uses the vanilla API.
const contextChart = createAdChart('#chart-context', referenceData);

// The "on white" chart can be rendered by either the vanilla or React entry,
// toggled below — same data, same look.
const plainEl = document.querySelector<HTMLDivElement>('#chart-plain');
let currentData = referenceData;
let mode: 'vanilla' | 'react' = 'vanilla';
let vanillaChart: AdChartInstance | null = null;
let reactRoot: Root | null = null;

function renderPlain(): void {
  if (!plainEl) return;
  vanillaChart?.destroy();
  vanillaChart = null;
  reactRoot?.unmount();
  reactRoot = null;
  plainEl.replaceChildren();

  if (mode === 'vanilla') {
    vanillaChart = createAdChart(plainEl, currentData);
  } else {
    reactRoot = createRoot(plainEl);
    reactRoot.render(createElement(AdChart, { data: currentData }));
  }
}

function setMode(next: 'vanilla' | 'react'): void {
  mode = next;
  document.querySelector('#mode-vanilla')?.classList.toggle('is-active', next === 'vanilla');
  document.querySelector('#mode-react')?.classList.toggle('is-active', next === 'react');
  renderPlain();
}

document.querySelector('#mode-vanilla')?.addEventListener('click', () => setMode('vanilla'));
document.querySelector('#mode-react')?.addEventListener('click', () => setMode('react'));

document.querySelector('#randomize')?.addEventListener('click', () => {
  currentData = randomData();
  contextChart.update(currentData);
  if (mode === 'vanilla') {
    vanillaChart?.update(currentData);
  } else {
    renderPlain();
  }
});

renderPlain();

// Dev-only handle for screenshots / e2e (stripped from the production build).
if (import.meta.env.DEV) {
  (window as unknown as { __adchart?: unknown }).__adchart = { contextChart };
}

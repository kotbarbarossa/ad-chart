import { createAdChart } from '../src/index';
import { randomData, referenceData } from './data';

const contextChart = createAdChart('#chart-context', referenceData, { height: 220 });
const plainChart = createAdChart('#chart-plain', referenceData, { height: 220 });

const randomizeButton = document.querySelector<HTMLButtonElement>('#randomize');
randomizeButton?.addEventListener('click', () => {
  const next = randomData();
  contextChart.update(next);
  plainChart.update(next);
});

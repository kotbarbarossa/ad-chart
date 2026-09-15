import { VERSION } from '../src/index';

// Scaffold placeholder: the real demo (reference data + chart) lands with the
// vanilla API stage.
const el = document.querySelector<HTMLDivElement>('#chart');
if (el) {
  el.textContent = `ad-chart v${VERSION} — chart coming soon`;
}

import { registerMthProgressBar } from './element.js';

export * from './element.js';

registerMthProgressBar();

declare global {
  interface HTMLElementTagNameMap {
    'mth-progress-bar': import('./progress-bar.js').MthProgressBar;
  }
}

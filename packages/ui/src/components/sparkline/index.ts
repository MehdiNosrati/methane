import { registerMthSparkline } from './element.js';

export * from './element.js';

registerMthSparkline();

declare global {
  interface HTMLElementTagNameMap {
    'mth-sparkline': import('./sparkline.js').MthSparkline;
  }
}

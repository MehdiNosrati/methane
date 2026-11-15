import { registerMthErrorSummary } from './element.js';

export * from './element.js';

registerMthErrorSummary();

declare global {
  interface HTMLElementTagNameMap {
    'mth-error-summary': import('./error-summary.js').MthErrorSummary;
  }
}

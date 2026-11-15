import { registerMthReviewSummary } from './element.js';

export * from './element.js';

registerMthReviewSummary();

declare global {
  interface HTMLElementTagNameMap {
    'mth-review-summary': import('./review-summary.js').MthReviewSummary;
  }
}

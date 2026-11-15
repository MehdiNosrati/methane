import { getRuntime } from '@methane-ui/core';
import { MthReviewSummary } from './element.js';

export { MthReviewSummary } from './element.js';
export { reviewSummaryMessages } from './review-summary.messages.js';
export { reviewSummarySpec } from './review-summary.spec.js';

export function registerMthReviewSummary(prefix = 'mth'): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents({
    prefix,
    components: {
      'mth-review-summary': MthReviewSummary,
    },
  });
}

registerMthReviewSummary();

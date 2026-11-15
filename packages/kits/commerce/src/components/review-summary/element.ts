import { defineComponents } from '@methane-ui/core';
import { MthReviewSummary } from './review-summary.js';

export { MthReviewSummary } from './review-summary.js';
export { reviewSummaryMessages } from './review-summary.messages.js';

export function registerMthReviewSummary(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-review-summary': MthReviewSummary },
  });
}

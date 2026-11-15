import { defineComponents } from '@methane-ui/core';
import { MthErrorSummary } from './error-summary.js';

export { MthErrorSummary, type ErrorSummaryItem } from './error-summary.js';
export { errorSummaryMessages } from './error-summary.messages.js';
export { errorSummarySpec } from './error-summary.spec.js';
export { errorSummaryStyles } from './error-summary.styles.js';

export function registerMthErrorSummary(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-error-summary': MthErrorSummary },
  });
}

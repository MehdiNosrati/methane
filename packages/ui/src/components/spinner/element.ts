import { defineComponents } from '@methane/core';
import { MthSpinner } from './spinner.js';

export { MthSpinner, type MthSpinnerSize } from './spinner.js';
export { spinnerMessages } from './spinner.messages.js';
export { spinnerSpec } from './spinner.spec.js';
export { spinnerStyles } from './spinner.styles.js';

export function registerMthSpinner(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-spinner': MthSpinner },
  });
}

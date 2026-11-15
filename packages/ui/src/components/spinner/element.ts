import { defineComponents } from '@methane-ui/core';
import { MthSpinner } from './spinner.js';

export { MthSpinner, type MthSpinnerSize } from './spinner.js';
export { spinnerMessages } from './spinner.messages.js';
export { spinnerStyles } from './spinner.styles.js';

export function registerMthSpinner(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-spinner': MthSpinner },
  });
}

import { defineComponents } from '@methane-ui/core';
import { MthNumberInput } from './number-input.js';

export { MthNumberInput } from './number-input.js';
export { numberInputMessages } from './number-input.messages.js';
export { numberInputStyles } from './number-input.styles.js';

export function registerMthNumberInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-number-input': MthNumberInput },
  });
}

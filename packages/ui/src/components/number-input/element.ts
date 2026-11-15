import { defineComponents } from '@methane/core';
import { MthNumberInput } from './number-input.js';

export { MthNumberInput } from './number-input.js';
export { numberInputMessages } from './number-input.messages.js';
export { numberInputSpec } from './number-input.spec.js';
export { numberInputStyles } from './number-input.styles.js';

export function registerMthNumberInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-number-input': MthNumberInput },
  });
}

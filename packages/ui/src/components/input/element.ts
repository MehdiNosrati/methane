import { defineComponents } from '@methane-ui/core';
import { MthInput } from './input.js';

export { MthInput, type MthInputType } from './input.js';
export { inputMessages } from './input.messages.js';
export { inputSpec } from './input.spec.js';
export { inputStyles } from './input.styles.js';

export function registerMthInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-input': MthInput },
  });
}

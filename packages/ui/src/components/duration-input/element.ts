import { defineComponents } from '@methane-ui/core';
import { MthDurationInput } from './duration-input.js';

export { MthDurationInput } from './duration-input.js';
export { durationInputMessages } from './duration-input.messages.js';
export { durationInputStyles } from './duration-input.styles.js';

export function registerMthDurationInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-duration-input': MthDurationInput },
  });
}

import { defineComponents } from '@methane/core';
import { MthProgressBar } from './progress-bar.js';

export { MthProgressBar } from './progress-bar.js';
export { progressBarMessages } from './progress-bar.messages.js';
export { progressBarSpec } from './progress-bar.spec.js';
export { progressBarStyles } from './progress-bar.styles.js';

export function registerMthProgressBar(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-progress-bar': MthProgressBar },
  });
}

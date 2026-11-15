import { defineComponents } from '@methane/core';
import { MthTagInput } from './tag-input.js';

export { MthTagInput } from './tag-input.js';
export { tagInputMessages, type TagInputMessages } from './tag-input.messages.js';
export { tagInputSpec } from './tag-input.spec.js';
export { tagInputStyles } from './tag-input.styles.js';

export function registerMthTagInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-tag-input': MthTagInput },
  });
}

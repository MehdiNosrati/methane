import { defineComponents } from '@methane-ui/core';
import { MthTag } from './tag.js';

export { MthTag, type MthTagSize, type MthTagVariant } from './tag.js';
export { tagMessages } from './tag.messages.js';
export { tagSpec } from './tag.spec.js';
export { tagStyles } from './tag.styles.js';

export function registerMthTag(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-tag': MthTag },
  });
}

import { defineComponents } from '@methane/core';
import { MthInlineStatus } from './inline-status.js';

export {
  MthInlineStatus,
  type InlineStatusLiveMode,
  type InlineStatusVariant,
} from './inline-status.js';
export { inlineStatusMessages } from './inline-status.messages.js';
export { inlineStatusSpec } from './inline-status.spec.js';
export { inlineStatusStyles } from './inline-status.styles.js';

export function registerMthInlineStatus(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-inline-status': MthInlineStatus,
    },
  });
}

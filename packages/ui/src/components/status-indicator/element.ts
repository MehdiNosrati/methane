import { defineComponents } from '@methane-ui/core';
import { MthStatusIndicator } from './status-indicator.js';

export {
  MthStatusIndicator,
  type StatusIndicatorSize,
  type StatusIndicatorValue,
} from './status-indicator.js';
export { statusIndicatorMessages } from './status-indicator.messages.js';
export { statusIndicatorStyles } from './status-indicator.styles.js';

export function registerMthStatusIndicator(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-status-indicator': MthStatusIndicator,
    },
  });
}

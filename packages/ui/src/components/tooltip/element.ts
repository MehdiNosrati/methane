import { defineComponents } from '@methane-ui/core';
import { MthTooltip } from './tooltip.js';

export { MthTooltip } from './tooltip.js';
export { tooltipMessages } from './tooltip.messages.js';
export { tooltipStyles } from './tooltip.styles.js';

export function registerMthTooltip(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-tooltip': MthTooltip },
  });
}

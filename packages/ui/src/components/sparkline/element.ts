import { defineComponents } from '@methane/core';
import { MthSparkline } from './sparkline.js';

export {
  MthSparkline,
  type MthSparklineType,
  type MthSparklineVariant,
} from './sparkline.js';
export { sparklineMessages } from './sparkline.messages.js';
export { sparklineSpec } from './sparkline.spec.js';
export { sparklineStyles } from './sparkline.styles.js';

export function registerMthSparkline(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-sparkline': MthSparkline },
  });
}

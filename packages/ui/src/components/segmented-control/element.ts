import { defineComponents } from '@methane/core';
import { MthSegmentedControl } from './segmented-control.js';

export {
  MthSegmentedControl,
  type SegmentedControlOption,
  type SegmentedControlSize,
} from './segmented-control.js';
export {
  segmentedControlMessages,
  type SegmentedControlMessages,
} from './segmented-control.messages.js';
export { segmentedControlSpec } from './segmented-control.spec.js';
export { segmentedControlStyles } from './segmented-control.styles.js';

export function registerMthSegmentedControl(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-segmented-control': MthSegmentedControl },
  });
}

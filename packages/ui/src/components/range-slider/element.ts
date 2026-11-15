import { defineComponents } from '@methane/core';
import { MthRangeSlider } from './range-slider.js';

export { MthRangeSlider, type RangeSliderSize } from './range-slider.js';
export { rangeSliderMessages, type RangeSliderMessages } from './range-slider.messages.js';
export { rangeSliderSpec } from './range-slider.spec.js';
export { rangeSliderStyles } from './range-slider.styles.js';

export function registerMthRangeSlider(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-range-slider': MthRangeSlider },
  });
}

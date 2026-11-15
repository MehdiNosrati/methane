import { defineComponents } from '@methane-ui/core';
import { MthRangeSlider } from './range-slider.js';

export { MthRangeSlider, type RangeSliderSize } from './range-slider.js';
export { rangeSliderMessages, type RangeSliderMessages } from './range-slider.messages.js';
export { rangeSliderStyles } from './range-slider.styles.js';

export function registerMthRangeSlider(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-range-slider': MthRangeSlider },
  });
}

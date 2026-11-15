import { defineComponents } from '@methane/core';
import { MthSlider } from './slider.js';

export { MthSlider, type SliderOrientation, type SliderSize } from './slider.js';
export { sliderMessages, type SliderMessages } from './slider.messages.js';
export { sliderSpec } from './slider.spec.js';
export { sliderStyles } from './slider.styles.js';

export function registerMthSlider(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-slider': MthSlider },
  });
}

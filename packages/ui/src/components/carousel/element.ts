import { defineComponents } from '@methane/core';
import { MthCarousel } from './carousel.js';

export { MthCarousel } from './carousel.js';
export { carouselMessages, type CarouselMessages } from './carousel.messages.js';
export { carouselSpec } from './carousel.spec.js';
export { carouselStyles } from './carousel.styles.js';

export function registerMthCarousel(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-carousel': MthCarousel },
  });
}

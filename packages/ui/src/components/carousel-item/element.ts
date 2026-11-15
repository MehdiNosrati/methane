import { defineComponents } from '@methane-ui/core';
import { MthCarouselItem } from './carousel-item.js';

export { MthCarouselItem } from './carousel-item.js';
export { carouselItemMessages, type CarouselItemMessages } from './carousel-item.messages.js';
export { carouselItemStyles } from './carousel-item.styles.js';

export function registerMthCarouselItem(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-carousel-item': MthCarouselItem },
  });
}

import { defineComponents } from '@methane-ui/core';
import { MthRating } from './rating.js';

export { MthRating, type RatingSize } from './rating.js';
export { ratingMessages, type RatingMessages } from './rating.messages.js';
export { ratingStyles } from './rating.styles.js';

export function registerMthRating(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-rating': MthRating },
  });
}

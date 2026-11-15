import { defineComponents } from '@methane/core';
import { MthRating } from './rating.js';

export { MthRating, type RatingSize } from './rating.js';
export { ratingMessages, type RatingMessages } from './rating.messages.js';
export { ratingSpec } from './rating.spec.js';
export { ratingStyles } from './rating.styles.js';

export function registerMthRating(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-rating': MthRating },
  });
}

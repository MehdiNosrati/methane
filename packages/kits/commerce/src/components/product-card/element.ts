import { defineComponents } from '@methane-ui/core';
import { MthProductCard } from './product-card.js';

export { MthProductCard } from './product-card.js';
export { productCardMessages } from './product-card.messages.js';

export function registerMthProductCard(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-product-card': MthProductCard },
  });
}

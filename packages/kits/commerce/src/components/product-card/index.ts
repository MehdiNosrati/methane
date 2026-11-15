import { getRuntime } from '@methane-ui/core';
import { MthProductCard } from './element.js';

export { MthProductCard } from './element.js';
export { productCardMessages } from './product-card.messages.js';
export { productCardSpec } from './product-card.spec.js';

export function registerMthProductCard(prefix = 'mth'): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents({
    prefix,
    components: {
      'mth-product-card': MthProductCard,
    },
  });
}

registerMthProductCard();

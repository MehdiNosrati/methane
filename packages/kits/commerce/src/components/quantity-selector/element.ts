import { defineComponents } from '@methane-ui/core';
import { MthQuantitySelector } from './quantity-selector.js';

export { MthQuantitySelector } from './quantity-selector.js';
export { quantitySelectorMessages } from './quantity-selector.messages.js';

export function registerMthQuantitySelector(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-quantity-selector': MthQuantitySelector },
  });
}

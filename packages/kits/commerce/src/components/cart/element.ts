import { defineComponents } from '@methane-ui/core';
import { MthCart } from './cart.js';

export { MthCart, type CartItem } from './cart.js';
export { cartMessages } from './cart.messages.js';

export function registerMthCart(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-cart': MthCart },
  });
}

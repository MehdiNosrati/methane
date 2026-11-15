import { getRuntime } from '@methane-ui/core';
import { MthCart } from './element.js';

export { MthCart, type CartItem } from './element.js';
export { cartMessages } from './cart.messages.js';
export { cartSpec } from './cart.spec.js';

export function registerMthCart(prefix = 'mth'): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents({
    prefix,
    components: {
      'mth-cart': MthCart,
    },
  });
}

registerMthCart();

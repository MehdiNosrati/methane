import { getRuntime } from '@methane-ui/core';
import { MthQuantitySelector } from './element.js';

export { MthQuantitySelector } from './element.js';
export { quantitySelectorMessages } from './quantity-selector.messages.js';
export { quantitySelectorSpec } from './quantity-selector.spec.js';

export function registerMthQuantitySelector(prefix = 'mth'): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents({
    prefix,
    components: {
      'mth-quantity-selector': MthQuantitySelector,
    },
  });
}

registerMthQuantitySelector();

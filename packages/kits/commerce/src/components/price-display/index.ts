import { getRuntime } from '@methane/core';
import { MthPriceDisplay } from './element.js';

export { MthPriceDisplay } from './element.js';
export { priceDisplayMessages } from './price-display.messages.js';
export { priceDisplaySpec } from './price-display.spec.js';

export function registerMthPriceDisplay(prefix = 'mth'): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents({
    prefix,
    components: {
      'mth-price-display': MthPriceDisplay,
    },
  });
}

registerMthPriceDisplay();

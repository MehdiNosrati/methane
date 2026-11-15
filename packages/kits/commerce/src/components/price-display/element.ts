import { defineComponents } from '@methane-ui/core';
import { MthPriceDisplay } from './price-display.js';

export { MthPriceDisplay } from './price-display.js';
export { priceDisplayMessages } from './price-display.messages.js';

export function registerMthPriceDisplay(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-price-display': MthPriceDisplay },
  });
}

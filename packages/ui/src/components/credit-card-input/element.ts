import { defineComponents } from '@methane-ui/core';
import { MthCreditCardInput } from './credit-card-input.js';

export { MthCreditCardInput, detectCardBrand, type CardBrand } from './credit-card-input.js';
export { creditCardInputMessages } from './credit-card-input.messages.js';
export { creditCardInputStyles } from './credit-card-input.styles.js';

export function registerMthCreditCardInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-credit-card-input': MthCreditCardInput },
  });
}
